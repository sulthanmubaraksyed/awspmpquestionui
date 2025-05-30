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
    scenarios_dir = "src/scenarios"
    prompts_dir = "src/prompts/saved"  # New directory for saved prompts
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
        self.used_scenarios = set()  # Track scenarios used in current session

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

    def _is_scenario_used(self, scenario_text: str) -> bool:
        """Check if a scenario has been used in the current session"""
        return scenario_text.lower().strip() in self.used_scenarios

    def _mark_scenario_used(self, scenario_text: str):
        """Mark a scenario as used in the current session"""
        self.used_scenarios.add(scenario_text.lower().strip())

    def _generate_unique_scenario_text(self, process_group: str, process: str, 
                                     knowledge_area: str, tools: List[str], 
                                     max_attempts: int = 10) -> str:
        """Generate a unique scenario text that hasn't been used before"""
        for _ in range(max_attempts):
            scenario_text = self._generate_scenario_text(process_group, process, knowledge_area, tools)
            if not self._is_scenario_used(scenario_text):
                self._mark_scenario_used(scenario_text)
                return scenario_text
        raise ValueError("Could not generate unique scenario after maximum attempts")

    def _generate_unique_question_templates(self, process_group: str, process: str,
                                          knowledge_area: str, tools: List[str],
                                          max_attempts: int = 10) -> List[Dict[str, Any]]:
        """Generate unique question templates that haven't been used before"""
        templates = []
        used_templates = set()
        
        # Generate 2-3 templates per scenario
        num_templates = random.randint(2, 3)
        
        attempts = 0
        while len(templates) < num_templates and attempts < max_attempts:
            # Generate a unique template based on the process and tools
            template = {
                "template": "",  # Empty template to be filled by LLM
                "options": [
                    {
                        "text": "",  # Empty option text to be filled by LLM
                        "is_correct": False,  # Will be set by LLM
                        "explanation": ""  # Empty explanation to be filled by LLM
                    } for _ in range(4)  # Always generate 4 options
                ]
            }
            
            templates.append(template)
            attempts += 1
        
        if not templates:
            raise ValueError("Could not generate unique question templates after maximum attempts")
        
        return templates

    def get_scenario_file_path(self, scenario_input: str) -> str:
        """Get the full path to the scenario file"""
        # If the input is already a full path, use it
        if os.path.isabs(scenario_input) or os.path.dirname(scenario_input):
            return scenario_input
        
        # Otherwise, look for the file in the scenarios directory
        scenario_file = os.path.join(self.scenarios_dir, scenario_input)
        if not os.path.exists(scenario_file):
            # Try with .json extension if not provided
            if not scenario_input.endswith('.json'):
                scenario_file = os.path.join(self.scenarios_dir, f"{scenario_input}.json")
        
        return scenario_file

    def load_scenario_file(self, scenario_input: str) -> Dict[str, Any]:
        """Load scenario file from the specified path or filename"""
        scenario_file = self.get_scenario_file_path(scenario_input)
        
        try:
            with open(scenario_file, 'r') as f:
                data = json.load(f)
                
            # Validate the scenario file structure
            if not isinstance(data, dict):
                raise ValueError("Scenario file must contain a JSON object")
            
            # Check if this is a ListOfScenarios format
            if "scenarios_list" in data:
                # This is a ListOfScenarios format
                if not isinstance(data["scenarios_list"], list):
                    raise ValueError("'scenarios_list' must be an array")
                
                # Load and combine all scenarios from the list
                combined_scenarios = []
                for scenario_file in data["scenarios_list"]:
                    try:
                        scenario_path = self.get_scenario_file_path(scenario_file)
                        with open(scenario_path, 'r') as f:
                            scenario_data = json.load(f)
                            if not isinstance(scenario_data, dict):
                                print(f"Warning: Invalid scenario file format in {scenario_file} - not a JSON object")
                                continue
                            if "scenarios" not in scenario_data:
                                print(f"Warning: Invalid scenario file format in {scenario_file} - missing 'scenarios' key")
                                continue
                            
                            # Convert scenarios to the expected format
                            converted_scenarios = self._convert_scenarios_to_standard_format(scenario_data["scenarios"], scenario_file)
                            combined_scenarios.extend(converted_scenarios)
                            
                    except Exception as e:
                        print(f"Warning: Could not load scenario file {scenario_file}: {str(e)}")
                        continue
                
                if not combined_scenarios:
                    raise ValueError("No valid scenarios found in any of the listed files")
                
                # Create a combined data structure
                data = {
                    "process_group": data.get("process_group", "all"),
                    "scenarios": combined_scenarios
                }
            else:
                # Original format validation
                required_keys = ["process_group", "scenarios"]
                missing_keys = [key for key in required_keys if key not in data]
                if missing_keys:
                    raise ValueError(f"Scenario file missing required keys: {', '.join(missing_keys)}")
                
                if not isinstance(data["scenarios"], list):
                    raise ValueError("'scenarios' must be an array")
                
                # Convert scenarios to the expected format
                converted_scenarios = self._convert_scenarios_to_standard_format(data["scenarios"], scenario_file)
                if not converted_scenarios:
                    raise ValueError("No valid scenarios found in the file")
                
                data["scenarios"] = converted_scenarios
            
            return data
            
        except FileNotFoundError:
            raise ValueError(f"Scenario file not found: {scenario_file}. Please ensure the file exists in {self.scenarios_dir} or provide the full path.")
        except json.JSONDecodeError:
            raise ValueError(f"Invalid JSON in scenario file: {scenario_file}")

    def _convert_scenarios_to_standard_format(self, scenarios: List[Any], source_file: str) -> List[Dict[str, Any]]:
        """Convert scenarios from various formats to the standard format"""
        if not isinstance(scenarios, list):
            print(f"Warning: Invalid scenarios format in {source_file} - not a list")
            return []
        
        converted_scenarios = []
        
        # Get process group from filename
        file_prefix = os.path.splitext(os.path.basename(source_file))[0]
        process_group = None
        for pg, info in self.process_groups.items():
            if info["file_prefix"] == file_prefix:
                process_group = pg
                break
        
        for i, raw_scenario in enumerate(scenarios):
            try:
                converted_scenario = None
                
                # Case 1: Scenario is a string (simple text)
                if isinstance(raw_scenario, str):
                    # Extract process name from scenario text if possible
                    scenario_text = raw_scenario.lower()
                    process_name = None
                    if process_group:
                        for proc in self.process_groups[process_group]["processes"]:
                            if proc.lower() in scenario_text:
                                process_name = proc
                                break
                    
                    converted_scenario = {
                        "scenario_id": f"{file_prefix}_{i+1:03d}",
                        "scenario_text": raw_scenario,
                        "knowledge_area": "Integration",  # Default to Integration
                        "tools": ["expert_judgment"],  # Default tool
                        "concepts": ["project management"] + ([process_name] if process_name else []),  # Include process name if found
                        "suggested_read": ["PMBOK Guide"],  # Default reading
                        "question_templates": [
                            {
                                "template": "What should the project manager do in this situation?",
                                "options": [
                                    {
                                        "text": "Option A - This is a placeholder option. Please replace with actual options.",
                                        "is_correct": True,
                                        "explanation": "CORRECT - This is a placeholder explanation. Please replace with actual explanation."
                                    },
                                    {
                                        "text": "Option B - This is a placeholder option. Please replace with actual options.",
                                        "is_correct": False,
                                        "explanation": "INCORRECT - This is a placeholder explanation. Please replace with actual explanation."
                                    },
                                    {
                                        "text": "Option C - This is a placeholder option. Please replace with actual options.",
                                        "is_correct": False,
                                        "explanation": "INCORRECT - This is a placeholder explanation. Please replace with actual explanation."
                                    },
                                    {
                                        "text": "Option D - This is a placeholder option. Please replace with actual options.",
                                        "is_correct": False,
                                        "explanation": "INCORRECT - This is a placeholder explanation. Please replace with actual explanation."
                                    }
                                ]
                            }
                        ]
                    }
                
                # Case 2: Scenario is a dict with 'scenario' key
                elif isinstance(raw_scenario, dict) and "scenario" in raw_scenario:
                    # Extract process name from scenario text if possible
                    scenario_text = raw_scenario["scenario"].lower()
                    process_name = None
                    if process_group:
                        for proc in self.process_groups[process_group]["processes"]:
                            if proc.lower() in scenario_text:
                                process_name = proc
                                break
                    
                    converted_scenario = {
                        "scenario_id": f"{file_prefix}_{i+1:03d}",
                        "scenario_text": raw_scenario["scenario"],
                        "knowledge_area": raw_scenario.get("knowledge_area", "Integration"),
                        "tools": raw_scenario.get("tools", ["expert_judgment"]),
                        "concepts": raw_scenario.get("concepts", ["project management"]) + ([process_name] if process_name else []),
                        "suggested_read": raw_scenario.get("suggested_read", ["PMBOK Guide"]),
                        "question_templates": [
                            {
                                "template": "What should the project manager do in this situation?",
                                "options": [
                                    {
                                        "text": "Option A - This is a placeholder option. Please replace with actual options.",
                                        "is_correct": True,
                                        "explanation": "CORRECT - This is a placeholder explanation. Please replace with actual explanation."
                                    },
                                    {
                                        "text": "Option B - This is a placeholder option. Please replace with actual options.",
                                        "is_correct": False,
                                        "explanation": "INCORRECT - This is a placeholder explanation. Please replace with actual explanation."
                                    },
                                    {
                                        "text": "Option C - This is a placeholder option. Please replace with actual options.",
                                        "is_correct": False,
                                        "explanation": "INCORRECT - This is a placeholder explanation. Please replace with actual explanation."
                                    },
                                    {
                                        "text": "Option D - This is a placeholder option. Please replace with actual options.",
                                        "is_correct": False,
                                        "explanation": "INCORRECT - This is a placeholder explanation. Please replace with actual explanation."
                                    }
                                ]
                            }
                        ]
                    }
                
                # Case 3: Scenario is already in the expected format
                elif isinstance(raw_scenario, dict) and all(key in raw_scenario for key in ["scenario_id", "scenario_text", "knowledge_area", "tools", "concepts", "suggested_read", "question_templates"]):
                    converted_scenario = raw_scenario
                
                if converted_scenario is not None:
                    converted_scenarios.append(converted_scenario)
                else:
                    print(f"Warning: Invalid scenario format in {source_file} at index {i} - skipping")
                
            except Exception as e:
                print(f"Warning: Error converting scenario in {source_file} at index {i}: {str(e)}")
                continue
        
        return converted_scenarios

    def generate_question_id(self, process_group: str, scenario_id: str) -> str:
        """Generate a unique question ID in the format Q_YYYYMMDD_1_XXX"""
        today = datetime.datetime.now().strftime("%Y%m%d")
        unique_num = str(uuid.uuid4().int)[:3]  # Get first 3 digits of UUID
        return f"Q_{today}_1_{unique_num}"

    def sanitize_filename(self, filename: str) -> str:
        """Sanitize a string to be used as a filename"""
        # Replace invalid characters with underscores
        sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # Remove leading/trailing spaces and dots
        sanitized = sanitized.strip('. ')
        return sanitized

    def save_prompt_to_file(self, process: str, scenarios: List[Dict[str, Any]], prompt_content: str) -> str:
        """Save consolidated prompt content to a file and return the file path"""
        # Create prompts directory if it doesn't exist
        Path(self.prompts_dir).mkdir(parents=True, exist_ok=True)
        
        # Generate timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Sanitize process name
        sanitized_process = self.sanitize_filename(process)
        
        # Create filename with number of scenarios
        filename = f"{sanitized_process}_{len(scenarios)}_scenarios_{timestamp}.txt"
        filepath = os.path.join(self.prompts_dir, filename)
        
        # Write prompt content to file
        with open(filepath, 'w') as f:
            f.write(prompt_content)
        
        return filepath

    def get_process_group_file_prefix(self, process_group: str) -> str:
        """Get the file prefix for a process group"""
        process_group_prefixes = {
            "Initiating": "in",
            "Planning": "pl",
            "Executing": "ex",
            "Monitoring and Controlling": "mc",
            "Closing": "cl",
            "all": "all"
        }
        return process_group_prefixes.get(process_group, "all")

    def generate_question_from_scenario(
        self,
        scenarios: List[Dict[str, Any]],
        process_group: str,
        process: str = "all",
        runinLLM: bool = False,
        num_of_questions: int = 20
    ) -> Dict[str, Any]:
        """Generate PMP questions directly without scenario dependency"""
        if not runinLLM:
            # Create a simplified prompt for direct question generation
            prompt_content = f"""Role: You are a certified PMP exam content developer tasked with creating high-quality, realistic PMP-style questions. Your responsibility is to ensure that each question tests deep understanding of PMI's best practices and the PMBOK Guide, specifically focusing on the "{process_group}" process group and the "{process}" process. Your questions must reflect real-world project scenarios, be pedagogically sound, and strictly follow the PMP exam structure and expectations.

Process Group: {process_group}
Process: {process}
Target Number of Questions: {num_of_questions}

Instructions:
Generate {num_of_questions} unique, high-quality PMP-style questions that test understanding of project management processes. While we aim for {num_of_questions} questions, prioritize quality and uniqueness over quantity. If you cannot generate {num_of_questions} questions while maintaining the highest quality standards, generate fewer questions rather than compromising on quality.

Key Requirements:
1. Question Quality:
   - Each question must be completely unique and different from others
   - Questions must test deep understanding of PMI's best practices and PMBOK Guide processes
   - Questions must be realistic and reflect real-world project management situations
   - Questions must be clear, unambiguous, and well-structured
   - Questions must be specific to the process and knowledge area
   - Questions must require analysis and application of PMBOK Guide concepts
   - Questions can range from 2 to 8 lines in length, depending on the complexity of the scenario
   - Questions must include realistic project context appropriate to the process being tested
   - Target: Generate {num_of_questions} questions, but only if they meet all quality criteria

2. Options Structure and Uniqueness:
   - Each question must have exactly 4 distinct options
   - Options must be completely unique across all questions - DO NOT reuse option text
   - The correct answer MUST be randomly distributed between options A, B, C, and D
   - For a set of {num_of_questions} questions, aim for approximately equal distribution of correct answers:
     * About {num_of_questions//4} questions should have correct answer as Option A
     * About {num_of_questions//4} questions should have correct answer as Option B
     * About {num_of_questions//4} questions should have correct answer as Option C
     * About {num_of_questions//4} questions should have correct answer as Option D
   - Each option must be written specifically for its question - no generic options
   - Options must not overlap in meaning within the same question
   - Options must be realistic and plausible
   - Options must test different aspects of the process
   - Only one option must be clearly correct
   - All options must be complete sentences
   - Options must follow PMP exam patterns
   - Options must be of similar length and structure
   - Options must be directly related to the process being tested
   - Avoid patterns like always putting the correct answer in the same position
   - Each option should be crafted to test a specific aspect of the process
   - Options should not be easily guessable without understanding the process
   - The correct answer should not follow any predictable pattern (e.g., not always Option A or always the longest option)
   - When writing explanations, ensure the CORRECT explanation matches the randomly selected option position (A, B, C, or D)

3. Explanation Requirements:
   - Each option explanation must be detailed and educational, following this structure:
     For CORRECT options:
     * Start with "CORRECT - "
     * Explain why this is the best answer
     * Reference specific PMBOK Guide processes and concepts
     * Describe how it aligns with PMI's best practices
     * Explain the practical benefits and implications
     * Include stakeholder impact and considerations
     * Provide real-world application examples
     * Minimum 3-4 sentences of detailed explanation

     For INCORRECT options:
     * Start with "INCORRECT - "
     * Explain why this option is wrong
     * Identify the specific PMI concept or process that makes it incorrect
     * Describe the potential negative impacts
     * Explain what would be the correct approach
     * Include stakeholder implications
     * Provide examples of why this approach would fail
     * Minimum 3-4 sentences of detailed explanation

   - All explanations must:
     * Be unique and specific to the option
     * Never reuse explanations across different questions
     * Follow PMI's perspective and terminology
     * Include practical implications
     * Address process group and knowledge area relevance
     * Be detailed and educational
     * Never use generic phrases like "This is incorrect because it's wrong"
     * Never use placeholder text or incomplete explanations

4. Analysis Requirements:
   Process Group:
   - Must be exactly one of: Initiating, Planning, Executing, Monitoring and Controlling, Closing
   - Must be the most appropriate process group for the question

   Knowledge Area:
   - Must be exactly one of: Integration, Scope, Schedule, Cost, Quality, Resource, Communications, Risk, Procurement, Stakeholder Management
   - Must be the most relevant knowledge area for the process being tested

   Suggested Reading:
   - Must list exactly 2-3 specific PMBOK Guide sections or other PMP resources
   - Resources must be directly relevant to the process being tested
   - Resources must help in understanding the process better

   Concepts to Understand:
   - Must provide a unique, concise explanation (maximum 150 words)
   - Must include the process's purpose and objectives
   - Must explain when and how to apply the process
   - Must describe practical applications
   - Must be clear and educational

   Additional Notes:
   - MUST include quick read links when available in format: "Quick Read: [resource name] - [URL]"
   - Quick read links should be to official PMI resources, PMBOK Guide sections, or trusted PMP study materials
   - If no quick reads are available, state: "No quick reads available for this process"
   - Can also include full summary or process details if needed, covering:
     * Process purpose and objectives
     * Key inputs and outputs
     * Process steps and activities
     * Integration with other processes
     * Common challenges and limitations
     * Best practices for implementation
     * Real-world examples
     * Impact on project success
     * PMI's perspective on the process

Professional Review Guidelines:
After generating each question, review it using these criteria:

Aspect	What to Check or Improve
✅ Clarity	Rephrase awkward or confusing wording
✅ Relevance	Ensure the scenario fits a realistic project context
✅ PMI Alignment	Match terminology to the PMBOK Guide (e.g., "Develop Project Charter" not "start planning")
✅ Grammar & Flow	Check sentence structure, punctuation, and transitions
✅ Distractor Logic	Ensure incorrect options are plausible but clearly wrong
✅ Justifications	Each explanation should reference a PMI process, concept, or best practice
✅ Option Uniqueness	Verify that options are not reused across questions and are randomly distributed
✅ Answer Distribution	Ensure correct answers are evenly distributed across options A, B, C, and D (approximately {num_of_questions//4} each)
✅ Random Placement	Verify that correct answers don't follow any predictable pattern or position

OUTPUT FORMAT:
The response must follow this exact format, with no truncation or ellipses. Generate up to {num_of_questions} unique, high-quality questions. It is acceptable to generate fewer questions if that ensures uniqueness and quality. The system will validate each question against strict quality criteria, and only questions meeting all requirements will be accepted.

IMPORTANT JSON FORMATTING RULES:
1. NO trailing commas after the last item in objects or arrays
2. All strings must be properly escaped
3. All objects and arrays must be properly closed
4. No comments in the JSON
5. No line breaks within string values
6. All property names must be in double quotes
7. All string values must be in double quotes
8. Boolean values must be lowercase (true/false)
9. No undefined or null values - use empty strings or arrays instead
10. Ensure the entire JSON structure is complete and valid

{{
    "questions": [
        {{
            "id": "[unique_id]",
            "question_pmp": "Your unique PMP-style question text here (2-8 lines as needed)",
            "options_pmp": {{
                "OPTION_A": "Unique first option text (following PMP exam patterns, never reused)",
                "OPTION_B": "Unique second option text (following PMP exam patterns, never reused)",
                "OPTION_C": "Unique third option text (following PMP exam patterns, never reused)",
                "OPTION_D": "Unique fourth option text (following PMP exam patterns, never reused)"
            }},
            "is_attempted": false,
            "selected_option": "",
            "question_type": "Option",
            "is_valid": "false",
            "analysis": {{
                "option_a_result": "CORRECT - [Detailed explanation of why this is the best answer, including PMBOK Guide references, practical implications, stakeholder impact, and real-world examples. Minimum 3-4 sentences.]",
                "option_b_result": "INCORRECT - [Detailed explanation of why this option is wrong, including specific PMI concepts that make it incorrect, potential negative impacts, correct approach, and stakeholder implications. Minimum 3-4 sentences.]",
                "option_c_result": "INCORRECT - [Detailed explanation of why this option is wrong, including specific PMI concepts that make it incorrect, potential negative impacts, correct approach, and stakeholder implications. Minimum 3-4 sentences.]",
                "option_d_result": "INCORRECT - [Detailed explanation of why this option is wrong, including specific PMI concepts that make it incorrect, potential negative impacts, correct approach, and stakeholder implications. Minimum 3-4 sentences.]",
                "process_group": "[Determine which PMP Process Group this process belongs to: Initiating, Planning, Executing, Monitoring and Controlling, Closing]",
                "knowledge_area": "[Determine which PMP Knowledge Area this process belongs to. Must be exactly one of: Integration, Scope, Schedule, Cost, Quality, Resource, Communications, Risk, Procurement, Stakeholder Management]",
                "tool": "[Specify the primary tool or technique being tested]",
                "suggested_read": [
                    "[List 2-3 specific PMBOK Guide sections or other PMP resources that would help understand this process better]"
                ],
                "concepts_to_understand": "[Provide a unique, concise explanation (max 150 words) of the key concepts related to this process, including its purpose, when to apply it, and practical applications]",
                "additional_notes": "[MUST include quick read links when available in format: 'Quick Read: [resource name] - [URL]'. If no quick reads available, state: 'No quick reads available for this process'. Can also include full summary or process details if needed.]"
            }}
        }}
    ]
}}

Note: While the target is {num_of_questions} questions, the system will only accept questions that meet all quality criteria. It is better to generate fewer high-quality questions than to generate {num_of_questions} questions that don't meet the standards. Additionally, ensure the JSON output is syntactically valid by following all formatting rules above."""

            # Save the prompt to a file
            filepath = self.save_prompt_to_file(process, [], prompt_content)
            print(f"Prompt saved to: {filepath}")
            return None

        # If runinLLM is True, create empty question records for LLM to fill
        # Note: We don't force a specific number of questions, letting the LLM generate unique ones
        questions = []
        try:
            # Generate a unique question ID
            question_id = self.generate_question_id(process_group, "DIRECT")
            
            # Create an empty question record to be filled by LLM
            record = {
                "id": question_id,
                "question_pmp": "",  # To be filled by LLM
                "options_pmp": {
                    "OPTION_A": "",  # To be filled by LLM
                    "OPTION_B": "",  # To be filled by LLM
                    "OPTION_C": "",  # To be filled by LLM
                    "OPTION_D": ""   # To be filled by LLM
                },
                "is_attempted": False,
                "selected_option": "",
                "question_type": "Option",
                "is_valid": "false",
                "analysis": {
                    "option_a_result": "",  # To be filled by LLM
                    "option_b_result": "",  # To be filled by LLM
                    "option_c_result": "",  # To be filled by LLM
                    "option_d_result": "",  # To be filled by LLM
                    "process_group": process_group,
                    "knowledge_area": "",  # To be filled by LLM
                    "tool": "",  # To be filled by LLM
                    "suggested_read": [],  # To be filled by LLM
                    "concepts_to_understand": "",  # To be filled by LLM
                    "additional_notes": ""  # Can be a link to full summary, or attached separately if too long
                }
            }
            
            questions.append(record)
        except Exception as e:
            print(f"Warning: Error creating question record: {str(e)}")
        
        return questions

    def generate_questions_from_scenarios(
        self, 
        scenario_input: str,
        process: str = "all",
        runinLLM: bool = False,
        num_of_questions: int = 20
    ) -> tuple[List[Dict[str, Any]], str]:
        """Generate questions directly without scenario dependency"""
        try:
            # Get process group from the scenario input filename
            process_group = "Initiating"  # Default to Initiating
            if scenario_input:
                file_prefix = os.path.splitext(os.path.basename(scenario_input))[0]
                for pg, info in self.process_groups.items():
                    if info["file_prefix"] == file_prefix:
                        process_group = pg
                        break
            
            # Generate questions directly
            questions = self.generate_question_from_scenario(
                [],  # Empty scenarios list since we're not using scenarios
                process_group,
                process,
                runinLLM,
                num_of_questions
            )
            
            return questions if questions else [], process_group
            
        except Exception as e:
            print(f"Warning: Error in question generation: {str(e)}")
            # Try to generate questions with default process group
            questions = self.generate_question_from_scenario(
                [],  # Empty scenarios list
                "Initiating",  # Default to Initiating
                process,
                runinLLM,
                num_of_questions
            )
            return questions if questions else [], "Initiating"

    def save_questions(self, questions: List[Dict[str, Any]], process_group: str, output_file: str = None):
        """Save questions to a TypeScript file, appending to existing questions and avoiding duplicates"""
        if not output_file:
            file_prefix = self.get_process_group_file_prefix(process_group)
            if process_group == "all":
                output_file = "src/questions/all.ts"
            else:
                output_file = f"src/questions/{file_prefix}.ts"
        
        # Create output directory if it doesn't exist
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        
        # Load existing questions if file exists
        existing_questions = []
        if os.path.exists(output_file):
            try:
                with open(output_file, 'r') as f:
                    content = f.read()
                    # Extract the JSON part from the TypeScript file
                    json_str = content.replace('export const questionsData = ', '').rstrip(';')
                    existing_data = json.loads(json_str)
                    existing_questions = existing_data.get('questions', [])
            except Exception as e:
                print(f"Warning: Could not load existing questions from {output_file}: {str(e)}")
                existing_questions = []
        
        # Create sets for duplicate checking
        existing_question_texts = {
            q.get('question_pmp', '').lower().strip()
            for q in existing_questions
        }
        existing_option_texts = {
            opt.lower().strip()
            for q in existing_questions
            for opt in q.get('options_pmp', {}).values()
        }
        
        # Filter out invalid and duplicate questions
        unique_new_questions = []
        duplicates_found = 0
        invalid_questions = 0
        
        for question in questions:
            # Skip if any required fields are missing
            if not all(key in question for key in ['question_pmp', 'options_pmp', 'analysis']):
                print(f"Warning: Skipping question {question.get('id', 'unknown')} - missing required fields")
                invalid_questions += 1
                continue
                
            # Get question and options text
            question_text = question.get('question_pmp', '').lower().strip()
            options = question.get('options_pmp', {})
            option_texts = [opt.lower().strip() for opt in options.values()]
            
            # Skip if question is empty or has less than 4 options
            if not question_text or len(options) != 4:
                print(f"Warning: Skipping question {question.get('id', 'unknown')} - invalid question or options")
                invalid_questions += 1
                continue
            
            # Skip if any option is empty
            if any(not opt for opt in option_texts):
                print(f"Warning: Skipping question {question.get('id', 'unknown')} - empty options")
                invalid_questions += 1
                continue
            
            # Skip if options are not unique within the question
            if len(set(option_texts)) != len(option_texts):
                print(f"Warning: Skipping question {question.get('id', 'unknown')} - duplicate options within question")
                invalid_questions += 1
                continue
            
            # Skip if any option is reused from existing questions
            if any(opt in existing_option_texts for opt in option_texts):
                print(f"Warning: Skipping question {question.get('id', 'unknown')} - options reused from existing questions")
                duplicates_found += 1
                continue
            
            # Check explanations
            analysis = question.get('analysis', {})
            option_results = [
                analysis.get('option_a_result', ''),
                analysis.get('option_b_result', ''),
                analysis.get('option_c_result', ''),
                analysis.get('option_d_result', '')
            ]
            
            # Skip if any explanation is missing or too short
            if any(not result or len(result.split()) < 10 for result in option_results):
                print(f"Warning: Skipping question {question.get('id', 'unknown')} - missing or insufficient explanations")
                invalid_questions += 1
                continue
            
            # Skip if explanations don't start with CORRECT/INCORRECT
            if not all(result.startswith(('CORRECT - ', 'INCORRECT - ')) for result in option_results):
                print(f"Warning: Skipping question {question.get('id', 'unknown')} - invalid explanation format")
                invalid_questions += 1
                continue
            
            # Skip if there isn't exactly one CORRECT explanation
            correct_count = sum(1 for result in option_results if result.startswith('CORRECT - '))
            if correct_count != 1:
                print(f"Warning: Skipping question {question.get('id', 'unknown')} - must have exactly one correct answer")
                invalid_questions += 1
                continue
            
            # Check if this question is similar to any existing question
            is_similar = False
            for existing_text in existing_question_texts:
                if self._calculate_similarity(question_text, existing_text) > 0.8:
                    is_similar = True
                    duplicates_found += 1
                    break
            
            if not is_similar:
                unique_new_questions.append(question)
                existing_question_texts.add(question_text)
                existing_option_texts.update(option_texts)
        
        # Combine existing and new questions
        all_questions = existing_questions + unique_new_questions
        
        # Create the content
        content = {
            "questions": all_questions
        }
        
        # Convert to TypeScript format
        ts_content = f"""export const questionsData = {json.dumps(content, indent=2)};"""
        
        # Save to file
        with open(output_file, 'w') as f:
            f.write(ts_content)
        
        print(f"\nQuestion Quality Report for {output_file}:")
        print(f"- Existing questions: {len(existing_questions)}")
        print(f"- New unique questions added: {len(unique_new_questions)}")
        print(f"- Duplicates/similar questions skipped: {duplicates_found}")
        print(f"- Invalid questions skipped: {invalid_questions}")
        print(f"- Total questions in file: {len(all_questions)}")
        if invalid_questions > 0:
            print("\nNote: Some questions were skipped due to:")
            print("  * Missing required fields")
            print("  * Empty or duplicate options")
            print("  * Missing or insufficient explanations")
            print("  * Invalid explanation format")
            print("  * Incorrect number of correct answers")
            print("  * Options reused from existing questions")

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts using a simple algorithm"""
        # Convert texts to sets of words
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        if union == 0:
            return 0.0
            
        return intersection / union

    def get_process_group_info(self, process_group: str) -> Dict[str, Any]:
        """Get information about a specific process group"""
        if process_group not in self.process_groups:
            raise ValueError(f"Invalid process group: {process_group}. Valid groups are: {', '.join(self.process_groups.keys())}")
        return self.process_groups[process_group]


def main():
    parser = argparse.ArgumentParser(description='Generate PMP questions from scenario files')
    parser.add_argument('scenario_file', nargs='?',
                      help='Scenario file name (e.g., "initiating.json" or "initiating") or full path to the file')
    parser.add_argument('--scenario', '-s',
                      help='Scenario file name (e.g., "initiating.json" or "initiating") or full path to the file (overrides positional argument)')
    parser.add_argument('--process-group', '-pg', 
                      choices=["all", "Initiating", "Planning", "Executing", "Monitoring and Controlling", "Closing"],
                      default="all",
                      help='PMP Process Group (default: all)')
    parser.add_argument('--process', '-p', default="all",
                      help='PMP process (e.g., "Define Activities", "Develop Schedule"). If not provided, defaults to "all".')
    parser.add_argument('--runinLLM', '-r', type=str, choices=['True', 'False', 'true', 'false'], default='False',
                      help='Whether to run the prompt in LLM (default: False). Use --runinLLM True or --runinLLM False')
    parser.add_argument('--num-questions', '-n', type=int, default=20,
                      help='Number of questions to generate (default: 20)')
    parser.add_argument('--output', '-o', 
                      help='Output file path (optional). If not provided, will save to src/questions/<process_group_prefix>.ts')
    parser.add_argument('--scenarios-dir', '-d',
                      help=f'Custom scenarios directory (default: {PMPQuestionGenerator.scenarios_dir})')
    
    args = parser.parse_args()
    
    # Convert runinLLM string to boolean
    runinLLM = args.runinLLM.lower() == 'true'
    
    # Override scenarios directory if provided
    if args.scenarios_dir:
        PMPQuestionGenerator.scenarios_dir = args.scenarios_dir
    
    # Use --scenario if provided, else fallback to positional
    scenario_file = args.scenario if args.scenario else args.scenario_file
    if not scenario_file:
        parser.error('A scenario file must be provided as a positional argument or with --scenario/-s')
    
    generator = PMPQuestionGenerator()
    
    try:
        # Generate questions from scenarios
        questions, process_group = generator.generate_questions_from_scenarios(
            scenario_file,
            args.process,
            runinLLM,
            args.num_questions
        )
        
        # Override process group if specified
        if args.process_group:
            process_group = args.process_group
        
        if not runinLLM:
            print(f"Prompts have been saved to {generator.prompts_dir}")
            return 0
            
        if not questions:
            print(f"No questions were generated from {scenario_file}")
            return 1
        
        # Save questions (only if runinLLM is True)
        generator.save_questions(questions, process_group, args.output)
        if process_group == "all":
            print(f"Generated questions for ALL process groups, saved to all.ts")
        else:
            print(f"Generated questions for {process_group} process group, saved to {generator.get_process_group_file_prefix(process_group)}.ts")
        return 0
        
    except ValueError as e:
        print(f"\nError: {e}")
        return 1

if __name__ == '__main__':
    exit(main()) 