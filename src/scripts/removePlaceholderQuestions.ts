import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Define the question type
interface Question {
  id: string;
  question_pmp: string;
  options_pmp: object;
  is_attempted: boolean;
  selected_option: string;
  question_type: string;
  analysis: object;
}

// Get the directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the initialLoad.ts file
const filePath = path.join(__dirname, '../questions/initialLoad.ts');
console.log('Reading file from:', filePath);

try {
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Regex to extract the questions array
  const match = content.match(/("questions"\s*:\s*\[)([\s\S]*?)(\n\s*\])/);
  if (!match) throw new Error('Could not find questions array in file');
  
  const prefix = match[1];
  const questionsBlock = match[2];
  const suffix = match[3];
  
  // Split into individual question objects (robust, handles nested braces)
  const questionObjects: string[] = [];
  let buffer = '';
  let depth = 0;
  let inObject = false;
  for (let i = 0; i < questionsBlock.length; i++) {
    const char = questionsBlock[i];
    if (char === '{') {
      if (!inObject) inObject = true;
      depth++;
    }
    if (inObject) buffer += char;
    if (char === '}') {
      depth--;
      if (depth === 0 && inObject) {
        questionObjects.push(buffer.trim());
        buffer = '';
        inObject = false;
      }
    }
  }
  
  // Filter out questions with placeholder pattern in question_pmp
  let removed = 0;
  const filteredObjects = questionObjects.filter(qStr => {
    const qMatch = qStr.match(/"question_pmp"\s*:\s*"([^"]*)"/);
    if (qMatch && /#\d+/.test(qMatch[1])) {
      removed++;
      return false;
    }
    return true;
  });
  
  console.log(`Removed ${removed} placeholder questions.`);
  console.log(`Remaining questions: ${filteredObjects.length}`);
  
  // Rebuild the questions array
  const newQuestionsBlock = filteredObjects.length > 0
    ? '\n        ' + filteredObjects.join(',\n        ') + '\n    '
    : '';
  const newContent = content.replace(/("questions"\s*:\s*\[)[\s\S]*?(\n\s*\])/, `${prefix}${newQuestionsBlock}${suffix}`);
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Successfully removed placeholder questions.');
} catch (error) {
  console.error('Error updating file:', error);
} 