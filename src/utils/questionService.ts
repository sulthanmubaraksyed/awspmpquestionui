import { QAResponseIndividual, RetrieveParams } from '../types';
import { config, buildApiUrl } from '../config';

export async function retrieveRecordsFromFile(params: RetrieveParams): Promise<QAResponseIndividual[]> {
  console.log('📞 QUESTION SERVICE: retrieveRecordsFromFile called with params:', params);
  
  // Build API URL using environment configuration
  const apiUrl = buildApiUrl(config.API_ENDPOINTS.QUESTIONS, {
    processGroup: params.processGroup || 'all',
    knowledgeArea: params.knowledgeArea || 'all',
    tool: params.tool || 'all',
    count: params.count || 250
  });
  
  // Parse the URL to show complete details
  const urlObj = new URL(apiUrl);
  
  console.log('🌐 COMPLETE SERVICE URL:', apiUrl);
  console.log('🌐 SERVICE BASE URL:', config.PMP_SERVICE_URL);
  console.log('🌐 SERVICE ENDPOINT:', config.API_ENDPOINTS.QUESTIONS);
  console.log('🌐 URL BREAKDOWN:', {
    protocol: urlObj.protocol,
    hostname: urlObj.hostname,
    port: urlObj.port,
    pathname: urlObj.pathname,
    search: urlObj.search,
    fullUrl: urlObj.href
  });
  console.log('🌐 QUERY PARAMETERS:', Object.fromEntries(urlObj.searchParams.entries()));
  console.log('🌐 SERVICE URL: Making HTTP request to:', apiUrl);
  console.log('🌐 SERVICE BASE URL:', config.PMP_SERVICE_URL);
  console.log('🔑 API KEY: Present:', !!config.DEFAULT_REQUEST_CONFIG.headers['X-API-Key']);
  console.log('📋 REQUEST DETAILS:', {
    method: 'GET',
    url: apiUrl,
    baseUrl: config.PMP_SERVICE_URL,
    headers: {
      ...config.DEFAULT_REQUEST_CONFIG.headers,
      'X-API-Key': config.DEFAULT_REQUEST_CONFIG.headers['X-API-Key'] ? '***' : 'Not Set'
    },
    params: params,
    queryParams: {
      processGroup: params.processGroup || 'all',
      knowledgeArea: params.knowledgeArea || 'all',
      tool: params.tool || 'all',
      count: params.count || 250
    }
  });
  
  // Make the actual HTTP request to the service
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: config.DEFAULT_REQUEST_CONFIG.headers,
  });
  
  console.log('📡 HTTP RESPONSE: Status:', response.status, response.statusText);
  console.log('📡 HTTP RESPONSE URL:', response.url);
  
  if (!response.ok) {
    const errorMessage = `Service error! HTTP ${response.status}: ${response.statusText}`;
    console.error('❌ SERVICE ERROR:', errorMessage);
    console.error('❌ SERVICE ERROR URL:', response.url);
    throw new Error(errorMessage);
  }
  
  const responseData = await response.json();
  console.log('📊 SERVICE RESPONSE: Raw response data:', responseData);
  console.log('📊 SERVICE RESPONSE URL:', response.url);
  
  // Handle different response formats
  let questions: any[];
  
  if (responseData.questions && Array.isArray(responseData.questions)) {
    // Response has a "questions" property containing the array
    questions = responseData.questions;
    console.log('📊 SERVICE RESPONSE: Found questions array in response.questions property');
  } else if (Array.isArray(responseData)) {
    // Response is directly an array
    questions = responseData;
    console.log('📊 SERVICE RESPONSE: Response is directly an array of questions');
  } else {
    const errorMessage = 'Invalid response format: expected array of questions or object with questions property';
    console.error('❌ SERVICE ERROR:', errorMessage);
    console.error('❌ SERVICE ERROR URL:', response.url);
    console.error('❌ SERVICE ERROR: Response structure:', responseData);
    throw new Error(errorMessage);
  }
  
  console.log('📊 SERVICE RESPONSE: Processing', questions.length, 'questions from API');
  
  // Clean up the questions to match expected format
  const cleanedQuestions = questions.map((question, index) => {
    console.log(`🔧 CLEANING QUESTION ${index + 1}:`, question.id || `question-${index}`);
    
    // Remove duplicate fields and ensure proper structure
    const cleanedQuestion: QAResponseIndividual = {
      id: question.id || `question-${index}`,
      question_pmp: question.question_pmp || '',
      options_pmp: {
        OPTION_A: question.options_pmp?.OPTION_A || question.OPTION_A || '',
        OPTION_B: question.options_pmp?.OPTION_B || question.OPTION_B || '',
        OPTION_C: question.options_pmp?.OPTION_C || question.OPTION_C || '',
        OPTION_D: question.options_pmp?.OPTION_D || question.OPTION_D || ''
      },
      is_attempted: question.is_attempted || false,
      selected_option: question.selected_option || '',
      question_type: question.question_type || 'Option',
      is_valid: question.is_valid !== undefined ? question.is_valid : true,
      process_group: question.process_group || question.analysis?.process_group || '',
      analysis: {
        option_a_result: question.analysis?.option_a_result || question.option_a_result || '',
        option_b_result: question.analysis?.option_b_result || question.option_b_result || '',
        option_c_result: question.analysis?.option_c_result || question.option_c_result || '',
        option_d_result: question.analysis?.option_d_result || question.option_d_result || '',
        process_group: question.analysis?.process_group || question.process_group || '',
        knowledge_area: question.analysis?.knowledge_area || question.knowledge_area || '',
        tool: question.analysis?.tool || question.tool || '',
        suggested_read: question.analysis?.suggested_read || question.suggested_read || [],
        concepts_to_understand: question.analysis?.concepts_to_understand || question.concepts_to_understand || '',
        additional_notes: question.analysis?.additional_notes || question.additional_notes || ''
      }
    };
    
    // Add optional fields if they exist
    if (question.did_user_get_it_right !== undefined) {
      cleanedQuestion.did_user_get_it_right = question.did_user_get_it_right;
    }
    
    console.log(`✅ CLEANED QUESTION ${index + 1}:`, cleanedQuestion.id);
    return cleanedQuestion;
  });
  
  console.log('✅ SERVICE SUCCESS: Successfully processed and cleaned', cleanedQuestions.length, 'questions');
  return cleanedQuestions;
}

