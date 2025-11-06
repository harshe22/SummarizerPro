import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 600000, // 10 minutes timeout for large documents
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth headers if needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          toast.error(data.detail || 'Invalid request')
          break
        case 404:
          toast.error('Service not found')
          break
        case 422:
          toast.error('Validation error')
          break
        case 500:
          toast.error('Server error. Please try again later.')
          break
        default:
          toast.error('An unexpected error occurred')
      }
    } else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. The operation is taking longer than expected. Please try again.')
      } else {
        toast.error('Network error. Please check your connection and ensure the backend server is running.')
      }
    } else {
      toast.error('Request failed')
    }
    
    return Promise.reject(error)
  }
)

// API methods
export const summarizeAPI = {
  // Text summarization
  summarizeText: async (data) => {
    const response = await apiClient.post('/summarize/text', data)
    return response.data
  },
  
  // Document summarization
  summarizeDocument: async (files, options = {}) => {
    const formData = new FormData()
    
    files.forEach((file) => {
      formData.append('files', file)
    })
    
    formData.append('max_length', options.maxLength || 1000)  // Much higher default for detailed summaries
    formData.append('min_length', options.minLength || 200)   // Higher minimum for comprehensive content
    formData.append('summary_type', options.summaryType || 'comprehensive')
    formData.append('summary_style', options.summaryStyle || 'detailed')
    if (options.customPrompt) {
      formData.append('custom_prompt', options.customPrompt)
    }
    
    const response = await apiClient.post('/summarize/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 900000, // 15 minutes for document processing specifically
    })
    
    return response.data
  },
  
  // URL summarization
  summarizeUrl: async (data) => {
    const response = await apiClient.post('/summarize/url', data)
    return response.data
  },
  
  // YouTube summarization
  summarizeYoutube: async (data) => {
    const response = await apiClient.post('/summarize/youtube', data)
    return response.data
  },
  
  // Multilingual summarization
  summarizeMultilingual: async (data) => {
    const response = await apiClient.post('/summarize/multilingual', data)
    return response.data
  },
}

export const qaAPI = {
  // Ask question
  askQuestion: async (data) => {
    const response = await apiClient.post('/qa/ask', data)
    return response.data
  },
  
  // Conversational Q&A
  conversationalQA: async (data) => {
    const response = await apiClient.post('/qa/conversation', data)
    return response.data
  },
  
  // Batch Q&A
  batchQA: async (questions, context, language = 'en') => {
    const response = await apiClient.post('/qa/batch', {
      questions,
      context,
      language,
    })
    return response.data
  },
  
  // Get suggested questions
  getSuggestedQuestions: async (context, numQuestions = 5) => {
    const response = await apiClient.get('/qa/suggested-questions', {
      params: { context, num_questions: numQuestions },
    })
    return response.data
  },
}

export const exportAPI = {
  // Export as TXT
  exportTxt: async (data) => {
    const response = await apiClient.post('/export/txt', data, {
      responseType: 'blob',
    })
    return response
  },
  
  // Export as DOCX
  exportDocx: async (data) => {
    const response = await apiClient.post('/export/docx', data, {
      responseType: 'blob',
    })
    return response
  },
  
  // Export as PDF
  exportPdf: async (data) => {
    const response = await apiClient.post('/export/pdf', data, {
      responseType: 'blob',
    })
    return response
  },
  
  // Generate TTS
  generateTTS: async (data) => {
    const response = await apiClient.post('/tts/generate', data, {
      responseType: 'blob',
    })
    return response
  },
  
  // Get supported TTS languages
  getSupportedLanguages: async () => {
    const response = await apiClient.get('/tts/languages')
    return response.data
  },
  
  // Batch export
  batchExport: async (data) => {
    const response = await apiClient.post('/export/batch', data)
    return response.data
  },
}

// Health check
export const healthAPI = {
  checkHealth: async () => {
    const response = await apiClient.get('/health')
    return response.data
  },
  
  // Test backend connection
  testConnection: async () => {
    try {
      const response = await axios.get('http://localhost:8000/health', { timeout: 5000 })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
}

export default apiClient
