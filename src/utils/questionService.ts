import { API_CONFIG, getApiUrl } from '../config';
import type { QAResponseIndividual, RetrieveParams } from '../types/index';

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
    // Construct query parameters, only including non-empty values
    const params = new URLSearchParams();
    
    if (processGroup && processGroup !== 'all') {
      params.append('processGroup', processGroup);
    }
    
    if (knowledgeArea && knowledgeArea !== 'all') {
      params.append('knowledgeArea', knowledgeArea);
    }
    
    if (tool && tool !== 'all') {
      params.append('tool', tool);
    }
    
    if (count) {
      params.append('count', count.toString());
    }
    
    // Add is_valid = False parameter
    params.append('is_valid', 'false');

    // Make API request with constructed parameters and API key
    const url = getApiUrl(`${API_CONFIG.endpoints.questions}${params.toString() ? `?${params.toString()}` : ''}`);
    console.log('API Request Details:');
    console.log('URL:', url);
    console.log('Headers:', {
      'X-API-Key': API_CONFIG.apiKey ? '***' : 'Not Set',
      'Content-Type': 'application/json'
    });
    console.log('Parameters:', Object.fromEntries(params.entries()));
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Get the response text first to check if it's valid JSON
    const responseText = await response.text();
    console.log('API Response Text (first 500 chars):', responseText.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      console.error('Response text:', responseText);
      throw new Error(`Invalid JSON response from API. Response may be HTML or malformed JSON. Status: ${response.status}`);
    }
    
    console.log('API Response Data:', {
      totalQuestions: data.questions?.length || 0,
      firstQuestion: data.questions?.[0] ? {
        id: data.questions[0].id,
        question_pmp: data.questions[0].question_pmp?.substring(0, 50) + '...',
        process_group: data.questions[0].process_group,
        knowledge_area: data.questions[0].knowledge_area,
        tool: data.questions[0].tool
      } : null
    });
    
    // Return the questions array from the response
    return data.questions || [];
  } catch (error) {
    console.error('Error retrieving questions:', error);
    throw error;
  }
}

export async function saveResponseToFile(questionResponse: QAResponseIndividual): Promise<void> {
  console.log('=== saveResponseToFile Service Call Started ===');
  console.log('Question Response to save:', {
    id: questionResponse.id,
    question_pmp: questionResponse.question_pmp?.substring(0, 50) + '...',
    is_valid: questionResponse.is_valid,
    selected_option: questionResponse.selected_option,
    is_attempted: questionResponse.is_attempted,
    did_user_get_it_right: questionResponse.did_user_get_it_right,
    process_group: questionResponse.analysis?.process_group,
    knowledge_area: questionResponse.analysis?.knowledge_area,
    tool: questionResponse.analysis?.tool,
    additional_notes: questionResponse.analysis?.additional_notes
  });
  
  try {
    const url = getApiUrl('/api/saveRecord');
    console.log('API Request Details:');
    console.log('URL:', url);
    console.log('Method:', 'POST');
    console.log('Headers:', {
      'X-API-Key': API_CONFIG.apiKey ? '***' : 'Not Set',
      'Content-Type': 'application/json'
    });
    console.log('Request Body (full):', JSON.stringify(questionResponse, null, 2));
    console.log('Request Body (summary):', {
      id: questionResponse.id,
      question_pmp: questionResponse.question_pmp?.substring(0, 50) + '...',
      selected_option: questionResponse.selected_option,
      is_attempted: questionResponse.is_attempted,
      did_user_get_it_right: questionResponse.did_user_get_it_right,
      additional_notes: questionResponse.analysis?.additional_notes
    });

    console.log('Making fetch request...');
    // Make API request to save the response with API key
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-Key': API_CONFIG.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionResponse),
    });

    console.log('Fetch request completed');
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to save response: ${response.status}`);
    }

    console.log('✅ Response OK, reading response body...');
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    console.log('✅ Question updated successfully in backend');
    console.log('=== saveResponseToFile Service Call Completed Successfully ===');
  } catch (error) {
    console.error('❌ Error in saveResponseToFile:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('=== saveResponseToFile Service Call Failed ===');
    throw error;
  }
}

// Export the interface
export type { QAResponseIndividual }; 