export async function saveResponseToFile(response: QAResponseIndividual): Promise<void> {
  console.log('💾 SAVE SERVICE: saveResponseToFile called for response ID:', response.id);
  
  // Validate required fields
  if (!response.id) {
    throw new Error('Missing required field: id');
  }
  
  if (!response.process_group && !response.analysis?.process_group) {
    throw new Error('Missing required field: process_group (either at root level or in analysis)');
  }
  
  // Ensure all required fields are present and properly structured
  const completeResponse: QAResponseIndividual = {
    id: response.id,
    question_pmp: response.question_pmp || '',
    options_pmp: {
      OPTION_A: response.options_pmp?.OPTION_A || '',
      OPTION_B: response.options_pmp?.OPTION_B || '',
      OPTION_C: response.options_pmp?.OPTION_C || '',
      OPTION_D: response.options_pmp?.OPTION_D || ''
    },
    is_attempted: response.is_attempted !== undefined ? response.is_attempted : false,
    selected_option: response.selected_option || '',
    question_type: response.question_type || 'Option',
    is_valid: response.is_valid !== undefined ? response.is_valid : true,
    process_group: response.process_group || response.analysis?.process_group || '',
    analysis: {
      option_a_result: response.analysis?.option_a_result || '',
      option_b_result: response.analysis?.option_b_result || '',
      option_c_result: response.analysis?.option_c_result || '',
      option_d_result: response.analysis?.option_d_result || '',
      process_group: response.analysis?.process_group || response.process_group || '',
      knowledge_area: response.analysis?.knowledge_area || '',
      tool: response.analysis?.tool || '',
      suggested_read: Array.isArray(response.analysis?.suggested_read) 
        ? response.analysis.suggested_read 
        : response.analysis?.suggested_read 
          ? [response.analysis.suggested_read] 
          : [],
      concepts_to_understand: response.analysis?.concepts_to_understand || '',
      additional_notes: response.analysis?.additional_notes || ''
    }
  };
  
  // Add optional fields if they exist
  if (response.did_user_get_it_right !== undefined) {
    completeResponse.did_user_get_it_right = response.did_user_get_it_right;
  }
  
  console.log('📋 SAVE DATA: Complete response being sent to service:', {
    id: completeResponse.id,
    question_pmp: completeResponse.question_pmp?.substring(0, 100) + '...',
    is_attempted: completeResponse.is_attempted,
    selected_option: completeResponse.selected_option,
    question_type: completeResponse.question_type,
    is_valid: completeResponse.is_valid,
    process_group: completeResponse.process_group,
    analysis: {
      process_group: completeResponse.analysis.process_group,
      knowledge_area: completeResponse.analysis.knowledge_area,
      tool: completeResponse.analysis.tool,
      suggested_read_count: completeResponse.analysis.suggested_read.length,
      concepts_to_understand: completeResponse.analysis.concepts_to_understand?.substring(0, 50) + '...',
      additional_notes: completeResponse.analysis.additional_notes?.substring(0, 50) + '...'
    },
    did_user_get_it_right: completeResponse.did_user_get_it_right
  });
  
  // Build API URL using environment configuration
  const apiUrl = buildApiUrl(config.API_ENDPOINTS.SAVE_RESPONSE);
  
  console.log('🌐 SAVE URL: Making HTTP request to:', apiUrl);
  console.log('🌐 SAVE BASE URL:', config.PMP_SERVICE_URL);
  console.log('🔑 API KEY: Present:', !!config.DEFAULT_REQUEST_CONFIG.headers['X-API-Key']);
  console.log('📋 SAVE REQUEST DETAILS:', {
    method: 'POST',
    url: apiUrl,
    baseUrl: config.PMP_SERVICE_URL,
    headers: {
      ...config.DEFAULT_REQUEST_CONFIG.headers,
      'X-API-Key': config.DEFAULT_REQUEST_CONFIG.headers['X-API-Key'] ? '***' : 'Not Set'
    },
    bodySize: JSON.stringify(completeResponse).length + ' characters'
  });
  
  // Make the actual HTTP request to the service
  const saveResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      ...config.DEFAULT_REQUEST_CONFIG.headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(completeResponse)
  });
  
  console.log('📡 SAVE RESPONSE: Status:', saveResponse.status, saveResponse.statusText);
  
  if (!saveResponse.ok) {
    const errorText = await saveResponse.text();
    const errorMessage = `Save service error! HTTP ${saveResponse.status}: ${saveResponse.statusText}. Response: ${errorText}`;
    console.error('❌ SAVE ERROR:', errorMessage);
    throw new Error(errorMessage);
  }
  
  console.log('✅ SAVE SUCCESS: Response saved successfully to service');
} 