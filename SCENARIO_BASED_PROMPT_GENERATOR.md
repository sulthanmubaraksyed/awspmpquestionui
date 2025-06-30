# Scenario-Based PMP Question Generator

## Overview
A new prompt generator (`inpromptwithScenario.py`) has been created that generates PMP questions based on scenarios provided in a text file. This tool reads scenarios from a file and creates questions that build upon the provided scenarios with slight variations.

## Features

### PMPScenarioQuestionGenerator Class
- **Location**: `src/prompts/inpromptwithScenario.py`
- **Purpose**: Generates PMP questions based on scenarios from a text file
- **Key Feature**: One question generated per scenario provided

### Key Features
1. **Scenario File Input**: Reads scenarios from a specified text file
2. **One-to-One Mapping**: Generates exactly one question per scenario
3. **Scenario Variation**: Builds upon scenarios with slight changes to actors, domains, and contexts
4. **Same Output Format**: Uses the same JSON output format as `imPromptWithDifficulty.py`
5. **Difficulty Distribution**: Maintains 90% difficult, 5% medium, 5% easy distribution
6. **Process Group Support**: Works with all PMP process groups

### Technical Implementation

#### Command Line Usage
```bash
python inpromptwithScenario.py --scenario-file scenario.txt
```

#### Required Parameters
- `--scenario-file` or `-s`: Path to scenario text file (required)

#### Optional Parameters
- `--runinLLM` or `-r`: Whether to run in LLM (default: False)
- `--output` or `-o`: Output file path (optional)

#### Default Values
- **Process Group**: "Planning" (default)
- **Process**: "all" (default)
- **Number of Questions**: Automatically determined by number of scenarios in file

#### Scenario File Format
Scenarios should be separated by `---` (three dashes) on their own line:

```
Scenario 1 content here...

---

Scenario 2 content here...

---

Scenario 3 content here...
```

### Example Scenario File
```
A project manager is working on a software development project for a healthcare company. The project involves developing a patient management system that needs to be HIPAA compliant. During the planning phase, the project manager realizes that the requirements are not clearly defined and stakeholders have conflicting expectations about the system's functionality.

---

A construction project manager is overseeing the building of a new office complex. The project is behind schedule due to weather delays and material shortages. The client is concerned about the timeline and has requested a detailed analysis of the current project status and potential recovery options.

---

An IT project manager is leading a team developing a new e-commerce platform. The team has identified several technical risks during the risk assessment process, including potential security vulnerabilities and scalability issues. The project manager needs to determine the appropriate risk response strategies.
```

### Key Differences from imPromptWithDifficulty.py

1. **Input Source**: 
   - `imPromptWithDifficulty.py`: Generates questions based on process/process group
   - `inpromptwithScenario.py`: Generates questions based on provided scenarios

2. **Question Count**:
   - `imPromptWithDifficulty.py`: User specifies number of questions
   - `inpromptwithScenario.py`: Number of questions equals number of scenarios

3. **Scenario Handling**:
   - `imPromptWithDifficulty.py`: Creates scenarios from scratch
   - `inpromptwithScenario.py`: Builds upon provided scenarios with variations

4. **File Requirements**:
   - `imPromptWithDifficulty.py`: No external files needed
   - `inpromptwithScenario.py`: Requires scenario.txt file

5. **Parameter Requirements**:
   - `imPromptWithDifficulty.py`: Requires --process-group, --process, --num-questions
   - `inpromptwithScenario.py`: Only requires --scenario-file (uses defaults for others)

### Output Format
The output maintains the same JSON format as the original generator:

```json
{
  "is_sample": false,
  "questions": [
    {
      "id": "[unique_id]",
      "question_pmp": "Question text based on scenario...",
      "options_pmp": {
        "OPTION_A": "Option A text",
        "OPTION_B": "Option B text",
        "OPTION_C": "Option C text",
        "OPTION_D": "Option D text"
      },
      "is_attempted": false,
      "selected_option": "",
      "question_type": "Option",
      "is_valid": false,
      "analysis": {
        "option_a_result": "CORRECT/INCORRECT - explanation",
        "option_b_result": "CORRECT/INCORRECT - explanation",
        "option_c_result": "CORRECT/INCORRECT - explanation",
        "option_d_result": "CORRECT/INCORRECT - explanation",
        "process_group": "Planning",
        "knowledge_area": "Scope",
        "tool": "[Tool]",
        "suggested_read": ["...", "..."],
        "concepts_to_understand": "...",
        "additional_notes": "...",
        "difficulty_level": "difficult/medium/easy"
      }
    }
  ]
}
```

### Usage Workflow

1. **Create Scenario File**: Prepare a text file with scenarios separated by `---`
2. **Run Generator**: Execute the script with appropriate parameters
3. **Review Prompt**: Check the generated prompt file in `src/prompts/saved/` (filename format: `prompt_Scenario_<timestamp>.txt`)
4. **Use with LLM**: Copy the prompt content to your LLM for question generation
5. **Save Results**: The LLM will generate questions in the specified JSON format

### Benefits

1. **Consistent Base**: All questions are based on real-world scenarios
2. **Variation Control**: Maintains scenario essence while adding variety
3. **Scalable**: Easy to add new scenarios by updating the text file
4. **Flexible**: Works with any PMP process or process group
5. **Quality Assurance**: Ensures questions are grounded in practical scenarios

### Error Handling

- **File Not Found**: Clear error message if scenario file doesn't exist
- **Empty File**: Handles cases where no scenarios are found
- **Invalid Format**: Graceful handling of malformed scenario files
- **Process Validation**: Validates process group and process parameters

## Technical Notes

- The generator reads scenarios line by line and splits on `---` delimiters
- Each scenario is numbered and included in the prompt
- The LLM is instructed to build upon scenarios rather than use them exactly
- All existing PMP question generation features are preserved
- The same difficulty distribution and question style requirements apply 