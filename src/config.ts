// Environment configuration
export const config = {
  // PMP Service URL - must be set via environment variable
  PMP_SERVICE_URL: process.env.REACT_APP_PMP_SERVICE_URL || '',
  
  // Legacy API configuration for backward compatibility
  baseUrl: process.env.REACT_APP_API_BASE_URL || '',
  apiKey: process.env.REACT_APP_API_KEY || '',
  
  // API endpoints
  API_ENDPOINTS: {
    // These should match your API Gateway endpoints
    QUESTIONS: '/api/pmp-questions',
    SAVE_RESPONSE: '/api/saveRecord',
    GET_QUESTION: '/api/getQuestion',
    DELETE_QUESTION: '/api/deleteQuestion',
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
  // Always use the full service URL, even in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  console.log('DEBUG - buildApiUrl - isDevelopment:', isDevelopment);
  console.log('DEBUG - buildApiUrl - endpoint:', endpoint);
  console.log('DEBUG - buildApiUrl - config.PMP_SERVICE_URL:', config.PMP_SERVICE_URL);
  
  // Always use the full service URL
  const baseUrl = config.PMP_SERVICE_URL;
  
  console.log('DEBUG - buildApiUrl - baseUrl:', baseUrl);
  
  // Build the URL
  let urlString = `${baseUrl}${endpoint}`;
  
  console.log('DEBUG - buildApiUrl - urlString before params:', urlString);
  
  // Add query parameters if provided
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value.toString());
    });
    urlString += `?${queryParams.toString()}`;
  }
  
  console.log('DEBUG - buildApiUrl - final urlString:', urlString);
  
  return urlString;
};

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