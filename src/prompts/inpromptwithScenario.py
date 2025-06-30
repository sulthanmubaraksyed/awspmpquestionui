import json
import datetime
import uuid
import argparse
import os
import random
from typing import List, Dict, Any
from pathlib import Path
import re

class PMPScenarioQuestionGenerator:
    prompts_dir = "src/prompts/saved"  # Directory for saved prompts
    scenarios_dir = "src/prompts/scenarios"  # Directory for scenario files
    used_questions_file = "used_questions.json"  # File to track used questions

    def __init__(self):
        self.process_groups = {
            "Initiating": {
                "knowledge_areas": ["Integration", "Stakeholders"],
                "common_tools": ["Team_Charter", "stakeholder_analysis", "expert_judgment"],
                "file_prefix": "in",
                "processes": [
                    "Develop Project Charter",
                    "Identify Stakeholders"
                ]
            },
            "Planning": {
                "knowledge_areas": ["Integration", "Scope", "Schedule", "Cost", "Quality", 
                                  "Resources", "Communications", "Risk", "Procurement", "Stakeholders"],
                "common_tools": ["work_breakdown_structure", "critical_path_method", "cost_benefit_analysis"],
                "file_prefix": "pl",
                "processes": [
                    "Develop Project Management Plan",
                    "Plan Scope Management",
                    "Collect Requirements",
                    "Define Scope",
                    "Create WBS",
                    "Plan Schedule Management",
                    "Define Activities",
                    "Sequence Activities",
                    "Estimate Activity Durations",
                    "Develop Schedule",
                    "Plan Cost Management",
                    "Estimate Costs",
                    "Determine Budget",
                    "Plan Quality Management",
                    "Plan Resource Management",
                    "Estimate Activity Resources",
                    "Plan Communications Management",
                    "Plan Risk Management",
                    "Identify Risks",
                    "Perform Qualitative Risk Analysis",
                    "Perform Quantitative Risk Analysis",
                    "Plan Risk Responses",
                    "Plan Procurement Management",
                    "Plan Stakeholder Engagement"
                ]
            },
            "Executing": {
                "knowledge_areas": ["Integration", "Quality", "Resources", "Communications", 
                                  "Procurement", "Stakeholders"],
                "common_tools": ["team_building", "quality_audits", "procurement_negotiation"],
                "file_prefix": "ex",
                "processes": [
                    "Direct and Manage Project Work",
                    "Manage Project Knowledge",
                    "Manage Quality",
                    "Acquire Resources",
                    "Develop Team",
                    "Manage Team",
                    "Manage Communications",
                    "Implement Risk Responses",
                    "Conduct Procurements",
                    "Manage Stakeholder Engagement"
                ]
            },
            "Monitoring and Controlling": {
                "knowledge_areas": ["Integration", "Scope", "Schedule", "Cost", "Quality", 
                                  "Resources", "Communications", "Risk", "Procurement", "Stakeholders"],
                "common_tools": ["earned_value_analysis", "variance_analysis", "trend_analysis"],
                "file_prefix": "mc",
                "processes": [
                    "Monitor and Control Project Work",
                    "Perform Integrated Change Control",
                    "Validate Scope",
                    "Control Scope",
                    "Control Schedule",
                    "Control Costs",
                    "Control Quality",
                    "Control Resources",
                    "Monitor Communications",
                    "Monitor Risks",
                    "Control Procurements",
                    "Monitor Stakeholder Engagement"
                ]
            },
            "Closing": {
                "knowledge_areas": ["Integration", "Procurement", "Stakeholders"],
                "common_tools": ["audits", "lessons_learned", "final_report"],
                "file_prefix": "cl",
                "processes": [
                    "Close Project or Phase",
                    "Close Procurements"
                ]
            }
        }
        # Load used questions tracking
        self.used_questions = self._load_used_questions()

    def _load_used_questions(self) -> Dict[str, List[str]]:
        """Load the tracking of used questions from file"""
        try:
            if os.path.exists(self.used_questions_file):
                with open(self.used_questions_file, 'r') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            print(f"Warning: Could not load used questions tracking: {str(e)}")
            return {}

    def _save_used_questions(self):
        """Save the tracking of used questions to file"""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.used_questions_file), exist_ok=True)
            with open(self.used_questions_file, 'w') as f:
                json.dump(self.used_questions, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save used questions tracking: {str(e)}")

    def _is_question_used(self, question_text: str, process_group: str) -> bool:
        """Check if a question has been used before"""
        # Initialize process group if not exists
        if process_group not in self.used_questions:
            self.used_questions[process_group] = []
        
        # Check if question is similar to any used question
        question_text = question_text.lower().strip()
        for used_question in self.used_questions[process_group]:
            if self._calculate_similarity(question_text, used_question) > 0.8:
                return True
        return False

    def _mark_question_used(self, question_text: str, process_group: str):
        """Mark a question as used"""
        if process_group not in self.used_questions:
            self.used_questions[process_group] = []
        self.used_questions[process_group].append(question_text.lower().strip())
        self._save_used_questions()

    def generate_question_id(self, process_group: str) -> str:
        """Generate a unique question ID"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        random_suffix = uuid.uuid4().hex[:8]
        return f"{process_group.lower().replace(' ', '_')}_{timestamp}_{random_suffix}"

    def sanitize_filename(self, filename: str) -> str:
        """Sanitize a filename for safe file system operations"""
        # Remove or replace unsafe characters
        unsafe_chars = '<>:"/\\|?*'
        for char in unsafe_chars:
            filename = filename.replace(char, '_')
        return filename

    def save_prompt_to_file(self, scenario_filename: str, prompt_content: str) -> str:
        """Save the prompt content to a file"""
        # Create the prompts directory if it doesn't exist
        os.makedirs(self.prompts_dir, exist_ok=True)
        
        # Extract base name without extension
        base_name = os.path.splitext(os.path.basename(scenario_filename))[0]
        # Generate filename with prompt_<scenariofilename>_<timestamp>.txt format
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"prompt_{base_name}_{timestamp}.txt"
        filepath = os.path.join(self.prompts_dir, filename)
        
        # Save the prompt
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(prompt_content)
        
        return filepath

    def get_process_group_file_prefix(self, process_group: str) -> str:
        """Get the file prefix for a process group"""
        if process_group in self.process_groups:
            return self.process_groups[process_group]["file_prefix"]
        return "unknown"

    def read_scenario_file(self, scenario_filename: str) -> List[Dict[str, Any]]:
        """Read and parse the scenario file from the scenarios directory"""
        try:
            # Construct the full path to the scenario file
            scenario_file_path = os.path.join(self.scenarios_dir, scenario_filename)
            
            with open(scenario_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Only parse files with 'Question X' format
            questions = []
            question_blocks = re.split(r'Question\s+\d+', content)
            if len(question_blocks) > 1:
                for i, block in enumerate(question_blocks[1:], 1):  # Skip first empty block
                    if block.strip():
                        lines = block.strip().split('\n')
                        question = {
                            'id': f"question_{i}",
                            'content': block.strip(),
                            'lines': lines,
                            'question_number': i
                        }
                        questions.append(question)
                return questions
            else:
                # No 'Question X' blocks found, ignore file
                return []
        except FileNotFoundError:
            print(f"Error: Scenario file '{scenario_filename}' not found in {self.scenarios_dir} directory.")
            return []
        except Exception as e:
            print(f"Error reading scenario file: {str(e)}")
            return []

    def generate_questions(
        self,
        process_group: str,
        process: str = "all",
        scenario_filename: str = None,
        runinLLM: bool = False
    ) -> Dict[str, Any]:
        """Generate questions for the specified process and process group based on scenarios"""
        
        if not scenario_filename:
            return {
                "questions": [],
                "prompt": "",
                "message": "No scenario file provided"
            }
        
        # Read scenarios from file
        scenarios = self.read_scenario_file(scenario_filename)
        
        if not scenarios:
            return {
                "questions": [],
                "prompt": "",
                "message": "No scenarios found in file or file could not be read"
            }
        
        # Build the prompt
        prompt_text = self.build_prompt_text(process, process_group, scenarios)
        
        if runinLLM:
            # This would be where you'd actually call the LLM
            # For now, return a placeholder
            return {
                "questions": [],
                "prompt": prompt_text,
                "message": "LLM integration not implemented yet"
            }
        else:
            return {
                "questions": [],
                "prompt": prompt_text
            }

    def save_questions(self, questions: List[Dict[str, Any]], process_group: str, output_file: str = None):
        """Save questions to a TypeScript file"""
        if not questions:
            print("No questions to save")
            return
        
        # Determine output file
        if output_file:
            filepath = output_file
        else:
            # Create questions directory if it doesn't exist
            questions_dir = "src/questions"
            os.makedirs(questions_dir, exist_ok=True)
            
            # Generate filename based on process group or use scenario_based
            if process_group == "all":
                filename = "scenario_based.ts"
            else:
                prefix = self.get_process_group_file_prefix(process_group)
                filename = f"scenario_based_{prefix}.ts"
            
            filepath = os.path.join(questions_dir, filename)
        
        # Convert questions to TypeScript format
        ts_content = "export const questions = [\n"
        
        for i, question in enumerate(questions):
            ts_content += "  {\n"
            
            # Add question fields
            for key, value in question.items():
                if key == "options_pmp":
                    ts_content += f'    {key}: {{\n'
                    for opt_key, opt_value in value.items():
                        ts_content += f'      "{opt_key}": "{opt_value}",\n'
                    ts_content += "    },\n"
                elif key == "analysis":
                    ts_content += f'    {key}: {{\n'
                    for analysis_key, analysis_value in value.items():
                        if isinstance(analysis_value, list):
                            ts_content += f'      {analysis_key}: {json.dumps(analysis_value)},\n'
                        else:
                            ts_content += f'      {analysis_key}: "{analysis_value}",\n'
                    ts_content += "    },\n"
                elif isinstance(value, str):
                    ts_content += f'    {key}: "{value}",\n'
                elif isinstance(value, bool):
                    ts_content += f'    {key}: {str(value).lower()},\n'
                else:
                    ts_content += f'    {key}: {json.dumps(value)},\n'
            
            ts_content += "  }"
            if i < len(questions) - 1:
                ts_content += ","
            ts_content += "\n"
        
        ts_content += "];\n"
        
        # Save to file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(ts_content)
        
        print(f"Questions saved to {filepath}")

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts using simple word overlap"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)

    def get_process_group_info(self, process_group: str) -> Dict[str, Any]:
        """Get information about a process group"""
        return self.process_groups.get(process_group, {})

    def _get_knowledge_area_for_process(self, process: str, process_group: str) -> str:
        """
        Get the knowledge area for a specific process.
        (For example, 'Control Quality' in 'Monitoring and Controlling' maps to 'Quality'.)
        """
        # (You can expand this mapping as needed.)
        mapping = {
            "Control Quality": "Quality",
            "Validate Scope": "Scope",
            "Control Scope": "Scope",
            "Control Schedule": "Schedule",
            "Control Costs": "Cost",
            "Control Resources": "Resources",
            "Monitor Communications": "Communications",
            "Monitor Risks": "Risk",
            "Control Procurements": "Procurement",
            "Monitor Stakeholder Engagement": "Stakeholders",
            "Manage Quality": "Quality",
            "Acquire Resources": "Resources",
            "Manage Communications": "Communications",
            "Conduct Procurements": "Procurement",
            "Manage Stakeholder Engagement": "Stakeholders",
            "Develop Project Charter": "Integration",
            "Identify Stakeholders": "Stakeholders",
            "Develop Project Management Plan": "Integration",
            "Plan Scope Management": "Scope",
            "Collect Requirements": "Scope",
            "Define Scope": "Scope",
            "Create WBS": "Scope",
            "Plan Schedule Management": "Schedule",
            "Define Activities": "Schedule",
            "Sequence Activities": "Schedule",
            "Estimate Activity Durations": "Schedule",
            "Develop Schedule": "Schedule",
            "Plan Cost Management": "Cost",
            "Estimate Costs": "Cost",
            "Determine Budget": "Cost",
            "Plan Quality Management": "Quality",
            "Plan Resource Management": "Resources",
            "Estimate Activity Resources": "Resources",
            "Plan Communications Management": "Communications",
            "Plan Risk Management": "Risk",
            "Identify Risks": "Risk",
            "Perform Qualitative Risk Analysis": "Risk",
            "Perform Quantitative Risk Analysis": "Risk",
            "Plan Risk Responses": "Risk",
            "Plan Procurement Management": "Procurement",
            "Plan Stakeholder Engagement": "Stakeholders",
            "Direct and Manage Project Work": "Integration",
            "Manage Project Knowledge": "Integration",
            "Monitor and Control Project Work": "Integration",
            "Perform Integrated Change Control": "Integration",
            "Close Project or Phase": "Integration",
            "Close Procurements": "Procurement"
        }
        return mapping.get(process, "Integration")  # Default to "Integration" if not found

    def build_prompt_text(self, process: str, process_group: str, scenarios: List[Dict[str, Any]]) -> str:
        """
        Build the full prompt text for generating similar questions based on scenarios.
        """
        num_questions = len(scenarios)
        
        # Build questions section
        questions_text = ""
        for i, question in enumerate(scenarios, 1):
            questions_text += f"\nQUESTION {i}:\n{question['content']}\n"
        
        prompt = f"""
You are a PMP exam question generator. You will be provided with {num_questions} questions from a text file. Generate EXACTLY {num_questions} unique, high-quality, scenario-based PMP-style multiple-choice questions - ONE QUESTION PER QUESTION IN THE FILE.

CRITICAL REQUIREMENT - QUESTION-BASED GENERATION:
- You MUST generate EXACTLY {num_questions} questions - ONE QUESTION PER QUESTION IN THE FILE
- Each generated question MUST be based on the corresponding question provided
- DO NOT use the questions exactly as provided - BUILD UPON them with variations
- Change the actors, domain, and scenarios slightly while maintaining the core concept
- Ensure each generated question is unique and different from the original question

PROVIDED QUESTIONS:{questions_text}

Requirements:
- Each question must be realistic, relevant, and test a specific concept from PMP.
- Each question must have exactly 4 unique, plausible options (A, B, C, D).
- Only one option must be correct, and the correct answer must be randomly distributed among A/B/C/D (i.e. the correct answer must be randomly placed as OPTION_A, OPTION_B, OPTION_C, or OPTION_D). Do not always place the correct answer in the same position (for example, do not always put the correct answer as OPTION_A).
- Each option must be a complete sentence and not reused across questions.
- Each question must include detailed explanations for all options:
    - CORRECT: Start with "CORRECT - ", explain why it's correct, reference PMBOK/PMI best practices, and provide real-world context (3-4 sentences).
    - INCORRECT: Start with "INCORRECT - ", explain why it's wrong, reference PMI concepts, and describe negative impacts (3-4 sentences).
- Explanations must be unique, detailed, and never generic or repeated.
- Each question must include an analysis section with:
    - process_group: You must analyze the question content and determine the most appropriate PMP Process Group (must be one of: Initiating, Planning, Executing, Monitoring and Controlling, Closing). Make your best guess based on the question scenario and context.
    - knowledge_area: You must analyze the question content and determine the most appropriate PMP Knowledge Area (must be one of: Integration, Scope, Schedule, Cost, Quality, Resources, Communications, Risk, Procurement, Stakeholders). Make your best guess based on the question scenario and context.
    - tool (if applicable)
    - suggested_read (2-3 specific PMBOK/PMI resources)
    - concepts_to_understand (concise, max 150 words)
    - additional_notes: Provide exactly 200 words explaining the question context, key concepts, and what leads to the correct answer. Do not use bullet points - use paragraphs if needed. This should be a comprehensive explanation that helps understand the question and guides to the correct answer.

Output must be valid JSON, following this format:

{{
  "questions": [
    {{
      "id": "[unique_id]",
      "question_pmp": "Your unique PMP-style question text here (2-8 lines as needed)",
      "options_pmp": {{
        "OPTION_A": "Unique first option text (PMP exam style) (randomly place the correct answer here, or in B, C, or D)",
        "OPTION_B": "Unique second option text (PMP exam style) (randomly place the correct answer here, or in A, C, or D)",
        "OPTION_C": "Unique third option text (PMP exam style) (randomly place the correct answer here, or in A, B, or D)",
        "OPTION_D": "Unique fourth option text (PMP exam style) (randomly place the correct answer here, or in A, B, or C)"
      }},
      "is_attempted": false,
      "selected_option": "",
      "question_type": "Option",
      "is_valid": false,
      "analysis": {{
        "option_a_result": "CORRECT - ... or INCORRECT - ... (randomly place the correct answer here, or in B, C, or D)",
        "option_b_result": "... (randomly place the correct answer here, or in A, C, or D)",
        "option_c_result": "... (randomly place the correct answer here, or in A, B, or D)",
        "option_d_result": "... (randomly place the correct answer here, or in A, B, or C)",
        "process_group": "[Your best guess based on question content - must be one of: Initiating, Planning, Executing, Monitoring and Controlling, Closing]",
        "knowledge_area": "[Your best guess based on question content - must be one of: Integration, Scope, Schedule, Cost, Quality, Resources, Communications, Risk, Procurement, Stakeholders]",
        "tool": "[Tool]",
        "suggested_read": ["...", "..."],
        "concepts_to_understand": "...",
        "additional_notes": "[Exactly 200 words explaining question context, key concepts, and what leads to the correct answer. No bullet points - use paragraphs if needed]"
      }}
    }}
    // ... exactly {num_questions} questions total ...
  ]
}}

IMPORTANT JSON RULES:
- No trailing commas
- All strings in double quotes
- No comments or undefined/null values
- All objects/arrays properly closed
- Boolean values lowercase (true/false)
- No line breaks within string values
- ALWAYS include exactly 4 options (A, B, C, D) for every question
- The "questions" array MUST contain exactly {num_questions} questions
- process_group and knowledge_area MUST be determined by analyzing the question content
- additional_notes MUST be exactly 200 words with detailed explanations

Do not include any explanations or text outside the JSON structure.
"""
        return prompt


def main():
    parser = argparse.ArgumentParser(description='Generate PMP questions based on scenarios from a text file')
    parser.add_argument('--scenario-file', '-s', required=True,
                      help='Scenario filename in the scenarios directory (required)')
    parser.add_argument('--runinLLM', '-r', type=str, choices=['True', 'False', 'true', 'false'], default='False',
                      help='Whether to run the prompt in LLM (default: False). Use --runinLLM True or --runinLLM False')
    parser.add_argument('--output', '-o', 
                      help='Output file path (optional). If not provided, will save to src/questions/scenario_based.ts')
    
    args = parser.parse_args()
    
    # Convert runinLLM string to boolean
    runinLLM = args.runinLLM.lower() == 'true'
    
    generator = PMPScenarioQuestionGenerator()
    
    # Create scenarios directory if it doesn't exist
    os.makedirs(generator.scenarios_dir, exist_ok=True)
    
    try:
        # Read scenarios first to get count
        scenarios = generator.read_scenario_file(args.scenario_file)
        if not scenarios:
            print("No scenarios found in the provided file")
            return 1
        
        # Use default process group and process
        process_group = "Planning"  # Default process group
        process = "all"  # Default process
        
        # Generate questions
        result = generator.generate_questions(
            process_group,
            process,
            args.scenario_file,
            runinLLM
        )
        
        if not runinLLM:
            # Build the actual prompt text for the LLM
            prompt_text = generator.build_prompt_text(process, process_group, scenarios)
            filepath = generator.save_prompt_to_file(args.scenario_file, prompt_text)
            print(f"Scenario-based prompts have been saved to {filepath}")
            print(f"Generated prompt for {len(scenarios)} scenarios")
            print(f"Using default process group: {process_group}")
            print(f"Using default process: {process}")
            return 0
            
        questions = result.get("questions", [])
        if not questions:
            print(f"No questions were generated for {process} in {process_group}")
            return 1
        
        # Save questions (only if runinLLM is True)
        generator.save_questions(questions, process_group, args.output)
        print(f"Generated scenario-based questions for {process_group} process group, saved to {generator.get_process_group_file_prefix(process_group)}.ts")
        return 0
        
    except ValueError as e:
        print(f"\nError: {e}")
        return 1

if __name__ == '__main__':
    exit(main()) 