"""Bio entity extraction service"""
import json
from app.services.llm_client import chat_completion
from app.utils.prompts import GENE_EXTRACTION_PROMPT


async def extract_genes_and_relations(text: str, model: str = None) -> dict:
    """Extract genes/proteins and their relationships from text"""
    
    # Truncate text if too long (keep ~15k chars for context)
    if len(text) > 15000:
        text = text[:15000] + "...[truncated]"
    
    messages = [
        {
            "role": "system",
            "content": GENE_EXTRACTION_PROMPT
        },
        {
            "role": "user",
            "content": f"Extract all genes, proteins, and their relationships from the following scientific text:\n\n{text}"
        }
    ]
    
    response = await chat_completion(messages, model=model, temperature=0.1, max_tokens=4000)
    
    # Parse JSON response
    try:
        # Find JSON in response
        start = response.find("{")
        end = response.rfind("}") + 1
        if start != -1 and end > start:
            json_str = response[start:end]
            result = json.loads(json_str)
            return result
    except json.JSONDecodeError:
        pass
    
    # Return raw response if JSON parsing fails
    return {
        "entities": [],
        "relations": [],
        "raw_response": response,
        "parse_error": True
    }
