import { API_CONFIG } from '../config/api.config';
import { questionsData as inQuestions } from '../questions/in';
import { questionsData as plQuestions } from '../questions/pl';
import { questionsData as exQuestions } from '../questions/ex';
import { questionsData as mcQuestions } from '../questions/mc';
import { questionsData as clQuestions } from '../questions/cl';

export interface QAResponseIndividual {
  id: string;
  question_pmp: string;
  options_pmp?: {
    OPTION_A: string;
    OPTION_B: string;
    OPTION_C: string;
    OPTION_D: string;
  };
  OPTION_A: string;
  OPTION_B: string;
  OPTION_C: string;
  OPTION_D: string;
  option_a_result: string;
  option_b_result: string;
  option_c_result: string;
  option_d_result: string;
  process_group: string;
  knowledge_area: string;
  tool: string;
  suggested_read: string;
  concepts_to_understand: string;
  is_attempted: boolean;
  whatuserselected?: string;
  did_user_get_it_right?: boolean;
  selected_option?: string;
  question_type: string;
  analysis?: {
    option_a_result: string;
    option_b_result: string;
    option_c_result: string;
    option_d_result: string;
    process_group: string;
    knowledge_area: string;
    tool: string;
    suggested_read: string | string[];
    concepts_to_understand: string;
    additional_notes?: string;
  };
}

