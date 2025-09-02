// API Key Validation
export const validateApiKey = (key) => {
  if (!key) return false;
  
  // OpenRouter API keys start with 'sk-or-v1-'
  if (key.startsWith('sk-or-v1-')) return true;
  
  // OpenAI API keys start with 'sk-'
  if (key.startsWith('sk-') && key.length > 20) return true;
  
  return false;
};

// Rate Limiting Implementation
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  checkRateLimit(userId = 'anonymous', maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove old requests outside the time window
    const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return {
        allowed: false,
        resetTime: Math.min(...validRequests) + windowMs,
        remaining: 0
      };
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(userId, validRequests);
    
    return {
      allowed: true,
      resetTime: now + windowMs,
      remaining: maxRequests - validRequests.length
    };
  }

  getRemainingRequests(userId = 'anonymous', maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    return Math.max(0, maxRequests - validRequests.length);
  }
}

export const rateLimiter = new RateLimiter();

// Environment Configuration
export const getConfig = () => ({
  openRouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  siteUrl: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
  siteName: import.meta.env.VITE_SITE_NAME || 'AI Task Manager',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableAiAssistant: import.meta.env.VITE_ENABLE_AI_ASSISTANT !== 'false',
  enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE !== 'false',
  aiRequestsPerMinute: parseInt(import.meta.env.VITE_AI_REQUESTS_PER_MINUTE) || 10,
  aiRequestsPerHour: parseInt(import.meta.env.VITE_AI_REQUESTS_PER_HOUR) || 100
});

// Secure API Request Helper
export const makeSecureApiRequest = async (url, options = {}) => {
  const config = getConfig();
  
  // Check rate limit
  const rateCheck = rateLimiter.checkRateLimit('user', config.aiRequestsPerMinute);
  if (!rateCheck.allowed) {
    throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateCheck.resetTime - Date.now()) / 1000)} seconds.`);
  }
  
  // Validate API key if making AI requests
  if (url.includes('openrouter') || url.includes('openai')) {
    if (!validateApiKey(config.openRouterApiKey)) {
      throw new Error('Invalid or missing API key. Please check your configuration.');
    }
  }
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (config.openRouterApiKey && (url.includes('openrouter') || url.includes('openai'))) {
    defaultHeaders['Authorization'] = `Bearer ${config.openRouterApiKey}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};
