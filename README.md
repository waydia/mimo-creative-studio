# MiMo Creative Studio

> AI Creative Studio powered by **Xiaomi MiMo API** — showcasing chat, image analysis, voice synthesis, and code assistance capabilities.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green)
![MiMo](https://img.shields.io/badge/Xiaomi_MiMo-V2.5-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Overview

MiMo Creative Studio is a full-featured web application that integrates multiple Xiaomi MiMo AI capabilities into a unified, modern interface. Built for the **Xiaomi MiMo Orbit 100T Token Creator Incentive Program**, this project demonstrates creative and practical use of MiMo's AI models across four key domains.

### Features

| Feature | Model | Description |
|---------|-------|-------------|
| **AI Chat** | MiMo-V2.5-Pro | Advanced reasoning and text generation with streaming support |
| **Image Analysis** | MiMo-V2.5 | Multimodal understanding — upload images for detailed AI analysis |
| **Code Assistant** | MiMo-V2.5-Pro | Code review, explanation, optimization, test generation, and conversion |
| **Voice Synthesis** | MiMo-V2.5-TTS | Natural text-to-speech with multiple voice options |

### Tech Stack

- **Backend**: Python + FastAPI with async HTTP client
- **Frontend**: Vanilla HTML/CSS/JS — modern dark theme, responsive design
- **API**: OpenAI-compatible format via Xiaomi MiMo API Platform
- **Models**: MiMo-V2.5-Pro, MiMo-V2.5 (multimodal), MiMo-V2.5-TTS

## Getting Started

### Prerequisites

- Python 3.10+
- A Xiaomi MiMo API key ([Get one here](https://platform.xiaomimimo.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mimo-creative-studio.git
cd mimo-creative-studio

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Configure API key
cp .env.example .env
# Edit .env and add your MIMO_API_KEY
```

### Run the Application

```bash
python app.py
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

### Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `MIMO_API_KEY` | — | Your Xiaomi MiMo API key (required) |
| `MIMO_BASE_URL` | `https://api.xiaomimimo.com/v1` | MiMo API base URL |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Web UI |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/chat` | Text chat with MiMo |
| `POST` | `/api/chat/stream` | Streaming chat |
| `POST` | `/api/image/analyze` | Image analysis (multipart) |
| `POST` | `/api/code` | Code assistant |
| `POST` | `/api/tts` | Text-to-speech |

## Project Structure

```
mimo-creative-studio/
├── app.py              # FastAPI backend with all API routes
├── pyproject.toml      # Project metadata and dependencies
├── .env.example        # Environment configuration template
├── README.md           # This file
├── templates/
│   └── index.html      # Main HTML template
└── static/
    ├── style.css       # Dark theme styles
    └── app.js          # Frontend JavaScript
```

## MiMo Models Used

- **[MiMo-V2.5-Pro](https://mimo.xiaomi.com/)** — Flagship reasoning model for coding, agent workflows, and complex tasks. 1M context window, 128K output.
- **[MiMo-V2.5](https://mimo.xiaomi.com/)** — Full multimodal model supporting text, image, video, and audio understanding.
- **[MiMo-V2.5-TTS](https://mimo.xiaomi.com/)** — Expressive text-to-speech with built-in voices and style control.

## Use Cases

1. **Developers** — Use the Code Assistant for code review, optimization, and test generation
2. **Content Creators** — Generate voiceovers with TTS, analyze visual content
3. **Researchers** — Leverage MiMo's reasoning for analysis and explanation
4. **Students** — Get code explanations and learning assistance

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Xiaomi MiMo](https://mimo.xiaomi.com/) — for the powerful AI models
- [Xiaomi MiMo API Platform](https://platform.xiaomimimo.com/) — for API access
- [Xiaomi MiMo Orbit 100T Program](https://100t.xiaomimimo.com/) — for the creator incentive program
