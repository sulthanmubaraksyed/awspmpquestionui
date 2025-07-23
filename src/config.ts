// Environment configuration
export const config = {
  // PMP Service URL - must be set via environment variable
  PMP_SERVICE_URL: process.env.REACT_APP_PMP_SERVICE_URL || '',
  
  // Legacy API configuration for backward compatibility
  baseUrl: process.env.REACT_APP_API_BASE_URL || '',
  apiKey: process.env.REACT_APP_API_KEY || '',
  
  // API endpoints
  API_ENDPOINTS: {
    QUESTIONS: '/prod/api/pmp-questions',
    SAVE_RESPONSE: '/prod/api/saveRecord',
    GET_QUESTION: '/prod/api/getQuestion',
    DELETE_QUESTION: '/prod/api/deleteQuestion',
  },
  
  // Default request settings
  DEFAULT_REQUEST_CONFIG: {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.REACT_APP_API_KEY || '',
    },
    timeout: 10000, // 10 seconds
  }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  const url = new URL(endpoint, config.PMP_SERVICE_URL);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });
  }
  
  return url.toString();
};

export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || '',
  apiKey: process.env.REACT_APP_API_KEY || '', // API key for authentication
  endpoints: {
    questions: '/prod/api/pmp-questions'
  }
} as const;

// Helper function to get the full URL for API calls
export function getApiUrl(endpoint: string): string {
  // If baseUrl is set, use it; otherwise use relative URL (which will use proxy)
  return API_CONFIG.baseUrl ? `${API_CONFIG.baseUrl}${endpoint}` : endpoint;
} 