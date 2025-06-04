import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class QuestionOption:
    text: str
    is_correct: bool
    explanation: str

@dataclass
class QuestionAnalysis:
    process_group: str
    knowledge_area: str
    tool: str
    suggested_read: List[str]
    concepts_to_understand: str
    additional_notes: Optional[str] = None

@dataclass
class StructuredQuestion:
    id: str
    question_text: str
    options: Dict[str, QuestionOption]
    analysis: QuestionAnalysis
    is_attempted: bool = False
    selected_option: str = ""
    question_type: str = "Option"
    is_valid: str = "false"

def get_load_files_dir() -> Path:
    """Returns the absolute path to the loadFiles directory."""
    current_file = Path(__file__)
    utils_dir = current_file.parent
    return utils_dir / "loadFiles"

def getQuestionRecordToStructure(filename: str) -> List[StructuredQuestion]:
    """
    Transforms question records from a file into a structured format using dataclasses.
    
    Args:
        filename (str): Name of the file in loadFiles directory (e.g., 'load_AcquireResource.json')
    
    Returns:
        List[StructuredQuestion]: List of transformed question records with clear structure
        
    Raises:
        FileNotFoundError: If the file doesn't exist in loadFiles directory
        json.JSONDecodeError: If the file contains invalid JSON
        ValueError: If required fields are missing or invalid
    """
    try:
        # Get the loadFiles directory path
        load_files_dir = get_load_files_dir()
        file_path = load_files_dir / filename
        
        # Read the JSON file
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        if 'questions' not in data:
            raise ValueError(f"File {filename} does not contain a 'questions' array")
        
        structured_questions = []
        
        for question in data['questions']:
            # Extract options and their analysis
            options = {}
            for opt_key in ['A', 'B', 'C', 'D']:
                option_key = f"OPTION_{opt_key}"
                result_key = f"option_{opt_key.lower()}_result"
                
                if option_key not in question['options_pmp']:
                    raise ValueError(f"Missing {option_key} in question {question['id']}")
                if result_key not in question['analysis']:
                    raise ValueError(f"Missing {result_key} in question {question['id']}")
                
                result = question['analysis'][result_key]
                is_correct = result.strip().startswith("CORRECT")
                explanation = result.split(" - ", 1)[1] if " - " in result else result
                
                options[opt_key] = QuestionOption(
                    text=question['options_pmp'][option_key],
                    is_correct=is_correct,
                    explanation=explanation
                )
            
            # Create analysis object
            analysis = QuestionAnalysis(
                process_group=question['analysis']['process_group'],
                knowledge_area=question['analysis']['knowledge_area'],
                tool=question['analysis']['tool'],
                suggested_read=question['analysis']['suggested_read'],
                concepts_to_understand=question['analysis']['concepts_to_understand'],
                additional_notes=question['analysis'].get('additional_notes')
            )
            
            # Create structured question
            structured_question = StructuredQuestion(
                id=question['id'],
                question_text=question['question_pmp'],
                options=options,
                analysis=analysis,
                is_attempted=question['is_attempted'],
                selected_option=question['selected_option'],
                question_type=question['question_type'],
                is_valid=question['is_valid']
            )
            
            structured_questions.append(structured_question)
        
        return structured_questions
        
    except FileNotFoundError:
        raise FileNotFoundError(f"File {filename} not found in loadFiles directory")
    except json.JSONDecodeError:
        raise json.JSONDecodeError(f"File {filename} contains invalid JSON", file_path, 0)
    except Exception as e:
        raise ValueError(f"Error processing question records: {str(e)}")

def print_structured_question(question: StructuredQuestion) -> None:
    """
    Helper function to print a structured question in a readable format.
    
    Args:
        question (StructuredQuestion): The structured question to print
    """
    print(f"\nQuestion ID: {question.id}")
    print(f"Question: {question.question_text}")
    print("\nOptions:")
    for opt_key, option in question.options.items():
        correct_mark = "✓" if option.is_correct else "✗"
        print(f"{opt_key}. {correct_mark} {option.text}")
        print(f"   Explanation: {option.explanation}")
    
    print("\nAnalysis:")
    print(f"Process Group: {question.analysis.process_group}")
    print(f"Knowledge Area: {question.analysis.knowledge_area}")
    print(f"Tool: {question.analysis.tool}")
    print("\nSuggested Reading:")
    for item in question.analysis.suggested_read:
        print(f"- {item}")
    print(f"\nConcepts to Understand: {question.analysis.concepts_to_understand}")
    if question.analysis.additional_notes:
        print(f"\nAdditional Notes: {question.analysis.additional_notes}")

if __name__ == "__main__":
    # Example usage
    try:
        filename = "load_AcquireResource.json"
        structured_questions = getQuestionRecordToStructure(filename)
        
        print(f"\nSuccessfully processed {len(structured_questions)} questions from {filename}")
        print("\nExample of first question:")
        if structured_questions:
            print_structured_question(structured_questions[0])
            
    except Exception as e:
        print(f"Error: {str(e)}") 