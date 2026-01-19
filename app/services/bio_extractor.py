"""Bio entity extraction service"""
import json
from app.services.llm_client import chat_completion
from app.utils.prompts import get_extraction_prompt


import logging
import os
from datetime import datetime

# Setup logger
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(log_dir, "debug.log"),
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def extract_genes_and_relations(text: str, model: str = None, target_genes: list[str] = None, target_relations: list[str] = None) -> dict:
    """Extract genes/proteins and their relationships from text"""
    
    # Truncate text if too long (keep ~15k chars for context)
    if len(text) > 15000:
        text = text[:15000] + "...[truncated]"
    
    # Get customized prompt
    system_prompt = get_extraction_prompt(target_genes, target_relations)
    
    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": f"Extract all genes, proteins, and their relationships from the following scientific text:\n\n{text}"
        }
    ]
    
    logging.info(f"Using model: {model}")
    logging.info(f"Input text length: {len(text)}")
    if target_genes:
        logging.info(f"Targeting genes: {target_genes}")
    if target_relations:
        logging.info(f"Targeting relations: {target_relations}")
    logging.info("Sending request to LLM...")

    response = await chat_completion(messages, model=model, temperature=0.1, max_tokens=4000)
    
    logging.info("Received response from LLM")
    logging.info(f"Raw Response: {response}")
    
    # Parse JSON response
    try:
        # Find JSON in response
        start = response.find("{")
        end = response.rfind("}") + 1
        if start != -1 and end > start:
            json_str = response[start:end]
            result = json.loads(json_str)
            return result
    except json.JSONDecodeError as e:
        logging.error(f"JSON Decode Error: {e}")
        logging.info("Attempting fallback regex parsing...")
        
        # Fallback: Extract arrays using regex
        import re
        
        fallback_result = {"entities": [], "relations": []}
        
        # Regex to capture individual objects inside entities/relations arrays
        # This matches { ... } non-greedily, aiming to capture well-formed objects
        object_pattern = re.compile(r'\{[^{}]+\}') 
        
        # Extract portions for entities and relations
        # We roughly look for "entities": [ ... ] and "relations": [ ... ]
        # But since the file might be truncated or malformed, we just look for the keys text
        
        try:
            # 1. Extract Entities
            if '"entities":' in response:
                entities_part = response.split('"entities":')[1]
                # If relations exists, stop there, otherwise go to end
                if '"relations":' in entities_part:
                    entities_part = entities_part.split('"relations":')[0]
                
                # Find all complete objects
                # Using a simple brace counter might be better for nested, but these are usually flat
                # Let's use a simple heuristic: split by "}," and restore braces
                
                # Simple regex for flat objects containing fields
                # Matches { "key": ... }
                # We use a pattern that matches balanced braces if possible, or just non-nested for now
                matches = re.finditer(r'\{[^{}]*\}', entities_part)
                for m in matches:
                    try:
                        obj_str = m.group(0)
                        obj = json.loads(obj_str)
                        if "name" in obj and "type" in obj: # Validate it looks like an entity
                            fallback_result["entities"].append(obj)
                    except:
                        continue

            # 2. Extract Relations
            if '"relations":' in response:
                relations_part = response.split('"relations":')[1]
                
                matches = re.finditer(r'\{[^{}]*\}', relations_part)
                for m in matches:
                    try:
                        obj_str = m.group(0)
                        obj = json.loads(obj_str)
                        if "source" in obj and "target" in obj: # Validate it looks like a relation
                            fallback_result["relations"].append(obj)
                    except:
                        continue
                        
            logging.info(f"Fallback extracted {len(fallback_result['entities'])} entities and {len(fallback_result['relations'])} relations")
            return fallback_result
            
        except Exception as fallback_error:
            logging.error(f"Fallback parsing failed: {fallback_error}")
            pass
    
    # Return raw response if JSON parsing fails

    return {
        "entities": [],
        "relations": [],
        "raw_response": response,
        "parse_error": True
    }
