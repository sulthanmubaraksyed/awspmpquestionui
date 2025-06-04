import json
import os
from pathlib import Path
import logging
import re
from typing import Dict, Any, List

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_questions_dir() -> Path:
    """
    Returns the absolute path to the questions directory.
    """
    current_file = Path(__file__)
    utils_dir = current_file.parent
    return utils_dir.parent / "questions"

def extract_json_from_typescript(content: str) -> Dict[str, Any]:
    """
    Extracts JSON data from TypeScript file content.
    
    Args:
        content (str): Content of the TypeScript file
        
    Returns:
        Dict[str, Any]: Parsed JSON data
    """
    # Find the JSON object between the export statement
    match = re.search(r'export const questionsData = ({.*?});', content, re.DOTALL)
    if not match:
        raise ValueError("Could not find questionsData export in file")
    
    json_str = match.group(1)
    return json.loads(json_str)

def update_is_valid_in_file(file_path: Path) -> bool:
    """
    Updates is_valid to false in all records in a TypeScript file.
    
    Args:
        file_path (Path): Path to the TypeScript file
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        # Extract and parse the JSON data
        data = extract_json_from_typescript(content)
        
        # Update is_valid in all questions
        updated_count = 0
        for question in data.get('questions', []):
            if 'is_valid' in question:
                question['is_valid'] = False
                updated_count += 1
        
        # Create backup of original file
        backup_path = file_path.with_suffix('.ts.bak')
        os.rename(file_path, backup_path)
        
        # Write updated content back to file
        with open(file_path, 'w', encoding='utf-8') as file:
            # Preserve the original file structure
            updated_content = content.replace(
                re.search(r'export const questionsData = ({.*?});', content, re.DOTALL).group(1),
                json.dumps(data, indent=2)
            )
            file.write(updated_content)
        
        logger.info(f"Updated {updated_count} records in {file_path.name}")
        logger.info(f"Original file backed up as {backup_path.name}")
        return True
        
    except Exception as e:
        logger.error(f"Error processing {file_path.name}: {str(e)}")
        return False

def update_all_files():
    """
    Updates is_valid to false in all question records across all TypeScript files.
    """
    questions_dir = get_questions_dir()
    files_to_update = ['in.ts', 'cl.ts', 'pl.ts', 'ex.ts', 'mc.ts']
    
    results = {
        "success": True,
        "files_processed": 0,
        "files_updated": 0,
        "errors": []
    }
    
    for filename in files_to_update:
        file_path = questions_dir / filename
        if not file_path.exists():
            error_msg = f"File not found: {filename}"
            logger.error(error_msg)
            results["errors"].append(error_msg)
            results["success"] = False
            continue
        
        results["files_processed"] += 1
        if update_is_valid_in_file(file_path):
            results["files_updated"] += 1
        else:
            results["success"] = False
            results["errors"].append(f"Failed to update {filename}")
    
    return results

def print_summary(results: Dict[str, Any]):
    """Print a summary of the update operation"""
    print("\nUpdate Summary:")
    print(f"Files processed: {results['files_processed']}")
    print(f"Files successfully updated: {results['files_updated']}")
    print(f"Overall status: {'Success' if results['success'] else 'Failed'}")
    
    if results['errors']:
        print("\nErrors encountered:")
        for error in results['errors']:
            print(f"- {error}")

if __name__ == "__main__":
    print("Starting update of is_valid field in all question files...")
    results = update_all_files()
    print_summary(results)
    exit(0 if results['success'] else 1) 