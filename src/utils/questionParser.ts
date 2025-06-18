interface ParsedQuestion {
  Question: string;
  OPTION_A: string;
  OPTION_B: string;
  OPTION_C: string;
  OPTION_D: string;
}

interface QuestionResponse {
  parsed_question: ParsedQuestion;
}

interface QuestionAndAnswers {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export function getQuestionAndAnswers(response: QuestionResponse): QuestionAndAnswers {
  if (!response.parsed_question) {
    throw new Error('Invalid question format: Missing required fields');
  }

  const { parsed_question } = response;
  const requiredFields = ['Question', 'OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D'];
  
  for (const field of requiredFields) {
    if (!(field in parsed_question)) {
      throw new Error('Invalid question format: Missing required fields');
    }
  }

  return {
    question: parsed_question.Question.trim(),
    optionA: parsed_question.OPTION_A.trim(),
    optionB: parsed_question.OPTION_B.trim(),
    optionC: parsed_question.OPTION_C.trim(),
    optionD: parsed_question.OPTION_D.trim()
  };
} 