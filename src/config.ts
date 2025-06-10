export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || '',
  apiKey: process.env.REACT_APP_API_KEY || '', // API key for authentication
  endpoints: {
    questions: '/api/pmp-questions'
  }
} as const;

// Helper function to get the full URL for API calls
export function getApiUrl(endpoint: string): string {
  // If baseUrl is set, use it; otherwise use relative URL (which will use proxy)
  return API_CONFIG.baseUrl ? `${API_CONFIG.baseUrl}${endpoint}` : endpoint;
} 