import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the initialLoad.ts file
const filePath = path.join(__dirname, '../questions/initialLoad.ts');
console.log('Reading file from:', filePath);

try {
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Add question_type to each question object
  const updatedContent = content.replace(
    /(\{\s*id:\s*"[^"]+",\s*question_pmp:\s*"[^"]+",\s*options_pmp:\s*\{[^}]+\},\s*analysis:\s*\{[^}]+\})/g,
    '$1,\n    question_type: "Option"'
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log('Successfully added question_type field to all questions');
} catch (error) {
  console.error('Error updating file:', error);
} 