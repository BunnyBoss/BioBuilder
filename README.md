# BioBuilder - Scientific Document Analysis Server

A localhost web application for analyzing scientific documents with Q&A and gene/protein relationship extraction, powered by LiteLLM.

## Features

- 📄 Upload scientific documents (PDF, TXT)
- 💬 Ask questions about documents (Q&A mode)
- 🧬 Extract genes/proteins with relationships (phosphorylation, methylation, transcription, etc.)
- 🔄 Switch between LLM models via LiteLLM proxy

---

## Prerequisites

- Conda (Miniconda or Anaconda)
- LiteLLM proxy running at `http://0.0.0.0:4000` with API key `sk-1234`

---

## Installation

### 1. Create Conda Environment

```bash
# Create new environment with Python 3.12
conda create -n biobuilder-env python=3.12 pip -y

# Activate environment
conda activate biobuilder-env
```

### 2. Install Dependencies

```bash
# Navigate to project directory
cd /home/poornachandra/Proyecto/2026/BioBuilder

# Install Python packages
pip install fastapi uvicorn python-multipart jinja2 openai pypdf2 aiofiles
```

Or install from requirements.txt:

```bash
pip install -r requirements.txt
```

---

## Running the Server

```bash
# Activate environment (if not already active)
conda activate biobuilder-env

# Navigate to project
cd /home/poornachandra/Proyecto/2026/BioBuilder

# Start server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Open **http://127.0.0.1:8000** in your browser.

---

## Usage

1. **Upload Documents**: Drag & drop PDF or TXT files into the upload zone
2. **Select Model**: Choose an LLM from the dropdown
3. **Q&A Mode**: Type a question and click "Ask Question"
4. **Gene Extraction Mode**: Click the tab and then "Extract Genes & Proteins"

---

## Configuration

Edit `app/config.py` to change settings:

```python
LITELLM_BASE_URL = "http://0.0.0.0:4000"  # LiteLLM proxy URL
LITELLM_API_KEY = "sk-1234"               # API key
DEFAULT_MODEL = "nvidia-gpt-oss-120b"     # Default model
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web UI |
| `/health` | GET | Health check |
| `/api/models` | GET | List available LLM models |
| `/api/documents/upload` | POST | Upload PDF/TXT document |
| `/api/documents` | GET | List uploaded documents |
| `/api/qa/ask` | POST | Ask question about documents |
| `/api/extraction/genes` | POST | Extract genes and relationships |
