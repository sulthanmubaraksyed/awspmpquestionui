import * as fs from 'fs';

// Helper to parse the input file
function parseQuestions(input: string) {
  const questions: any[] = [];
  const questionBlocks = input.split(/\n(?=Question \d+)/g);
  for (const block of questionBlocks) {
    if (!block.trim()) continue;
    const lines = block.split('\n');
    const questionLine = lines[0].trim();
    const questionMatch = questionLine.match(/^Question (\d+)/);
    if (!questionMatch) continue;
    const questionNumber = questionMatch[1];
    // Find the question text
    let questionText = '';
    let i = 1;
    while (i < lines.length && !lines[i].startsWith('Options:')) {
      questionText += lines[i] + '\n';
      i++;
    }
    questionText = questionText.trim();
    // Parse options
    const options: { [key: string]: string } = {};
    if (lines[i].startsWith('Options:')) i++;
    while (i < lines.length && lines[i].match(/^[A-D]\. /)) {
      const opt = lines[i].match(/^([A-D])\. (.*)/);
      if (opt) options[opt[1]] = opt[2];
      i++;
    }
    // Find correct answer
    let correctAnswer = '';
    while (i < lines.length && !lines[i].startsWith('Correct Answer:')) i++;
    if (i < lines.length && lines[i].startsWith('Correct Answer:')) {
      correctAnswer = lines[i].replace('Correct Answer:', '').trim();
    }
    // Find explanations for each option
    const explanations: { [key: string]: string } = {};
    while (i < lines.length && !lines[i].startsWith('Explanation for each option:')) i++;
    if (i < lines.length && lines[i].startsWith('Explanation for each option:')) i++;
    while (i < lines.length && lines[i].startsWith('Option')) {
      const optExp = lines[i].match(/^Option ([A-D]): (CORRECT|INCORRECT) - (.*)/);
      if (optExp) {
        const key = optExp[1];
        let exp = optExp[3];
        i++;
        // Multi-line explanation
        while (i < lines.length && lines[i] && !lines[i].startsWith('Option') && !lines[i].startsWith('Process Group:')) {
          exp += ' ' + lines[i].trim();
          i++;
        }
        explanations[key] = exp.trim();
      } else {
        i++;
      }
    }
    // Find process group, knowledge area, tool, difficulty, suggested reading, concepts, notes
    let processGroup = '', knowledgeArea = '', tool = '', difficulty = '', suggestedReading = '', concepts = '', notes = '';
    while (i < lines.length) {
      if (lines[i].startsWith('Process Group:')) processGroup = lines[i].replace('Process Group:', '').trim();
      else if (lines[i].startsWith('Knowledge Area:')) knowledgeArea = lines[i].replace('Knowledge Area:', '').trim();
      else if (lines[i].startsWith('Tool:')) tool = lines[i].replace('Tool:', '').trim();
      else if (lines[i].startsWith('Difficulty Level:')) difficulty = lines[i].replace('Difficulty Level:', '').trim();
      else if (lines[i].startsWith('Suggested Reading:')) {
        i++;
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('Concepts to Understand:')) {
          suggestedReading += lines[i].trim() + ' ';
          i++;
        }
        suggestedReading = suggestedReading.trim();
        continue;
      } else if (lines[i].startsWith('Concepts to Understand:')) {
        i++;
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('Additional Notes:')) {
          concepts += lines[i].trim() + ' ';
          i++;
        }
        concepts = concepts.trim();
        continue;
      } else if (lines[i].startsWith('Additional Notes:')) {
        i++;
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('Question')) {
          notes += lines[i].trim() + ' ';
          i++;
        }
        notes = notes.trim();
        continue;
      }
      i++;
    }
    questions.push({
      questionNumber,
      question: questionText,
      options,
      correctAnswer,
      explanations,
      processGroup,
      knowledgeArea,
      tool,
      difficulty,
      suggestedReading,
      concepts,
      notes
    });
  }
  return questions;
}

const input = fs.readFileSync('input_claudia.txt', 'utf-8');
const questions = parseQuestions(input);

const output = `export const output_question_fomatted = ${JSON.stringify(questions, null, 2)};\n`;
fs.writeFileSync('output_question_fomatted.ts', output);
console.log('✅ output_question_fomatted.ts has been created.'); 