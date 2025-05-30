export const API_CONFIG = {
    PMP_SERVICE_URL: process.env.REACT_APP_PMP_SERVICE_URL || 'http://localhost:8080',
    HEADERS: {
        'X-API-Key': process.env.REACT_APP_PMP_API_KEY || '',
        'Content-Type': 'application/json'
    },
    ENDPOINTS: {
        GET_QUESTION: process.env.REACT_APP_PMP_QUESTION_ENDPOINT || '/getPMPQuestion',
        VALIDATE_RESPONSE: process.env.REACT_APP_PMP_VALIDATE_RESPONSE_ENDPOINT || '/api/validateSubmittedResponse',
        GET_QUESTIONS_AND_ANSWERS: process.env.REACT_APP_PMP_GET_QUESTIONS_AND_ANSWERS_ENDPOINT || '/getPMPQuestionsAndAnswers'
    }
}; 