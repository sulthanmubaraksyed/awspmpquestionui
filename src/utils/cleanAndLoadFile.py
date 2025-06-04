import os
from pathlib import Path
import logging
from typing import Dict, Any, List, Tuple
import sys

# Import the required utility functions
from fixJsonStructure import fix_json_file
from generateUUIDForAllRecords import generateUUIDForAllRecords
from getUniqueQuestions import getUniqueQuestions
from countQuestions import count_all_questions

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

def cleanAndLoadFile(filename: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Orchestrates the cleaning and loading of a file through multiple processing steps.
    
    Args:
        filename (str): Name of the file in loadFiles directory (e.g., 'load_AcquireResource.json')
        
    Returns:
        Tuple[bool, Dict[str, Any]]: 
            - bool: True if all operations were successful, False otherwise
            - Dict[str, Any]: Summary of operations performed and their results
    """
    try:
        # Initialize results dictionary
        results = {
            "filename": filename,
            "operations": {},
            "success": False,
            "error": None
        }
        
        # Step 1: Fix JSON Structure
        logger.info(f"Step 1: Fixing JSON structure for {filename}")
        json_fix_success = fix_json_file(filename)
        results["operations"]["fix_json_structure"] = {
            "success": json_fix_success,
            "message": "JSON structure fixed successfully" if json_fix_success else "Failed to fix JSON structure"
        }
        if not json_fix_success:
            raise Exception("Failed to fix JSON structure")
        
        # Step 2: Generate UUIDs for all records
        logger.info(f"Step 2: Generating UUIDs for {filename}")
        try:
            generateUUIDForAllRecords(filename)
            results["operations"]["generate_uuids"] = {
                "success": True,
                "message": "UUIDs generated successfully"
            }
        except Exception as e:
            results["operations"]["generate_uuids"] = {
                "success": False,
                "message": f"Failed to generate UUIDs: {str(e)}"
            }
            raise Exception(f"Failed to generate UUIDs: {str(e)}")
        
        # Step 3: Get unique questions
        logger.info(f"Step 3: Processing unique questions for {filename}")
        try:
            unique_questions = getUniqueQuestions(filename)
            results["operations"]["get_unique_questions"] = {
                "success": True,
                "message": "Unique questions processed successfully",
                "count": len(unique_questions) if unique_questions else 0
            }
        except Exception as e:
            results["operations"]["get_unique_questions"] = {
                "success": False,
                "message": f"Failed to process unique questions: {str(e)}"
            }
            raise Exception(f"Failed to process unique questions: {str(e)}")
        
        # Step 4: Count questions
        logger.info(f"Step 4: Counting questions in {filename}")
        try:
            count_result = count_all_questions(filename)
            results["operations"]["count_questions"] = {
                "success": True,
                "message": "Questions counted successfully",
                "count": count_result
            }
        except Exception as e:
            results["operations"]["count_questions"] = {
                "success": False,
                "message": f"Failed to count questions: {str(e)}"
            }
            raise Exception(f"Failed to count questions: {str(e)}")
        
        # If we got here, all operations were successful
        results["success"] = True
        logger.info(f"Successfully processed {filename} through all steps")
        return True, results
        
    except Exception as e:
        error_msg = f"Error processing {filename}: {str(e)}"
        logger.error(error_msg)
        results["success"] = False
        results["error"] = error_msg
        return False, results

def print_operation_summary(results: Dict[str, Any]):
    """Print a summary of the operations performed"""
    print("\nOperation Summary:")
    print(f"File: {results['filename']}")
    print(f"Overall Status: {'Success' if results['success'] else 'Failed'}")
    
    if results['error']:
        print(f"\nError: {results['error']}")
    
    print("\nOperations:")
    for op_name, op_result in results['operations'].items():
        status = "✓" if op_result['success'] else "✗"
        print(f"{status} {op_name}: {op_result['message']}")
        if 'count' in op_result:
            print(f"   Count: {op_result['count']}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python cleanAndLoadFile.py <filename>")
        print("Example: python cleanAndLoadFile.py load_AcquireResource.json")
        sys.exit(1)
    
    filename = sys.argv[1]
    success, results = cleanAndLoadFile(filename)
    print_operation_summary(results)
    sys.exit(0 if success else 1) 