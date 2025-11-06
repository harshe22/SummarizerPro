import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useAppStore = create(
  devtools(
    (set, get) => ({
      // UI State
      isLoading: false,
      currentStep: 'input', // input, processing, results
      activeTab: 'text',
      
      // Content State
      inputContent: {
        text: '',
        files: [],
        url: '',
        youtubeUrl: ''
      },
      
      // Summary Results
      summaryResults: null,
      summaryHistory: [],
      
      // Q&A State
      qaHistory: [],
      currentQuestion: '',
      
      // Settings
      summarySettings: {
        maxLength: 1200,
        minLength: 300,
        summaryType: 'comprehensive', // comprehensive, bullet_points, story
        summaryStyle: 'comprehensive', // brief, detailed, comprehensive
        customPrompt: '',
        language: 'en'
      },
      
      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      updateInputContent: (type, content) =>
        set((state) => ({
          inputContent: {
            ...state.inputContent,
            [type]: content
          }
        })),
      
      clearInputContent: () =>
        set({
          inputContent: {
            text: '',
            files: [],
            url: '',
            youtubeUrl: ''
          }
        }),
      
      setSummaryResults: (results) => {
        set((state) => ({
          summaryResults: results,
          summaryHistory: [results, ...state.summaryHistory.slice(0, 9)] // Keep last 10
        }))
      },
      
      clearSummaryResults: () => set({ summaryResults: null }),
      
      addQAInteraction: (question, answer, confidence, supportingText) =>
        set((state) => ({
          qaHistory: [
            {
              id: Date.now(),
              question,
              answer,
              confidence,
              supportingText,
              timestamp: new Date().toISOString()
            },
            ...state.qaHistory
          ]
        })),
      
      clearQAHistory: () => set({ qaHistory: [] }),
      
      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      
      updateSummarySettings: (settings) =>
        set((state) => ({
          summarySettings: {
            ...state.summarySettings,
            ...settings
          }
        })),
      
      // Computed getters
      getActiveInputContent: () => {
        const { inputContent, activeTab } = get()
        switch (activeTab) {
          case 'text':
            return inputContent.text
          case 'files':
            return inputContent.files
          case 'url':
            return inputContent.url
          case 'youtube':
            return inputContent.youtubeUrl
          default:
            return ''
        }
      },
      
      hasValidInput: () => {
        const { inputContent, activeTab } = get()
        switch (activeTab) {
          case 'text':
            return inputContent.text.trim().length > 10
          case 'files':
            return inputContent.files.length > 0
          case 'url':
            return inputContent.url.trim().length > 0 && isValidUrl(inputContent.url)
          case 'youtube':
            return inputContent.youtubeUrl.trim().length > 0 && isYouTubeUrl(inputContent.youtubeUrl)
          default:
            return false
        }
      },
      
      getQAContext: () => {
        const { summaryResults } = get()
        if (!summaryResults) return ''
        
        // Combine summary and original content for Q&A context
        let context = summaryResults.summary
        
        if (summaryResults.metadata?.original_content) {
          context = summaryResults.metadata.original_content + '\n\nSummary: ' + summaryResults.summary
        }
        
        return context
      }
    }),
    {
      name: 'summarize-pro-store'
    }
  )
)

// Helper functions
function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

function isYouTubeUrl(url) {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
  return youtubeRegex.test(url)
}

export default useAppStore
