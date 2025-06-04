import json
import time
import os
from datetime import datetime
from pathlib import Path

def get_load_files_dir():
    """
    Returns the absolute path to the loadFiles directory.
    """
    # Get the directory where this script is located
    current_file = Path(__file__)
    utils_dir = current_file.parent
    return utils_dir / "loadFiles"

def generateUUIDForAllRecords(file_name):
    """
    Updates the 'id' field of each question in a JSON file with a timestamp-based ID.
    Includes a 1-second pause between each update.
    
    Args:
        file_name (str): Name of the JSON file in the loadFiles folder (e.g., 'load_AcquireResource.json')
    """
    try:
        # Get the loadFiles directory path
        load_files_dir = get_load_files_dir()
        file_path = load_files_dir / file_name
        
        # Read the JSON file
        with open(file_path, 'r') as file:
            data = json.load(file)
        
        # Check if the file has the expected structure
        if 'questions' not in data:
            print(f"Error: File {file_name} does not contain a 'questions' array")
            return
        
        # Process each question
        for question in data['questions']:
            # Generate new ID using current timestamp in milliseconds
            new_id = str(int(datetime.now().timestamp() * 1000))
            
            # Store old ID for logging
            old_id = question['id']
            
            # Update the ID
            question['id'] = new_id
            
            # Save the changes after each update
            with open(file_path, 'w') as file:
                json.dump(data, file, indent=4)
            
            # Log the change
            print(f"Updated ID: {old_id} -> {new_id}")
            
            # Pause for 1 second before next update
            time.sleep(1)
        
        print("All question IDs have been updated successfully!")
        
    except FileNotFoundError:
        print(f"Error: File {file_name} not found in loadFiles directory")
    except json.JSONDecodeError:
        print(f"Error: File {file_name} contains invalid JSON")
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    # Example usage - just pass the filename
    file_name = "load_AcquireResource.json"
    generateUUIDForAllRecords(file_name) 