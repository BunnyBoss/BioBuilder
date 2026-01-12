"""FastAPI main application"""
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.routers import documents, qa, extraction, models

# Initialize FastAPI app
app = FastAPI(
    title="BioBuilder",
    description="Scientific Document Analysis Server",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup paths
BASE_DIR = Path(__file__).parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Templates
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# Include routers
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(qa.router, prefix="/api/qa", tags=["Q&A"])
app.include_router(extraction.router, prefix="/api/extraction", tags=["Extraction"])
app.include_router(models.router, prefix="/api/models", tags=["Models"])


@app.get("/")
async def root(request: Request):
    """Serve main page"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "BioBuilder"}
