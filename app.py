"""MiMo Creative Studio - AI Creative Studio powered by Xiaomi MiMo API."""

import base64
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))

MIMO_API_KEY = os.getenv("MIMO_API_KEY", "")
MIMO_BASE_URL = os.getenv("MIMO_BASE_URL", "https://api.xiaomimimo.com/v1")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    app.state.http_client = httpx.AsyncClient(
        base_url=MIMO_BASE_URL,
        headers={
            "Authorization": f"Bearer {MIMO_API_KEY}",
            "Content-Type": "application/json",
        },
        timeout=120.0,
    )
    yield
    await app.state.http_client.aclose()


app = FastAPI(
    title="MiMo Creative Studio",
    description="AI Creative Studio powered by Xiaomi MiMo API",
    version="1.0.0",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))


class ChatRequest(BaseModel):
    message: str
    model: str = "mimo-v2.5-pro"
    system_prompt: str = ""
    temperature: float = 0.7
    max_tokens: int = 4096


class CodeRequest(BaseModel):
    code: str
    action: str = "review"
    language: str = "python"
    model: str = "mimo-v2.5-pro"


class TTSRequest(BaseModel):
    text: str
    model: str = "mimo-v2.5-tts"
    voice: str = "narrator"


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(request, "index.html")


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "api_configured": "yes" if MIMO_API_KEY else "no"}


@app.post("/api/chat")
async def chat(req: ChatRequest) -> dict[str, str]:
    client: httpx.AsyncClient = app.state.http_client

    messages = []
    if req.system_prompt:
        messages.append({"role": "system", "content": req.system_prompt})
    messages.append({"role": "user", "content": req.message})

    payload = {
        "model": req.model,
        "messages": messages,
        "temperature": req.temperature,
        "max_tokens": req.max_tokens,
    }

    try:
        response = await client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return {"response": content, "model": req.model}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API Error: {str(e)}") from e


@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest) -> StreamingResponse:
    client: httpx.AsyncClient = app.state.http_client

    messages = []
    if req.system_prompt:
        messages.append({"role": "system", "content": req.system_prompt})
    messages.append({"role": "user", "content": req.message})

    payload = {
        "model": req.model,
        "messages": messages,
        "temperature": req.temperature,
        "max_tokens": req.max_tokens,
        "stream": True,
    }

    async def generate() -> AsyncGenerator[bytes, None]:
        try:
            async with client.stream("POST", "/chat/completions", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        yield f"{line}\n\n".encode()
        except Exception as e:
            yield f'data: {{"error": "{str(e)}"}}\n\n'.encode()

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/api/image/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    prompt: str = Form("Describe this image in detail."),
    model: str = Form("mimo-v2.5"),
) -> dict[str, str]:
    client: httpx.AsyncClient = app.state.http_client

    image_data = await image.read()
    base64_image = base64.b64encode(image_data).decode("utf-8")
    mime_type = image.content_type or "image/jpeg"

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}",
                        },
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
        "max_tokens": 4096,
    }

    try:
        response = await client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return {"response": content, "model": model}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API Error: {str(e)}") from e


@app.post("/api/code")
async def code_assistant(req: CodeRequest) -> dict[str, str]:
    client: httpx.AsyncClient = app.state.http_client

    action_prompts = {
        "review": (
            f"Review the following {req.language} code. "
            "Identify bugs, performance issues, and suggest improvements. "
            "Be specific and provide corrected code where applicable."
        ),
        "explain": (
            f"Explain the following {req.language} code in detail. "
            "Break down what each part does and explain the logic flow."
        ),
        "optimize": (
            f"Optimize the following {req.language} code for better performance "
            "and readability. Provide the optimized version with explanations."
        ),
        "convert": (
            f"Convert the following {req.language} code to Python. "
            "Maintain the same logic and functionality."
        ),
        "test": (
            f"Generate comprehensive unit tests for the following {req.language} code. "
            "Cover edge cases and common scenarios."
        ),
    }

    system_prompt = action_prompts.get(req.action, action_prompts["review"])

    payload = {
        "model": req.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"```{req.language}\n{req.code}\n```"},
        ],
        "temperature": 0.3,
        "max_tokens": 4096,
    }

    try:
        response = await client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return {"response": content, "model": req.model, "action": req.action}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API Error: {str(e)}") from e


@app.post("/api/tts")
async def text_to_speech(req: TTSRequest) -> StreamingResponse:
    client: httpx.AsyncClient = app.state.http_client

    payload = {
        "model": req.model,
        "input": req.text,
        "voice": req.voice,
        "response_format": "mp3",
    }

    try:
        response = await client.post("/audio/speech", json=payload)
        response.raise_for_status()

        return StreamingResponse(
            content=iter([response.content]),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"},
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API Error: {str(e)}") from e


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