export async function getQuestionsAndAnswersinBatch(
  input_batch: number = 3,
  process_group: string = 'ALL',
  knowledge_area: string = 'ALL',
  tool: string = 'ALL'
): Promise<QAResponseIndividual[]> {
  const queryParams = new URLSearchParams({
    input_batch: input_batch.toString(),
    process_group,
    knowledge_area,
    tool
  });
  const url = `${API_CONFIG.PMP_SERVICE_URL}${API_CONFIG.ENDPOINTS.GET_QUESTIONS_AND_ANSWERS}?${queryParams}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: API_CONFIG.HEADERS
  });
  if (!response.ok) {
    throw new ApiError(`API request failed with status ${response.status}`, response.status);
  }
  const responseData = await response.json();
  if (!responseData.success || !responseData.data || !Array.isArray(responseData.data.questions)) {
    throw new ApiError('Invalid response format: Missing required structure');
  }
  // Parse each item in the questions array
  return responseData.data.questions.map((item: any) => ({
    id: item.id,
    question_pmp: item.question_pmp,
    OPTION_A: item.options_pmp.OPTION_A,
    OPTION_B: item.options_pmp.OPTION_B,
    OPTION_C: item.options_pmp.OPTION_C,
    OPTION_D: item.options_pmp.OPTION_D,
    option_a_result: item.analysis.option_a_result,
    option_b_result: item.analysis.option_b_result,
    option_c_result: item.analysis.option_c_result,
    option_d_result: item.analysis.option_d_result,
    process_group: item.analysis.process_group,
    knowledge_area: item.analysis.knowledge_area,
    tool: item.analysis.tool,
    suggested_read: Array.isArray(item.analysis.suggested_read) ? item.analysis.suggested_read.join('; ') : item.analysis.suggested_read,
    concepts_to_understand: item.analysis.concepts_to_understand,
    is_attempted: false,
    whatuserselected: item.analysis.whatuserselected,
    question_type: "Option"
  }));
}

export interface QuestionParams {
    process_group: string;
    knowledge_area: string;
    tool: string;
}

export interface QuestionResponse {
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
}

export interface SubmitQuestionParams {
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    selected_option: string;
}

export interface SubmitQuestionResponse {
    success: boolean;
    is_correct: boolean;
    explanation: string;
    correct_answer: string;
    validation_result?: {
        submission_result: string;
        option_a_result: string;
        option_b_result: string;
        option_c_result: string;
        option_d_result: string;
        process_group: string;
        knowledge_area: string;
        tool: string;
    };
}

export class ApiError extends Error {
    constructor(message: string, public status?: number) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function fetchQuestion(params: QuestionParams): Promise<QuestionResponse> {
    try {
        const queryParams = new URLSearchParams({
            process_group: params.process_group,
            knowledge_area: params.knowledge_area,
            tool: params.tool
        });

        const url = `${API_CONFIG.PMP_SERVICE_URL}${API_CONFIG.ENDPOINTS.GET_QUESTION}?${queryParams}`;
        
        console.log('Making API request to:', url);
        console.log('With headers:', API_CONFIG.HEADERS);

        const response = await fetch(url, {
            method: 'GET',
            headers: API_CONFIG.HEADERS
        });

        if (!response.ok) {
            console.error('API request failed with status:', response.status);
            console.error('Response status text:', response.statusText);
            throw new ApiError(`API request failed with status ${response.status}`, response.status);
        }

        const responseData = await response.json();
        console.log('Raw API Response:', responseData);

        // Check if the response has the expected structure
        if (!responseData.success || !responseData.data || !responseData.data.parsed_question) {
            throw new ApiError('Invalid response format: Missing required structure');
        }

        const parsedQuestion = responseData.data.parsed_question;
        
        // Log the parsed values
        console.log('Parsed Question Values:');
        console.log('Question:', parsedQuestion.Question);
        console.log('Option A:', parsedQuestion.OPTION_A);
        console.log('Option B:', parsedQuestion.OPTION_B);
        console.log('Option C:', parsedQuestion.OPTION_C);
        console.log('Option D:', parsedQuestion.OPTION_D);

        // Validate all required fields are present
        const requiredFields = ['Question', 'OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D'];
        const missingFields = requiredFields.filter(field => !(field in parsedQuestion));

        if (missingFields.length > 0) {
            console.error('Missing fields in parsed_question:', missingFields);
            throw new ApiError(`Missing required fields in parsed_question: ${missingFields.join(', ')}`);
        }

        // Return the formatted response
        return {
            question: parsedQuestion.Question,
            option_a: parsedQuestion.OPTION_A,
            option_b: parsedQuestion.OPTION_B,
            option_c: parsedQuestion.OPTION_C,
            option_d: parsedQuestion.OPTION_D
        };
    } catch (error) {
        console.error('Error in fetchQuestion:', error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
}

export async function submitQuestion(params: SubmitQuestionParams): Promise<SubmitQuestionResponse> {
    try {
        const url = `${API_CONFIG.PMP_SERVICE_URL}${API_CONFIG.ENDPOINTS.VALIDATE_RESPONSE}`;
        
        // Create the payload with all options
        const payload = {
            question: params.question,
            option_a: params.option_a,
            option_b: params.option_b,
            option_c: params.option_c,
            option_d: params.option_d,
            selected_option: params.selected_option
        };
        
        console.log('Making POST request to:', url);
        console.log('Request payload:', JSON.stringify(payload, null, 2));
        console.log('With headers:', API_CONFIG.HEADERS);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...API_CONFIG.HEADERS,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('API request failed with status:', response.status);
            console.error('Response status text:', response.statusText);
            throw new ApiError(`API request failed with status ${response.status}`, response.status);
        }

        const responseData = await response.json();
        console.log('Submit Question Response:', JSON.stringify(responseData, null, 2));

        // Check if the response has the expected structure
        if (!responseData.success || !responseData.data || !responseData.data.validation_result) {
            throw new ApiError('Invalid response format: Missing required structure');
        }

        const validationResult = responseData.data.validation_result;
        
        // Determine if the answer is correct by checking if submission_result starts with "CORRECT"
        const isCorrect = validationResult.submission_result.startsWith('CORRECT');
        
        // Find the correct answer by looking for the option that starts with "CORRECT"
        let correctAnswer = '';
        if (validationResult.option_a_result.startsWith('CORRECT')) correctAnswer = 'A';
        else if (validationResult.option_b_result.startsWith('CORRECT')) correctAnswer = 'B';
        else if (validationResult.option_c_result.startsWith('CORRECT')) correctAnswer = 'C';
        else if (validationResult.option_d_result.startsWith('CORRECT')) correctAnswer = 'D';

        return {
            success: responseData.success,
            is_correct: isCorrect,
            explanation: validationResult.submission_result,
            correct_answer: correctAnswer,
            validation_result: validationResult
        };
    } catch (error) {
        console.error('Error in submitQuestion:', error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
}

export interface RetrieveParams {
  processGroup: string;
  knowledgeArea: string;
  tool: string;
  count?: number;
}

// PMP Process Group Distribution
const PROCESS_GROUP_DISTRIBUTION = {
  "Initiating": 0.13,    // 13%
  "Planning": 0.24,      // 24%
  "Executing": 0.31,     // 31%
  "Monitoring and Controlling": 0.25,  // 25%
  "Closing": 0.07        // 7%
};

// Define the base question type that all files will use
interface BaseQuestion {
  id: string;
  question_pmp: string;
  options_pmp: {
    OPTION_A: string;
    OPTION_B: string;
    OPTION_C: string;
    OPTION_D: string;
  };
  analysis: {
    option_a_result: string;
    option_b_result: string;
    option_c_result: string;
    option_d_result: string;
    process_group: string;
    knowledge_area: string;
    tool: string;
    suggested_read: string | string[];
    concepts_to_understand: string;
    additional_notes?: string;
  };
}

// Define the questions data type for each file
interface QuestionsData {
  questions: BaseQuestion[];
}

// Process group to file mapping with correct types
const PROCESS_GROUP_FILES: Record<string, QuestionsData> = {
  "Initiating": inQuestions,
  "Planning": plQuestions,
  "Executing": exQuestions,
  "Monitoring and Controlling": mcQuestions,
  "Closing": clQuestions
} as const;

export async function retrieveRecordsFromFile({ 
  processGroup, 
  knowledgeArea, 
  tool, 
  count = 100 
}: RetrieveParams): Promise<QAResponseIndividual[]> {
  try {
    // Get questions from all files in parallel
    const allQuestions = await Promise.all(
      Object.entries(PROCESS_GROUP_FILES).map(async ([group, questions]) => {
        let groupQuestions = (questions.questions as BaseQuestion[]);
        
        // Filter by knowledge area if specified
        if (knowledgeArea && knowledgeArea !== 'all') {
          groupQuestions = groupQuestions.filter(q => q.analysis.knowledge_area === knowledgeArea);
        }
        
        return {
          group,
          questions: groupQuestions
        };
      })
    );

    // Calculate target count for each process group based on distribution
    const targetCounts = Object.entries(PROCESS_GROUP_DISTRIBUTION).map(([group, percentage]) => ({
      group,
      targetCount: Math.round(count * percentage)
    }));

    // Distribute questions according to PMP percentages
    let distributedQuestions: QAResponseIndividual[] = [];
    let remainingQuestions: QAResponseIndividual[] = [];

    // First pass: Try to get exact distribution
    for (const { group, targetCount } of targetCounts) {
      const groupData = allQuestions.find(q => q.group === group);
      if (!groupData) continue;

      const availableQuestions = groupData.questions.map(transformQuestion);
      if (availableQuestions.length >= targetCount) {
        // If we have enough questions, randomly select the target count
        const selected = availableQuestions
          .sort(() => 0.5 - Math.random())
          .slice(0, targetCount);
        distributedQuestions.push(...selected);
      } else {
        // If we don't have enough, use all available and add to remaining
        distributedQuestions.push(...availableQuestions);
        // Add remaining capacity to remainingQuestions
        const remainingCapacity = targetCount - availableQuestions.length;
        if (remainingCapacity > 0) {
          remainingQuestions.push(...Array(remainingCapacity).fill(null));
        }
      }
    }

    // Second pass: Fill remaining slots with random questions from any group
    if (remainingQuestions.length > 0) {
      const allAvailableQuestions = allQuestions
        .flatMap(g => g.questions.map(transformQuestion))
        .filter(q => !distributedQuestions.includes(q));

      if (allAvailableQuestions.length > 0) {
        const randomQuestions = allAvailableQuestions
          .sort(() => 0.5 - Math.random())
          .slice(0, remainingQuestions.length);
        
        distributedQuestions.push(...randomQuestions);
      }
    }

    // If we still don't have enough questions, return what we have
    return distributedQuestions;
  } catch (error) {
    console.error('Error retrieving questions:', error);
    // Fallback to in.ts only if there's an error
    return getQuestionsFromInFile(knowledgeArea, count);
  }
}

// Helper function to get questions from in.ts only (fallback)
async function getQuestionsFromInFile(
  knowledgeArea: string,
  count: number
): Promise<QAResponseIndividual[]> {
  let questions = (inQuestions.questions as BaseQuestion[]);
  if (knowledgeArea && knowledgeArea !== 'all') {
    questions = questions.filter(q => q.analysis.knowledge_area === knowledgeArea);
  }
  // Shuffle and limit
  if (questions.length > count) {
    questions = questions.sort(() => 0.5 - Math.random()).slice(0, count);
  }
  return questions.map(transformQuestion);
}

// Update the transformQuestion function to use BaseQuestion
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
    tool: q.analysis.tool || '',
    suggested_read: Array.isArray(q.analysis.suggested_read) ? q.analysis.suggested_read.join('; ') : q.analysis.suggested_read,
    concepts_to_understand: q.analysis.concepts_to_understand,
    is_attempted: false,
    question_type: "Option",
    selected_option: "",
    analysis: q.analysis
  };
} 