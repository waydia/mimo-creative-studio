// MiMo Creative Studio - Frontend Application

// ===== Tab Navigation =====
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// ===== Chat =====
function handleChatKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChat();
    }
}

function sendSuggestion(text) {
    document.getElementById('chat-input').value = text;
    sendChat();
}

async function sendChat() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    const messagesDiv = document.getElementById('chat-messages');

    // Clear welcome message
    const welcome = messagesDiv.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    // Add user message
    appendMessage('user', message);
    input.value = '';
    autoResize(input);

    // Add loading
    const loadingId = appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                model: 'mimo-v2.5-pro',
                temperature: 0.7,
                max_tokens: 4096
            })
        });

        removeLoading(loadingId);

        if (!response.ok) {
            const err = await response.json();
            appendMessage('assistant', `Error: ${err.detail || 'Something went wrong'}`);
            return;
        }

        const data = await response.json();
        appendMessage('assistant', data.response);
    } catch (error) {
        removeLoading(loadingId);
        appendMessage('assistant', `Connection error: ${error.message}. Make sure the server is running and MIMO_API_KEY is configured.`);
    }
}

function appendMessage(role, content) {
    const messagesDiv = document.getElementById('chat-messages');
    const avatar = role === 'assistant' ? 'M' : 'U';
    const formattedContent = formatMarkdown(content);

    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${formattedContent}</div>
    `;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function appendLoading() {
    const messagesDiv = document.getElementById('chat-messages');
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message assistant';
    div.innerHTML = `
        <div class="message-avatar">M</div>
        <div class="message-content">
            <div class="loading">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ===== Image Analysis =====
function previewImage(input) {
    const file = input.files[0];
    if (!file) return;

    const preview = document.getElementById('image-preview');
    const dropZone = document.getElementById('drop-zone');

    const reader = new FileReader();
    reader.onload = (e) => {
        preview.src = e.target.result;
        preview.hidden = false;
        dropZone.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Drag and drop
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;

    ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const input = document.getElementById('image-input');
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            previewImage(input);
        }
    });

    // Auto-resize textarea
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('input', () => autoResize(chatInput));
    }
});

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

async function analyzeImage() {
    const input = document.getElementById('image-input');
    const prompt = document.getElementById('image-prompt').value;
    const resultDiv = document.getElementById('image-result');
    const btn = document.getElementById('analyze-btn');

    if (!input.files[0]) {
        resultDiv.innerHTML = '<p style="color: var(--error);">Please upload an image first.</p>';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Analyzing...';
    resultDiv.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';

    const formData = new FormData();
    formData.append('image', input.files[0]);
    formData.append('prompt', prompt);
    formData.append('model', 'mimo-v2.5');

    try {
        const response = await fetch('/api/image/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            resultDiv.innerHTML = `<p style="color: var(--error);">Error: ${err.detail || 'Analysis failed'}</p>`;
            return;
        }

        const data = await response.json();
        resultDiv.innerHTML = formatMarkdown(data.response);
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: var(--error);">Connection error: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Analyze Image
        `;
    }
}

// ===== Code Assistant =====
async function processCode() {
    const code = document.getElementById('code-input').value;
    const language = document.getElementById('code-lang').value;
    const action = document.getElementById('code-action').value;
    const resultDiv = document.getElementById('code-result');
    const btn = document.getElementById('code-btn');

    if (!code.trim()) {
        resultDiv.innerHTML = '<p style="color: var(--error);">Please paste some code first.</p>';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Processing...';
    resultDiv.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';

    try {
        const response = await fetch('/api/code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, action, language, model: 'mimo-v2.5-pro' })
        });

        if (!response.ok) {
            const err = await response.json();
            resultDiv.innerHTML = `<p style="color: var(--error);">Error: ${err.detail || 'Processing failed'}</p>`;
            return;
        }

        const data = await response.json();
        resultDiv.innerHTML = formatMarkdown(data.response);
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: var(--error);">Connection error: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            Process Code
        `;
    }
}

// ===== Text to Speech =====
async function synthesizeSpeech() {
    const text = document.getElementById('tts-text').value;
    const voice = document.getElementById('tts-voice').value;
    const resultDiv = document.getElementById('tts-result');
    const btn = document.getElementById('tts-btn');

    if (!text.trim()) return;

    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice, model: 'mimo-v2.5-tts' })
        });

        if (!response.ok) {
            throw new Error('TTS generation failed');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const audio = document.getElementById('tts-audio');
        const download = document.getElementById('tts-download');

        audio.src = url;
        download.href = url;
        resultDiv.hidden = false;
    } catch (error) {
        alert(`Error: ${error.message}. Make sure MIMO_API_KEY is configured.`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            Generate Speech
        `;
    }
}

// ===== Markdown Formatter =====
function formatMarkdown(text) {
    if (!text) return '';

    let html = text
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Headers
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        // Lists
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap in paragraphs
    if (!html.startsWith('<')) {
        html = '<p>' + html + '</p>';
    }

    return html;
}
