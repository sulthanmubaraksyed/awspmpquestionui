import json
import datetime
import uuid
import argparse
import os
import random
from typing import List, Dict, Any
from pathlib import Path
import re

class PMPQuestionGenerator:
    prompts_dir = "src/prompts/saved"  # Directory for saved prompts
    used_questions_file = "src/prompts/used_questions.json"  # File to track used questions

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

    def save_prompt_to_file(self, process: str, prompt_content: str) -> str:
        """Save the prompt content to a file"""
        # Create the prompts directory if it doesn't exist
        os.makedirs(self.prompts_dir, exist_ok=True)
        
        # Generate filename
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        process_safe = self.sanitize_filename(process)
        filename = f"prompt_{process_safe}_{timestamp}.txt"
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

    def generate_questions(
        self,
        process_group: str,
        process: str = "all",
        runinLLM: bool = False,
        num_of_questions: int = 20
    ) -> Dict[str, Any]:
        """Generate questions for the specified process and process group"""
        # Build the prompt
        prompt_text = self.build_prompt_text(process, process_group, num_of_questions)
        
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
            
            # Generate filename based on process group
            if process_group == "all":
                filename = "all.ts"
            else:
                prefix = self.get_process_group_file_prefix(process_group)
                filename = f"{prefix}.ts"
            
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

    def build_prompt_text(self, process: str, process_group: str, num_questions: int) -> str:
        """
        Build the full prompt text (instructions + requirements + output format) for the LLM.
        """
        knowledge_area = self._get_knowledge_area_for_process(process, process_group)
        
        # Calculate difficulty distribution
        difficult_count = int(num_questions * 0.8)  # 80% difficult questions
        easy_count = num_questions - difficult_count  # 20% easy questions
        
        prompt = f"""
You are a PMP exam question generator. Generate EXACTLY {num_questions} unique, high-quality, scenario-based PMP-style multiple-choice questions for the process: {process} (Process Group: {process_group}).

CRITICAL REQUIREMENT - EXACT QUESTION COUNT:
- You MUST generate EXACTLY {num_questions} questions - NO MORE, NO LESS
- Do not generate fewer than {num_questions} questions
- Do not generate more than {num_questions} questions
- This is a strict requirement that must be followed precisely
- The JSON output must contain exactly {num_questions} questions in the "questions" array

CRITICAL REQUIREMENT - ALWAYS FOUR OPTIONS:
- EVERY question MUST have exactly 4 options: A, B, C, and D
- NEVER create questions with fewer or more than 4 options
- ALL options must be labeled as OPTION_A, OPTION_B, OPTION_C, and OPTION_D
- This is a strict requirement that cannot be violated

CRITICAL REQUIREMENT - QUESTION LENGTH VARIATION:
- Questions MUST vary in length from 2 to 6 lines
- Distribute question lengths across the {num_questions} questions as follows:
  * 2-line questions: 20% of questions (approximately {int(num_questions * 0.2)} questions)
  * 3-line questions: 25% of questions (approximately {int(num_questions * 0.25)} questions)
  * 4-line questions: 25% of questions (approximately {int(num_questions * 0.25)} questions)
  * 5-line questions: 20% of questions (approximately {int(num_questions * 0.2)} questions)
  * 6-line questions: 10% of questions (approximately {int(num_questions * 0.1)} questions)
- 2-line questions should be concise and direct
- 3-4 line questions should provide moderate context and detail
- 5-6 line questions should include complex scenarios with multiple variables
- Ensure natural distribution without forcing exact counts

CRITICAL REQUIREMENT - QUESTION STYLE VARIETY:
- Use DIFFERENT PMP question styles and formats for each question
- Do NOT follow the same question pattern or structure for all questions
- Vary the question types, scenarios, and presentation styles
- Include a comprehensive mix of these PMP question styles:

SCENARIO-BASED STYLES:
  * "What should the project manager do NEXT?" questions
  * "What should the project manager do FIRST?" questions
  * "What is the MOST appropriate action?" questions
  * "What is the BEST approach?" questions
  * "What is the CORRECT response?" questions

TOOL AND TECHNIQUE STYLES:
  * "Which tool or technique is MOST appropriate?" questions
  * "Which tool should be used?" questions
  * "What technique would be BEST?" questions
  * "Which method should be applied?" questions

DOCUMENT AND PROCESS STYLES:
  * "Which document should be updated?" questions
  * "Which document should be created?" questions
  * "Which process should be performed?" questions
  * "Which process group does this belong to?" questions

ANALYSIS AND EVALUATION STYLES:
  * "What is the MOST likely cause?" questions
  * "What is the PRIMARY reason?" questions
  * "What is the ROOT cause?" questions
  * "What is the MOST probable outcome?" questions

SEQUENCE AND ORDER STYLES:
  * "What is the CORRECT sequence?" questions
  * "Which step should come FIRST?" questions
  * "What is the proper order?" questions
  * "Which activity should be performed NEXT?" questions

STAKEHOLDER AND COMMUNICATION STYLES:
  * "Which stakeholder should be consulted?" questions
  * "Who should be involved?" questions
  * "What communication method is BEST?" questions
  * "Which stakeholder has the MOST influence?" questions

PURPOSE AND OBJECTIVE STYLES:
  * "What is the PRIMARY purpose?" questions
  * "What is the MAIN objective?" questions
  * "What is the INTENDED outcome?" questions
  * "What is the GOAL of this process?" questions

METRIC AND MEASUREMENT STYLES:
  * "Which metric should be monitored?" questions
  * "What KPI is MOST important?" questions
  * "Which measurement is BEST?" questions
  * "What indicator should be tracked?" questions

RISK AND ISSUE STYLES:
  * "What is the GREATEST risk?" questions
  * "Which risk response is MOST appropriate?" questions
  * "What is the BEST mitigation strategy?" questions
  * "How should this issue be addressed?" questions

QUALITY AND COMPLIANCE STYLES:
  * "What quality standard applies?" questions
  * "Which compliance requirement is MOST important?" questions
  * "What quality control measure is BEST?" questions
  * "Which audit approach is MOST effective?" questions

- Vary the scenario complexity, industry context, and project types
- Use different sentence structures, question lengths, and complexity levels
- Ensure each question feels unique and distinct from others
- Mix different industries (construction, IT, healthcare, manufacturing, etc.)
- Include various project sizes (small, medium, large, enterprise)
- Use different organizational structures (functional, matrix, projectized)

DIFFICULTY DISTRIBUTION REQUIREMENT:
- Generate EXACTLY {difficult_count} DIFFICULT questions (80% of {num_questions})
- Generate EXACTLY {easy_count} EASY questions (20% of {num_questions})
- The total must equal {num_questions} questions

DIFFICULT QUESTIONS REQUIREMENTS:
- Must test deep understanding of PMP concepts
- Must have TWO OPTIONS THAT ARE SO CLOSE that candidates will struggle to distinguish between them
- These two close options should be very similar in wording, concept, or approach
- Only ONE of these two close options should be correct
- The other close option should be incorrect but extremely plausible and tempting
- The remaining two options should be clearly incorrect but still plausible
- The challenge should be in identifying the subtle difference that makes one correct and the other incorrect
- Focus on complex scenarios, edge cases, or nuanced PMBOK concepts where the distinction is subtle

EASY QUESTIONS REQUIREMENTS:
- Test basic understanding of PMP concepts
- All options should be clearly distinguishable
- Focus on fundamental concepts and straightforward scenarios

GENERAL REQUIREMENTS:
- Each question must be realistic, relevant, and test a specific concept from the process.
- Each question must have exactly 4 unique, plausible options (A, B, C, D) - NO EXCEPTIONS.
- Only one option must be correct, and the correct answer must be randomly distributed among A/B/C/D (i.e. the correct answer must be randomly placed as OPTION_A, OPTION_B, OPTION_C, or OPTION_D). Do not always place the correct answer in the same position (for example, do not always put the correct answer as OPTION_A).
- Each option must be a complete sentence and not reused across questions.
- Each question must include detailed explanations for all options:
    - CORRECT: Start with "CORRECT - ", explain why it's correct, reference PMBOK/PMI best practices, and provide real-world context (3-4 sentences).
    - INCORRECT: Start with "INCORRECT - ", explain why it's wrong, reference PMI concepts, and describe negative impacts (3-4 sentences).
- Explanations must be unique, detailed, and never generic or repeated.
- Each question must include an analysis section with:
    - process_group (must be one of: Initiating, Planning, Executing, Monitoring and Controlling, Closing)
    - knowledge_area (must be one of: Integration, Scope, Schedule, Cost, Quality, Resources, Communications, Risk, Procurement, Stakeholders) (for this process, use: {knowledge_area})
    - tool (if applicable)
    - suggested_read (2-3 specific PMBOK/PMI resources)
    - concepts_to_understand (concise, max 150 words)
    - additional_notes (quick read links or "No quick reads available for this process")
    - difficulty_level (must be either "difficult" or "easy")

Output must be valid JSON, following this format:

{{
  "questions": [
    {{
      "id": "[unique_id]",
      "question_pmp": "Your unique PMP-style question text here (varying from 2-6 lines as specified)",
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
        "process_group": "{process_group}",
        "knowledge_area": "{knowledge_area}",
        "tool": "[Tool]",
        "suggested_read": ["...", "..."],
        "concepts_to_understand": "...",
        "additional_notes": "...",
        "difficulty_level": "difficult" or "easy"
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

Do not include any explanations or text outside the JSON structure.
"""
        return prompt


