import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { QAResponseIndividual } from '../types/index';

// Get the directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const tempLoadPath = path.join(__dirname, '../tempload.ts');
const initialLoadPath = path.join(__dirname, '../questions/initialLoad.ts');

console.log('Script started');
console.log('File paths:');
console.log('- tempload.ts:', tempLoadPath);
console.log('- initialLoad.ts:', initialLoadPath);

// Validation function for a single question
function validateQuestion(question: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  const requiredFields = [
    'id', 'question_pmp', 'options_pmp', 'analysis',
    'process_group', 'knowledge_area', 'tool',
    'option_a_result', 'option_b_result', 'option_c_result', 'option_d_result',
    'suggested_read', 'concepts_to_understand'
  ];

  for (const field of requiredFields) {
    if (!question[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate options_pmp structure
  if (question.options_pmp) {
    const requiredOptions = ['OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D'];
    for (const option of requiredOptions) {
      if (!question.options_pmp[option]) {
        errors.push(`Missing required option: ${option}`);
      }
    }
  }

  // Validate analysis structure
  if (question.analysis) {
    const requiredAnalysis = [
      'option_a_result', 'option_b_result', 'option_c_result', 'option_d_result',
      'process_group', 'knowledge_area', 'tool', 'suggested_read', 'concepts_to_understand'
    ];
    for (const field of requiredAnalysis) {
      if (!question.analysis[field]) {
        errors.push(`Missing required analysis field: ${field}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Add backup functionality before processing
async function backupFile(filePath: string) {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  console.log(`Creating backup at ${backupPath}`);
  fs.copyFileSync(filePath, backupPath);
}

// Modify the processQuestionsInBatches function
async function processQuestionsInBatches(batchSize: number = 50) {
  try {
    console.log('Reading files...');
    
    // Check if files exist
    if (!fs.existsSync(tempLoadPath)) {
      throw new Error(`tempload.ts does not exist at ${tempLoadPath}`);
    }
    if (!fs.existsSync(initialLoadPath)) {
      throw new Error(`initialLoad.ts does not exist at ${initialLoadPath}`);
    }

    // Create backups
    await backupFile(tempLoadPath);
    await backupFile(initialLoadPath);

    // Read both files
    console.log('Reading tempload.ts...');
    const tempLoadContent = fs.readFileSync(tempLoadPath, 'utf8');
    console.log('Reading initialLoad.ts...');
    const initialLoadContent = fs.readFileSync(initialLoadPath, 'utf8');

    console.log('Extracting questions from files...');
    
    // Extract questions from tempLoad.ts
    let tempQuestions: any[] = [];
    // Find the start of the object, accounting for export const questionsData =
    const exportMatch = tempLoadContent.match(/export\s+const\s+questionsData\s*=\s*({[\s\S]*?});/);
    if (exportMatch) {
      const jsonString = exportMatch[1];
      try {
        const tempObj = JSON.parse(jsonString);
        if (Array.isArray(tempObj.questions)) {
          tempQuestions = tempObj.questions;
        } else {
          throw new Error('questionsData in tempload.ts does not have a questions array');
        }
      } catch (e) {
        console.error('Failed to parse questionsData object from tempload.ts:', e);
        throw e;
      }
      } else {
        console.error('Content of tempload.ts:', tempLoadContent.substring(0, 500) + '...');
      throw new Error('Could not find questionsData export in tempload.ts');
    }
    console.log(`Found ${tempQuestions.length} questions in tempload.ts`);

    // Extract questions from initialLoad.ts - more flexible parsing
    let initialQuestions: any[] = [];
    try {
      // Try object format first
      const objStartIdx = initialLoadContent.indexOf('{');
      const objEndIdx = initialLoadContent.lastIndexOf('}');
      if (objStartIdx !== -1 && objEndIdx !== -1 && objStartIdx < objEndIdx) {
        const jsonString = initialLoadContent.substring(objStartIdx, objEndIdx + 1);
        try {
          const obj = JSON.parse(jsonString);
          if (Array.isArray(obj.questions)) {
            initialQuestions = obj.questions;
          }
        } catch (e) {
          console.log('Failed to parse as object format, trying array format...');
        }
      }
      
      // If object format failed, try array format
      if (initialQuestions.length === 0) {
        const arrayMatch = initialLoadContent.match(/export const questionsData = (\[[\s\S]*?\]);/);
        if (arrayMatch) {
          initialQuestions = JSON.parse(arrayMatch[1]);
        } else {
          // If both formats fail, start with empty array
          console.log('No existing questions found in initialLoad.ts, starting fresh');
          initialQuestions = [];
        }
      }
    } catch (e) {
      console.log('Error parsing initialLoad.ts, starting with empty array:', e);
      initialQuestions = [];
    }
    console.log(`Found ${initialQuestions.length} existing questions in initialLoad.ts`);

    // Process questions in batches
    const validQuestions: QAResponseIndividual[] = [];
    const invalidQuestions: { question: any; errors: string[] }[] = [];
    let processedCount = 0;

    for (let i = 0; i < tempQuestions.length; i += batchSize) {
      const batch = tempQuestions.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${i / batchSize + 1} (${batch.length} questions)`);

      for (const question of batch) {
        try {
          const validation = validateQuestion(question);
          if (validation.isValid) {
            // Transform to QAResponseIndividual format
            const transformedQuestion: QAResponseIndividual = {
              id: question.id,
              question_pmp: question.question_pmp,
              options_pmp: question.options_pmp,
              is_attempted: false,
              selected_option: '',
              question_type: "Option",
              is_valid: false,
              analysis: {
                option_a_result: question.analysis.option_a_result,
                option_b_result: question.analysis.option_b_result,
                option_c_result: question.analysis.option_c_result,
                option_d_result: question.analysis.option_d_result,
                process_group: question.analysis.process_group,
                knowledge_area: question.analysis.knowledge_area,
                tool: question.analysis.tool,
                suggested_read: Array.isArray(question.analysis.suggested_read) ? 
                  question.analysis.suggested_read : 
                  [question.analysis.suggested_read],
                concepts_to_understand: question.analysis.concepts_to_understand,
                additional_notes: question.analysis.additional_notes
              },
              did_user_get_it_right: undefined
            };
            validQuestions.push(transformedQuestion);
          } else {
            console.log(`Skipping invalid question ${question.id}:`, validation.errors);
            invalidQuestions.push({ question, errors: validation.errors });
          }
        } catch (error) {
          console.error('Error processing question:', error);
          console.error('Question data:', JSON.stringify(question, null, 2));
          invalidQuestions.push({ 
            question, 
            errors: [`Error processing question: ${error instanceof Error ? error.message : String(error)}`] 
          });
        }
        processedCount++;
      }

      console.log('Updating files...');
      
      // Update initialLoad.ts with new valid questions
      const updatedQuestions = [...initialQuestions, ...validQuestions];
      const updatedContent = `export const questionsData = {\n  "questions": ${JSON.stringify(updatedQuestions, null, 2)}\n};`;
      fs.writeFileSync(initialLoadPath, updatedContent, 'utf8');

      // Update tempload.ts by removing processed questions
      const remainingQuestions = tempQuestions.slice(processedCount);
      const updatedTempContent = `export const questionsData = {\n  "questions": ${JSON.stringify(remainingQuestions, null, 2)}\n};`;
      fs.writeFileSync(tempLoadPath, updatedTempContent, 'utf8');

      console.log(`Batch ${i / batchSize + 1} completed:`);
      console.log(`- Valid questions added: ${validQuestions.length}`);
      console.log(`- Invalid questions skipped: ${invalidQuestions.length}`);
      console.log(`- Total processed: ${processedCount}`);
      console.log(`- Remaining questions: ${remainingQuestions.length}`);

      // Clear arrays for next batch
      validQuestions.length = 0;
      invalidQuestions.length = 0;
    }

    console.log('\nProcess completed successfully!');
    console.log('A backup of both files was created before processing.');

  } catch (error) {
    console.error('Error in processQuestionsInBatches:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

// Run the script
console.log('Starting script execution...');
processQuestionsInBatches(50).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 