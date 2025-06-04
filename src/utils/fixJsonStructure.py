import json
import os
from pathlib import Path
from typing import Dict, Any, List
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_load_files_dir() -> Path:
    """
    Returns the absolute path to the loadFiles directory.
    """
    current_file = Path(__file__)
    utils_dir = current_file.parent
    return utils_dir / "loadFiles"

def validate_and_fix_json_structure(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates and fixes common JSON structure issues in the data.
    
    Args:
        data (Dict[str, Any]): The JSON data to validate and fix
        
    Returns:
        Dict[str, Any]: The fixed JSON data
    """
    if not isinstance(data, dict):
        raise ValueError("Input data must be a dictionary")
    
    # Ensure 'questions' key exists and is a list
    if 'questions' not in data:
        data['questions'] = []
    elif not isinstance(data['questions'], list):
        data['questions'] = [data['questions']]
    
    # Fix each question in the list
    fixed_questions = []
    for question in data['questions']:
        if not isinstance(question, dict):
            continue
            
        # Ensure required fields exist with correct types
        fixed_question = {
            'id': str(question.get('id', '')),
            'question_pmp': str(question.get('question_pmp', '')),
            'options_pmp': question.get('options_pmp', {}),
            'is_attempted': bool(question.get('is_attempted', False)),
            'is_valid': bool(question.get('is_valid', False)),
            'selected_option': str(question.get('selected_option', '')),
            'question_type': str(question.get('question_type', 'Option')),
            'correct_answer': str(question.get('correct_answer', '')),
            'analysis': question.get('analysis', {})
        }
        
        # Ensure options_pmp is a dictionary with correct structure
        if not isinstance(fixed_question['options_pmp'], dict):
            fixed_question['options_pmp'] = {}
        for key in ['OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D']:
            if key not in fixed_question['options_pmp']:
                fixed_question['options_pmp'][key] = ''
            else:
                fixed_question['options_pmp'][key] = str(fixed_question['options_pmp'][key])
        
        # Ensure analysis is a dictionary with correct structure
        if not isinstance(fixed_question['analysis'], dict):
            fixed_question['analysis'] = {}
        for key in ['option_a_result', 'option_b_result', 'option_c_result', 'option_d_result',
                   'process_group', 'knowledge_area', 'tool', 'suggested_read', 
                   'concepts_to_understand', 'additional_notes']:
            if key not in fixed_question['analysis']:
                if key == 'suggested_read':
                    fixed_question['analysis'][key] = []
                else:
                    fixed_question['analysis'][key] = ''
            elif key == 'suggested_read' and not isinstance(fixed_question['analysis'][key], list):
                fixed_question['analysis'][key] = [str(fixed_question['analysis'][key])]
            else:
                fixed_question['analysis'][key] = str(fixed_question['analysis'][key])
        
        fixed_questions.append(fixed_question)
    
    data['questions'] = fixed_questions
    return data

def fix_json_file(filename: str) -> bool:
    """
    Fixes JSON structure errors in a file from the loadFiles directory.
    
    Args:
        filename (str): Name of the file in loadFiles directory (e.g., 'load_AcquireResource.json')
        
    Returns:
        bool: True if the file was successfully fixed, False otherwise
    """
    try:
        # Get the file path
        file_path = get_load_files_dir() / filename
        
        # Check if file exists
        if not file_path.exists():
            logger.error(f"File {filename} not found in loadFiles directory")
            return False
        
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as file:
            try:
                data = json.load(file)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in {filename}: {str(e)}")
                return False
        
        # Fix the structure
        fixed_data = validate_and_fix_json_structure(data)
        
        # Create backup of original file
        backup_path = file_path.with_suffix('.json.bak')
        os.rename(file_path, backup_path)
        
        # Write fixed data back to file
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(fixed_data, file, indent=2, ensure_ascii=False)
        
        logger.info(f"Successfully fixed {filename}")
        logger.info(f"Original file backed up as {backup_path.name}")
        return True
        
    except Exception as e:
        logger.error(f"Error processing {filename}: {str(e)}")
        return False

if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) > 1:
        filename = sys.argv[1]
        success = fix_json_file(filename)
        if success:
            print(f"Successfully fixed {filename}")
        else:
            print(f"Failed to fix {filename}")
    else:
        print("Please provide a filename as argument")
        print("Example: python fixJsonStructure.py load_AcquireResource.json") 