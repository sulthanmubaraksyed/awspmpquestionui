import json
import os
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any
import hashlib
from difflib import SequenceMatcher

class QuestionManager:
    def __init__(self):
        self.process_group_files = {
            "Initiating": "in.ts",
            "Planning": "pl.ts",
            "Executing": "ex.ts",
            "Monitoring and Controlling": "mc.ts",
            "Closing": "cl.ts"
        }
        self.project_root = Path(__file__).parent.parent.parent
        self.questions_dir = self.project_root / "src" / "questions"
        self.util_dir = self.project_root / "src" / "utils"
        self.load_files_dir = self.util_dir / "loadFiles"  # New directory for load files
        self.temp_load_path = self.project_root / "src" / "tempload.ts"
        self.initial_load_path = self.questions_dir / "initialLoad.ts"
        
        # Initialize counters for summary
        self.summary = {
            "total_read": 0,
            "validated": 0,
            "invalid": 0,
            "added": {pg: 0 for pg in self.process_group_files.keys()},
            "filename": ""
        }
        
        # Cache for existing questions to avoid repeated file reads
        self._existing_questions: Dict[str, Set[str]] = {}
        
    def _get_file_path(self, filename: str) -> Path:
        """Get the full path for a file in the loadFiles directory."""
        return self.load_files_dir / filename
    
    def _get_questions_file_path(self, process_group: str) -> Path:
        """Get the full path for a process group's questions file."""
        return self.questions_dir / self.process_group_files[process_group]
    
    def _load_json_file(self, file_path: Path) -> Dict[str, Any]:
        """Load a JSON file, handling both .json and .ts files."""
        try:
            if not file_path.exists():
                print(f"Warning: File not found: {file_path}")
                return {}

            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()

            # Handle TypeScript files
            if file_path.suffix == '.ts':
                # Match export const questionsData = {...};
                import re
                match = re.search(r'export\s+const\s+questionsData\s*=\s*({[\s\S]*?});', content)
                if match:
                    content = match.group(1)
                else:
                    print(f"Warning: Could not find questionsData export in {file_path}")
                    return {}

            try:
                return json.loads(content)
            except json.JSONDecodeError as e:
                print(f"Error: Invalid JSON in {file_path}: {str(e)}")
                print(f"Content preview: {content[:200]}...")
                return {}
        except Exception as e:
            print(f"Error reading {file_path}: {str(e)}")
            return {}
    
    def _save_json_file(self, file_path: Path, data: Dict) -> bool:
        """Safely save a JSON file with error handling. If the file is a .ts file, wrap the JSON in an export const so that the JSON is intact."""
        try:
            # Create directory if it doesn't exist
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                if (file_path.suffix == ".ts"):
                    f.write("export const questionsData = ")
                json.dump(data, f, indent=2, ensure_ascii=False)
                if (file_path.suffix == ".ts"):
                    f.write(";\n")
            return True
        except Exception as e:
            print(f"Error saving {file_path}: {str(e)}")
            return False
    
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
    
    def _normalize_question(self, question: str) -> str:
        """Normalize a question text for comparison."""
        # Convert to lowercase and remove extra whitespace
        normalized = " ".join(question.lower().split())
        # Create a hash for faster comparison
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def _is_similar_question(self, question1: str, question2: str, threshold: float = 0.8) -> bool:
        """Check if two questions are similar using sequence matching."""
        return SequenceMatcher(None, question1, question2).ratio() > threshold
    
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
    
    def _validate_question(self, question: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate a question for required fields and format."""
        errors = []
        
        # Check required fields
        required_fields = {
            "id": str,
            "question_pmp": str,
            "options_pmp": dict,
            "analysis": dict
        }
        
        for field, field_type in required_fields.items():
            if field not in question:
                errors.append(f"Missing required field: {field}")
            elif not isinstance(question[field], field_type):
                errors.append(f"Invalid type for {field}: expected {field_type.__name__}")
        
        # Check options_pmp structure
        if "options_pmp" in question:
            options = question["options_pmp"]
            required_options = {"OPTION_A", "OPTION_B", "OPTION_C", "OPTION_D"}
            if not all(opt in options for opt in required_options):
                errors.append("Missing required options in options_pmp")
            elif not all(isinstance(options[opt], str) and options[opt].strip() for opt in required_options):
                errors.append("All options must be non-empty strings")
        
        # Check analysis structure
        if "analysis" in question:
            analysis = question["analysis"]
            required_analysis = {
                "option_a_result", "option_b_result", "option_c_result", "option_d_result",
                "process_group", "knowledge_area", "tool", "suggested_read", "concepts_to_understand"
            }
            if not all(field in analysis for field in required_analysis):
                errors.append("Missing required fields in analysis")
            elif not all(isinstance(analysis[field], str) and analysis[field].strip() for field in required_analysis if field != "suggested_read"):
                errors.append("All analysis fields must be non-empty strings")
            if "suggested_read" in analysis and not (isinstance(analysis["suggested_read"], (str, list))):
                errors.append("suggested_read must be a string or list")
            
            # Check for correct answer format
            correct_count = 0
            for opt in ["a", "b", "c", "d"]:
                result_key = f"option_{opt}_result"
                if result_key in analysis and isinstance(analysis[result_key], str):
                    if analysis[result_key].strip().startswith("CORRECT"):
                        correct_count += 1
            
            if correct_count != 1:
                errors.append(f"Exactly one option must be marked as CORRECT, found {correct_count}")
        
        return len(errors) == 0, errors

    def _copy_to_tempload(self, questions: List[Dict[str, Any]]) -> bool:
        """Copy questions to tempload.ts."""
        try:
            data = {"questions": questions}
            return self._save_json_file(self.temp_load_path, data)
        except Exception as e:
            print(f"Error copying to tempload.ts: {str(e)}")
            return False

    def _process_tempload_to_initial(self) -> Tuple[int, int]:
        """Process questions from tempload.ts to initialLoad.ts."""
        try:
            # Read tempload.ts
            temp_data = self._load_json_file(self.temp_load_path)
            if not temp_data or "questions" not in temp_data:
                return 0, 0
            
            questions = temp_data["questions"]
            valid_questions = []
            invalid_count = 0
            
            # Validate each question
            for question in questions:
                is_valid, errors = self._validate_question(question)
                if is_valid:
                    valid_questions.append(question)
                else:
                    print(f"Invalid question {question.get('id', 'unknown')}:")
                    for error in errors:
                        print(f"  - {error}")
                    invalid_count += 1
            
            # Read existing initialLoad.ts
            initial_data = self._load_json_file(self.initial_load_path)
            if not initial_data:
                initial_data = {"questions": []}
            
            # Combine and save
            initial_data["questions"].extend(valid_questions)
            if self._save_json_file(self.initial_load_path, initial_data):
                # Clear tempload.ts
                self._save_json_file(self.temp_load_path, {"questions": []})
                return len(valid_questions), invalid_count
            
            return 0, 0
        except Exception as e:
            print(f"Error processing tempload to initial: {str(e)}")
            return 0, 0

    def _process_initial_to_process_groups(self) -> Dict[str, int]:
        """Process questions from initialLoad.ts to process group files."""
        try:
            # Read initialLoad.ts
            initial_data = self._load_json_file(self.initial_load_path)
            if not initial_data or "questions" not in initial_data:
                return {pg: 0 for pg in self.process_group_files.keys()}
            
            questions = initial_data["questions"]
            added_counts = {pg: 0 for pg in self.process_group_files.keys()}
            
            # Process each question
            for question in questions:
                process_group = question.get("process_group")
                if not process_group and "analysis" in question:
                    process_group = question["analysis"].get("process_group")
                
                if not process_group or process_group not in self.process_group_files:
                    continue
                
                # Load process group file
                file_path = self._get_questions_file_path(process_group)
                data = self._load_json_file(file_path)
                if not data:
                    data = {"questions": []}
                
                # Check for duplicates
                if not self._is_duplicate_question(question.get("question_pmp", ""), process_group):
                    data["questions"].append(question)
                    if self._save_json_file(file_path, data):
                        added_counts[process_group] += 1
                        # Update cache
                        self._existing_questions[process_group].add(
                            self._normalize_question(question.get("question_pmp", ""))
                        )
            
            # Clear initialLoad.ts after successful processing
            self._save_json_file(self.initial_load_path, {"questions": []})
            return added_counts
            
        except Exception as e:
            print(f"Error processing initial to process groups: {str(e)}")
            return {pg: 0 for pg in self.process_group_files.keys()}

    def process_questions(self, filename: str) -> None:
        """Process questions from input file through the complete pipeline."""
        # Store filename in summary
        self.summary["filename"] = filename
        
        # Load input file
        input_path = self._get_file_path(filename)
        input_data = self._load_json_file(input_path)
        
        if not input_data:
            print(f"Error: Could not load questions from {filename}")
            return
        
        questions = input_data.get("questions", [])
        print(f"\nProcessing {len(questions)} questions from {filename}")
        self.summary["total_read"] = len(questions)

        # Step 1: Copy to tempload.ts
        print("\nStep 1: Copying questions to tempload.ts...")
        if not self._copy_to_tempload(questions):
            print("Error: Failed to copy questions to tempload.ts")
            return

        # Step 2: Process tempload.ts to initialLoad.ts
        print("\nStep 2: Validating and moving questions to initialLoad.ts...")
        # Read tempload.ts
        temp_data = self._load_json_file(self.temp_load_path)
        if not temp_data or "questions" not in temp_data:
            print("Error: tempload.ts is empty or invalid.")
            return
        temp_questions = temp_data["questions"]
        valid_questions = []
        invalid_count = 0
        for idx, question in enumerate(temp_questions):
            is_valid, errors = self._validate_question(question)
            qid = question.get('id', f'index_{idx}')
            if is_valid:
                print(f"[VALID] Question {qid} will be moved to initialLoad.ts")
                valid_questions.append(question)
            else:
                print(f"[INVALID] Question {qid} will be skipped:")
                for error in errors:
                    print(f"  - {error}")
                invalid_count += 1
        # Save only valid questions to initialLoad.ts
        initial_data = self._load_json_file(self.initial_load_path)
        if not initial_data:
            initial_data = {"questions": []}
        initial_data["questions"].extend(valid_questions)
        if self._save_json_file(self.initial_load_path, initial_data):
            self._save_json_file(self.temp_load_path, {"questions": []})
        self.summary["validated"] = len(valid_questions)
        self.summary["invalid"] = invalid_count
        print(f"Validated: {len(valid_questions)}, Invalid: {invalid_count}")

        # Step 3: Process initialLoad.ts to process group files
        print("\nStep 3: Moving questions to process group files...")
        # Read initialLoad.ts
        initial_data = self._load_json_file(self.initial_load_path)
        if not initial_data or "questions" not in initial_data:
            print("Error: initialLoad.ts is empty or invalid.")
            return
        initial_questions = initial_data["questions"]
        added_counts = {pg: 0 for pg in self.process_group_files.keys()}
        for idx, question in enumerate(initial_questions):
            process_group = question.get("process_group")
            if not process_group and "analysis" in question:
                process_group = question["analysis"].get("process_group")
            qid = question.get('id', f'index_{idx}')
            if not process_group or process_group not in self.process_group_files:
                print(f"[SKIP] Question {qid}: Invalid or missing process_group '{process_group}'")
                continue
            # Check for duplicates
            if self._is_duplicate_question(question.get("question_pmp", ""), process_group):
                print(f"[DUPLICATE] Question {qid} is a duplicate in {process_group} and will be skipped.")
                continue
            # Load process group file
            file_path = self._get_questions_file_path(process_group)
            data = self._load_json_file(file_path)
            if not data:
                data = {"questions": []}
            data["questions"].append(question)
            if self._save_json_file(file_path, data):
                added_counts[process_group] += 1
                self._existing_questions[process_group].add(
                    self._normalize_question(question.get("question_pmp", ""))
                )
                print(f"[ADDED] Question {qid} added to {process_group} ({file_path.name})")
        # Clear initialLoad.ts after successful processing
        self._save_json_file(self.initial_load_path, {"questions": []})
        self.summary["added"] = added_counts
        print("\nProcessing complete!")

    def print_summary(self) -> None:
        """Print a detailed summary of the processing results."""
        print("\nProcessing Summary:")
        print(f"Processed File: {self.summary['filename']}")
        print(f"Total Questions Read: {self.summary['total_read']}")
        print(f"Valid Questions: {self.summary['validated']}")
        print(f"Invalid Questions: {self.summary['invalid']}")
        print("\nQuestions Added to Process Groups:")
        for process_group, count in self.summary["added"].items():
            file_name = self.process_group_files[process_group]
            print(f"{process_group} ({file_name}): {count}")

def getUniqueQuestions(filename: str) -> None:
    """Main function to process questions through the complete pipeline."""
    manager = QuestionManager()
    manager.process_questions(filename)
    manager.print_summary()

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python getUniqueQuestions.py <input_filename>")
        sys.exit(1)
    
    getUniqueQuestions(sys.argv[1]) 