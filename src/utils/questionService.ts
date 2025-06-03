import { questionsData as inQuestions } from '../questions/in';
import { questionsData as plQuestions } from '../questions/pl';
import { questionsData as exQuestions } from '../questions/ex';
import { questionsData as mcQuestions } from '../questions/mc';
import { questionsData as clQuestions } from '../questions/cl';
import type { QAResponseIndividual, RetrieveParams, BaseQuestion } from '../types';

// Add electron types
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
      };
    };
  }
}

// Add type declarations for File System Access API
declare global {
  interface Window {
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
  
  interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }
  
  interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
  }
  
  interface FileSystemWritableFileStream extends WritableStream {
    write(data: string | BufferSource | Blob): Promise<void>;
    close(): Promise<void>;
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function retrieveRecordsFromFile({ 
  processGroup, 
  knowledgeArea, 
  tool, 
  count = 100 
}: RetrieveParams): Promise<QAResponseIndividual[]> {
  try {
    // Get questions from the appropriate file based on process group
    let questions: BaseQuestion[] = [];
    
    if (processGroup === 'all') {
      // If process group is 'all', get questions from all files
      const allQuestions = [
        ...(inQuestions.questions as BaseQuestion[]),
        ...(plQuestions.questions as BaseQuestion[]),
        ...(exQuestions.questions as BaseQuestion[]),
        ...(mcQuestions.questions as BaseQuestion[]),
        ...(clQuestions.questions as BaseQuestion[])
      ];
      questions = allQuestions;
    } else {
      // Get questions from specific process group file
      const fileMap: { [key: string]: any } = {
        'Initiating': inQuestions,
        'Planning': plQuestions,
        'Executing': exQuestions,
        'Monitoring and Controlling': mcQuestions,
        'Closing': clQuestions
      };
      
      const selectedFile = fileMap[processGroup];
      if (!selectedFile) {
        throw new Error(`Invalid process group: ${processGroup}`);
      }
      
      questions = selectedFile.questions as BaseQuestion[];
    }
    
    // Filter by knowledge area if specified
    if (knowledgeArea && knowledgeArea !== 'all') {
      questions = questions.filter(q => q.analysis.knowledge_area === knowledgeArea);
    }
    
    // Filter by tool if specified
    if (tool && tool !== 'all') {
      questions = questions.filter(q => q.analysis.tool === tool);
    }
    
    // Shuffle and limit the number of questions
    if (questions.length > count) {
      questions = shuffleArray(questions).slice(0, count);
    }
    
    // Transform questions to QAResponseIndividual format
    return questions.map(transformQuestion);
  } catch (error) {
    console.error('Error retrieving questions:', error);
    throw error;
  }
}

function transformQuestion(q: BaseQuestion): QAResponseIndividual {
  return {
    id: q.id,
    question_pmp: q.question_pmp,
    options_pmp: q.options_pmp,
    OPTION_A: q.options_pmp.OPTION_A,
    OPTION_B: q.options_pmp.OPTION_B,
    OPTION_C: q.options_pmp.OPTION_C,
    OPTION_D: q.options_pmp.OPTION_D,
    option_a_result: q.analysis.option_a_result,
    option_b_result: q.analysis.option_b_result,
    option_c_result: q.analysis.option_c_result,
    option_d_result: q.analysis.option_d_result,
    process_group: q.analysis.process_group,
    knowledge_area: q.analysis.knowledge_area,
    tool: q.analysis.tool,
    suggested_read: Array.isArray(q.analysis.suggested_read) 
      ? q.analysis.suggested_read.join(', ') 
      : q.analysis.suggested_read,
    concepts_to_understand: q.analysis.concepts_to_understand,
    is_attempted: false,
    question_type: 'Option',
    selected_option: '',
    analysis: q.analysis,
    is_verified: true,
    did_user_get_it_right: undefined
  };
}

export async function saveResponseToFile(questionResponse: QAResponseIndividual): Promise<void> {
  try {
    // Get the appropriate file based on process group
    const fileMap: { [key: string]: any } = {
      'Initiating': inQuestions,
      'Planning': plQuestions,
      'Executing': exQuestions,
      'Monitoring and Controlling': mcQuestions,
      'Closing': clQuestions
    };
    
    const selectedFile = fileMap[questionResponse.process_group];
    if (!selectedFile) {
      throw new Error(`Invalid process group: ${questionResponse.process_group}`);
    }
    
    // Find and update the question in the file
    const questionIndex = selectedFile.questions.findIndex((q: BaseQuestion) => q.id === questionResponse.id);
    if (questionIndex === -1) {
      throw new Error(`Question with ID ${questionResponse.id} not found`);
    }
    
    // Update the question with the new response
    selectedFile.questions[questionIndex] = {
      ...selectedFile.questions[questionIndex],
      is_attempted: questionResponse.is_attempted,
      selected_option: questionResponse.selected_option,
      did_user_get_it_right: questionResponse.did_user_get_it_right
    };
    
    // Save the updated file
    // Note: In a real application, you would want to save this to a file
    // For now, we'll just update the in-memory state
    console.log('Question updated:', selectedFile.questions[questionIndex]);
  } catch (error) {
    console.error('Error saving response:', error);
    throw error;
  }
}

// Export the interface
export type { QAResponseIndividual }; 