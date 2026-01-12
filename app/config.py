"""Configuration settings for BioBuilder"""
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# LiteLLM Proxy Settings
LITELLM_BASE_URL = "http://0.0.0.0:4000"
LITELLM_API_KEY = "sk-1234"

# Default model for completions
DEFAULT_MODEL = "nvidia-gpt-oss-120b"

# Max file upload size (10MB)
MAX_UPLOAD_SIZE = 10 * 1024 * 1024
