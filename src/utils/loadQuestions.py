import json
import os
from pathlib import Path
from typing import Dict, List, Set, Any, Tuple
import hashlib
from difflib import SequenceMatcher

class QuestionLoader:
    def __init__(self):
        self.process_group_files = {
            "Initiating": "in.ts",
            "Planning": "pl.ts",
            "Executing": "ex.ts",
            "Monitoring and Controlling": "mc.ts",
            "Closing": "cl.ts"
        }
        # Get the project root (parent of src directory)
        self.project_root = Path(__file__).parent.parent.parent
        self.questions_dir = self.project_root / "src" / "questions"
        self.util_dir = self.project_root / "src" / "utils"
        
        # Cache for existing questions to avoid repeated file reads
        self._existing_questions: Dict[str, Set[str]] = {}
        
        # Required fields and their types for validation
        self.required_fields = {
            "id": str,
            "question_pmp": str,
            "options_pmp": dict,
            "is_attempted": bool,
            "selected_option": str,
            "question_type": str,
            "is_valid": str,
            "analysis": dict
        }
        
        # Required analysis fields
        self.required_analysis_fields = {
            "option_a_result": str,
            "option_b_result": str,
            "option_c_result": str,
            "option_d_result": str,
            "process_group": str,
            "knowledge_area": str,
            "tool": str,
            "suggested_read": (list, str),
            "concepts_to_understand": str
        }
        
        # Required options
        self.required_options = {"OPTION_A", "OPTION_B", "OPTION_C", "OPTION_D"}
    
    def _validate_question_record(self, question: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate a question record for required fields and correct types."""
        errors = []
        
        # Check required fields and their types
        for field, field_type in self.required_fields.items():
            if field not in question:
                errors.append(f"Missing required field: {field}")
            elif not isinstance(question[field], field_type):
                errors.append(f"Invalid type for {field}: expected {field_type.__name__}, got {type(question[field]).__name__}")
        
        # Check options_pmp structure
        if "options_pmp" in question:
            options = question["options_pmp"]
            if not isinstance(options, dict):
                errors.append("options_pmp must be a dictionary")
            else:
                # Check required options
                missing_options = self.required_options - set(options.keys())
                if missing_options:
                    errors.append(f"Missing required options: {', '.join(missing_options)}")
                # Check option values
                for opt, value in options.items():
                    if not isinstance(value, str) or not value.strip():
                        errors.append(f"Option {opt} must be a non-empty string")
        
        # Check analysis structure
        if "analysis" in question:
            analysis = question["analysis"]
            if not isinstance(analysis, dict):
                errors.append("analysis must be a dictionary")
            else:
                # Check required analysis fields
                for field, field_type in self.required_analysis_fields.items():
                    if field not in analysis:
                        errors.append(f"Missing required analysis field: {field}")
                    elif isinstance(field_type, tuple):
                        if not isinstance(analysis[field], field_type):
                            errors.append(f"Invalid type for analysis.{field}: expected {field_type[0].__name__} or {field_type[1].__name__}")
                    elif not isinstance(analysis[field], field_type):
                        errors.append(f"Invalid type for analysis.{field}: expected {field_type.__name__}")
                
                # Check for exactly one CORRECT option
                if all(f"option_{opt}_result" in analysis for opt in "abcd"):
                    correct_count = sum(1 for opt in "abcd" 
                                     if analysis[f"option_{opt}_result"].startswith("CORRECT"))
                    if correct_count != 1:
                        errors.append(f"Exactly one option must be marked as CORRECT, found {correct_count}")
        
        return len(errors) == 0, errors
    
    def _validate_destination_file(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate the destination file structure after appending a question."""
        errors = []
        
        if not isinstance(data, dict):
            errors.append("File must contain a JSON object")
            return False, errors
        
        if "questions" not in data:
            errors.append("File must contain a 'questions' array")
            return False, errors
        
        if not isinstance(data["questions"], list):
            errors.append("'questions' must be an array")
            return False, errors
        
        # Validate each question in the file
        for idx, question in enumerate(data["questions"]):
            is_valid, question_errors = self._validate_question_record(question)
            if not is_valid:
                errors.extend([f"Question {idx + 1}: {error}" for error in question_errors])
        
        return len(errors) == 0, errors
    
    def _get_file_path(self, filename: str) -> Path:
        """Get the full path for a file in the utils directory."""
        # If filename is already a full path, use it directly
        if os.path.isabs(filename):
            return Path(filename)
        # If filename is relative, assume it's relative to the utils directory
        return self.util_dir / filename
    
    def _get_questions_file_path(self, process_group: str) -> Path:
        """Get the full path for a process group's questions file."""
        return self.questions_dir / self.process_group_files[process_group]
    
    def _load_json_file(self, file_path: Path) -> Dict:
        """Safely load a JSON file with error handling."""
        try:
            if not file_path.exists():
                print(f"Warning: File not found: {file_path}")
                return {}
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                # If it's a TypeScript file, extract the JSON part
                if file_path.suffix == '.ts':
                    if content.startswith('export const questionsData = '):
                        # Remove the export statement and trailing semicolon
                        content = content.replace('export const questionsData = ', '', 1)
                        if content.endswith(';'):
                            content = content[:-1]
                    else:
                        print(f"Warning: Unexpected TypeScript file format in {file_path}")
                        return {}
                
                try:
                    return json.loads(content)
                except json.JSONDecodeError as e:
                    print(f"Error: Invalid JSON in {file_path}: {str(e)}")
                    print(f"Content causing error: {content[:100]}...")  # Print first 100 chars for debugging
                    return {}
        except Exception as e:
            print(f"Error reading {file_path}: {str(e)}")
            return {}
    
    def _save_json_file(self, file_path: Path, data: Dict) -> bool:
        """Safely save a JSON file with error handling. For .ts files, wrap in export const."""
        try:
            # Create directory if it doesn't exist
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Convert data to JSON string with proper formatting
            json_str = json.dumps(data, indent=2, ensure_ascii=False)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                if file_path.suffix == '.ts':
                    f.write("export const questionsData = ")
                f.write(json_str)
                if file_path.suffix == '.ts':
                    f.write(";\n")
            return True
        except Exception as e:
            print(f"Error saving {file_path}: {str(e)}")
            return False
    
    def _normalize_question(self, question: str) -> str:
        """Normalize a question text for comparison."""
        # Convert to lowercase and remove extra whitespace
        normalized = " ".join(question.lower().split())
        # Create a hash for faster comparison
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def _is_similar_question(self, question1: str, question2: str, threshold: float = 0.8) -> bool:
        """Check if two questions are similar using sequence matching."""
        return SequenceMatcher(None, question1, question2).ratio() > threshold
    
    def _get_existing_questions(self, process_group: str) -> Set[str]:
        """Get cached set of existing questions for a process group."""
        if process_group not in self._existing_questions:
            file_path = self._get_questions_file_path(process_group)
            data = self._load_json_file(file_path)
            questions = data.get("questions", [])
            # Store normalized question texts
            self._existing_questions[process_group] = {
                self._normalize_question(q.get("question_pmp", ""))
                for q in questions
            }
        return self._existing_questions[process_group]
    
    def _is_duplicate_question(self, question: str, process_group: str) -> bool:
        """Check if a question is a duplicate in the given process group."""
        normalized_question = self._normalize_question(question)
        existing_questions = self._get_existing_questions(process_group)
        
        # First check exact match
        if normalized_question in existing_questions:
            return True
        
        # Then check for similar questions
        for existing in existing_questions:
            if self._is_similar_question(question, existing):
                return True
        
        return False
    
    def load_questions(self, filename: str) -> None:
        """Load questions from input file and distribute them to process group files."""
        # Load input file
        input_path = self._get_file_path(filename)
        input_data = self._load_json_file(input_path)
        
        if not input_data:
            print(f"Error: Could not load questions from {filename}")
            return
        
        questions = input_data.get("questions", [])
        print(f"\nProcessing {len(questions)} questions from {filename}")
        
        # Track statistics
        stats = {
            "total": len(questions),
            "added": {pg: 0 for pg in self.process_group_files.keys()},
            "skipped": {pg: 0 for pg in self.process_group_files.keys()},
            "invalid": 0,
            "validation_errors": 0,
            "duplicate_skips": 0
        }
        
        # Process each question
        for idx, question in enumerate(questions, 1):
            print(f"\nProcessing question {idx}/{len(questions)}:")
            print(f"ID: {question.get('id', 'unknown')}")
            
            # Validate question record
            is_valid, errors = self._validate_question_record(question)
            if not is_valid:
                print(f"Validation failed:")
                for error in errors:
                    print(f"  - {error}")
                stats["validation_errors"] += 1
                continue
            
            # Get process group from question or analysis
            process_group = question.get("process_group")
            if not process_group and "analysis" in question:
                process_group = question["analysis"].get("process_group")
            
            if not process_group or process_group not in self.process_group_files:
                print(f"Invalid process group: {process_group}")
                stats["invalid"] += 1
                continue
            
            print(f"Process group: {process_group}")
            
            # Check for duplicates
            if self._is_duplicate_question(question.get("question_pmp", ""), process_group):
                print(f"Duplicate question detected in {process_group}")
                stats["duplicate_skips"] += 1
                stats["skipped"][process_group] += 1
                continue
            
            # Load process group file
            file_path = self._get_questions_file_path(process_group)
            data = self._load_json_file(file_path)
            if not data:
                data = {"questions": []}
            
            # Create a copy of the data with the new question appended
            new_data = {"questions": data["questions"] + [question]}
            
            # Validate the new data structure
            is_valid, errors = self._validate_destination_file(new_data)
            if not is_valid:
                print(f"Destination file validation failed:")
                for error in errors:
                    print(f"  - {error}")
                stats["skipped"][process_group] += 1
                continue
            
            # Save updated file
            if self._save_json_file(file_path, new_data):
                stats["added"][process_group] += 1
                # Update cache
                self._existing_questions[process_group].add(
                    self._normalize_question(question.get("question_pmp", ""))
                )
                print(f"Successfully added to {process_group}")
            else:
                print(f"Failed to save to {process_group}")
                stats["skipped"][process_group] += 1
        
        # Print summary
        print("\nProcessing Summary:")
        print(f"Total Questions Processed: {stats['total']}")
        print(f"Invalid Questions (missing process group): {stats['invalid']}")
        print(f"Questions Failed Validation: {stats['validation_errors']}")
        print(f"Questions Skipped (duplicates): {stats['duplicate_skips']}")
        print("\nQuestions Added to Process Groups:")
        for process_group in self.process_group_files.keys():
            file_name = self.process_group_files[process_group]
            print(f"{process_group} ({file_name}):")
            print(f"  - Added: {stats['added'][process_group]}")
            print(f"  - Skipped (validation/duplicates): {stats['skipped'][process_group]}")

def loadQuestions(filename: str) -> None:
    """Main function to load questions from input file to process group files."""
    # Convert filename to absolute path if it's relative
    if not os.path.isabs(filename):
        filename = os.path.abspath(filename)
    
    loader = QuestionLoader()
    loader.load_questions(filename)

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python loadQuestions.py <input_filename>")
        sys.exit(1)
    
    # Get the absolute path of the input file
    input_file = os.path.abspath(sys.argv[1])
    loadQuestions(input_file) 