def main():
    parser = argparse.ArgumentParser(description='Generate PMP questions with difficulty levels')
    parser.add_argument('--process-group', '-pg', 
                      choices=["Initiating", "Planning", "Executing", "Monitoring and Controlling", "Closing"],
                      required=True,
                      help='PMP Process Group (required)')
    parser.add_argument('--process', '-p', default="all",
                      help='PMP process (e.g., "Define Activities", "Develop Schedule"). If not provided, defaults to "all".')
    parser.add_argument('--runinLLM', '-r', type=str, choices=['True', 'False', 'true', 'false'], default='False',
                      help='Whether to run the prompt in LLM (default: False). Use --runinLLM True or --runinLLM False')
    parser.add_argument('--num-questions', '-n', type=int, default=20,
                      help='Number of questions to generate (default: 20)')
    parser.add_argument('--output', '-o', 
                      help='Output file path (optional). If not provided, will save to src/questions/<process_group_prefix>.ts')
    
    args = parser.parse_args()
    
    # Convert runinLLM string to boolean
    runinLLM = args.runinLLM.lower() == 'true'
    
    generator = PMPQuestionGenerator()
    
    try:
        # Generate questions
        result = generator.generate_questions(
            args.process_group,
            args.process,
            runinLLM,
            args.num_questions
        )
        
        if not runinLLM:
            # Build the actual prompt text for the LLM
            prompt_text = generator.build_prompt_text(args.process, args.process_group, args.num_questions)
            filepath = generator.save_prompt_to_file(args.process, prompt_text)
            print(f"Prompts with difficulty levels have been saved to {filepath}")
            return 0
            
        questions = result.get("questions", [])
        if not questions:
            print(f"No questions were generated for {args.process} in {args.process_group}")
            return 1
        
        # Save questions (only if runinLLM is True)
        generator.save_questions(questions, args.process_group, args.output)
        print(f"Generated questions with difficulty levels for {args.process_group} process group, saved to {generator.get_process_group_file_prefix(args.process_group)}.ts")
        return 0
        
    except ValueError as e:
        print(f"\nError: {e}")
        return 1

if __name__ == '__main__':
    exit(main()) 