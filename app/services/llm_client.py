"""LiteLLM proxy client"""
from openai import OpenAI
from app.config import LITELLM_BASE_URL, LITELLM_API_KEY, DEFAULT_MODEL


def get_client() -> OpenAI:
    """Get OpenAI client configured for LiteLLM proxy"""
    return OpenAI(
        base_url=LITELLM_BASE_URL,
        api_key=LITELLM_API_KEY
    )


async def chat_completion(
    messages: list[dict],
    model: str = None,
    temperature: float = 0.7,
    max_tokens: int = 2000
) -> str:
    """Send chat completion request to LiteLLM proxy"""
    client = get_client()
    model = model or DEFAULT_MODEL
    
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens
    )
    
    return response.choices[0].message.content


async def list_models() -> list[dict]:
    """List available models from LiteLLM proxy"""
    client = get_client()
    models = client.models.list()
    
    # Filter to chat models only (exclude embedding models)
    chat_models = []
    for model in models.data:
        model_id = model.id.lower()
        # Skip embedding models
        if "embed" in model_id:
            continue
        chat_models.append({
            "id": model.id,
            "name": model.id.replace("-", " ").title()
        })
    
    return chat_models


def stream_chat_completion(
    messages: list[dict],
    model: str = None,
    temperature: float = 0.7,
    max_tokens: int = 2000
):
    """Send chat completion request to LiteLLM proxy with streaming"""
    client = get_client()
    model = model or DEFAULT_MODEL
    
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True
    )
    
    for chunk in response:
        content = chunk.choices[0].delta.content
        if content:
            yield content
