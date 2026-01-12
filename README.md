# BioBuilder - Scientific Document Analysis Server

A localhost web application for analyzing scientific documents with Q&A and gene/protein relationship extraction.

## Features

- 📄 Upload scientific documents (PDF, TXT)
- 💬 Ask questions about documents (Q&A mode)
- 🧬 Extract genes/proteins with relationships (Extraction mode)
- 🔄 Switch between LLM models via LiteLLM proxy

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Open http://127.0.0.1:8000 in your browser.

## Configuration

The server connects to LiteLLM proxy at `http://0.0.0.0:4000` with API key `sk-1234`.

Edit `app/config.py` to change settings.
