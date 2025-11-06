import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Link, Youtube, Upload, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import useAppStore from '../../store/useAppStore'
import { summarizeAPI, healthAPI } from '../../api/client'
import toast from 'react-hot-toast'
import TextInput from '../input/TextInput'
import FileInput from '../input/FileInput'
import UrlInput from '../input/UrlInput'
import YoutubeInput from '../input/YoutubeInput'

const InputSection = () => {
  const [processingStatus, setProcessingStatus] = useState('')
  
  const {
    activeTab,
    setActiveTab,
    isLoading,
    setLoading,
    setSummaryResults,
    setCurrentStep,
    summarySettings,
    hasValidInput,
    getActiveInputContent,
    inputContent
  } = useAppStore()

  const tabs = [
    { id: 'text', label: 'Text', icon: FileText, description: 'Paste or type text directly' },
    { id: 'files', label: 'Files', icon: Upload, description: 'Upload PDF, DOCX, or TXT files' },
    { id: 'url', label: 'URL', icon: Link, description: 'Summarize web articles' },
    { id: 'youtube', label: 'YouTube', icon: Youtube, description: 'Summarize video content' }
  ]

  const testBackendConnection = async () => {
    const result = await healthAPI.testConnection()
    if (result.success) {
      toast.success('Backend connection successful!')
    } else {
      toast.error(`Backend connection failed: ${result.error}`)
    }
  }

  const handleSummarize = async () => {
    if (!hasValidInput()) {
      toast.error('Please provide valid input content')
      return
    }

    setLoading(true)
    setCurrentStep('processing')
    setProcessingStatus('Processing document...')
    
    // Update status for large documents
    if (activeTab === 'files' && inputContent.files.length > 0) {
      const totalSize = inputContent.files.reduce((sum, file) => sum + file.size, 0)
      if (totalSize > 1024 * 1024) { // > 1MB
        setProcessingStatus('Processing large document - please wait...')
        toast('Large document detected. This may take several minutes.', {
          duration: 5000,
          icon: '⏳'
        })
      }
    }

    try {
      let result

      switch (activeTab) {
        case 'text':
          result = await summarizeAPI.summarizeText({
            text: inputContent.text,
            max_length: summarySettings.maxLength,
            min_length: summarySettings.minLength,
            summary_type: summarySettings.summaryType,
            summary_style: summarySettings.summaryStyle,
            custom_prompt: summarySettings.customPrompt || undefined
          })
          break

        case 'files':
          result = await summarizeAPI.summarizeDocument(
            inputContent.files,
            {
              maxLength: summarySettings.maxLength,
              minLength: summarySettings.minLength,
              summaryType: summarySettings.summaryType,
              summaryStyle: summarySettings.summaryStyle,
              customPrompt: summarySettings.customPrompt || undefined
            }
          )
          break

        case 'url':
          result = await summarizeAPI.summarizeUrl({
            url: inputContent.url,
            max_length: summarySettings.maxLength,
            min_length: summarySettings.minLength,
            summary_type: summarySettings.summaryType,
            summary_style: summarySettings.summaryStyle,
            custom_prompt: summarySettings.customPrompt || undefined
          })
          break

        case 'youtube':
          result = await summarizeAPI.summarizeYoutube({
            url: inputContent.youtubeUrl,
            max_length: summarySettings.maxLength,
            min_length: summarySettings.minLength,
            summary_type: summarySettings.summaryType,
            summary_style: summarySettings.summaryStyle,
            custom_prompt: summarySettings.customPrompt || undefined
          })
          break

        default:
          throw new Error('Invalid content type')
      }

      setSummaryResults(result)
      setCurrentStep('results')
      setProcessingStatus('')
      setLoading(false) // Reset loading state on success
      toast.success('Summary generated successfully!')

    } catch (error) {
      console.error('Summarization error:', error)
      
      // Simple error handling - let the request complete naturally
      if (error.response?.status === 500) {
        toast.error('Server error. Please try again.')
      } else if (error.request && !error.response) {
        toast.error('Cannot connect to the backend server. Please ensure it is running on port 8000.')
      } else {
        toast.error('Failed to generate summary. Please try again.')
      }
      
      setCurrentStep('input')
      setLoading(false)
      setProcessingStatus('')
    }
  }

  const renderInputComponent = () => {
    switch (activeTab) {
      case 'text':
        return <TextInput />
      case 'files':
        return <FileInput />
      case 'url':
        return <UrlInput />
      case 'youtube':
        return <YoutubeInput />
      default:
        return null
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Input Content</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                activeTab === tab.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2 mb-1">
                <tab.icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{tab.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Input Component */}
        <div className="min-h-[200px]">
          {renderInputComponent()}
        </div>


        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleSummarize}
            disabled={!hasValidInput() || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {processingStatus || 'Processing...'}
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
          
          {/* Processing Status */}
          {isLoading && processingStatus && (
            <div className="text-sm text-muted-foreground text-center p-2 bg-muted/50 rounded-md">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{processingStatus}</span>
              </div>
            </div>
          )}
          
          <Button
            onClick={testBackendConnection}
            variant="outline"
            className="w-full"
            size="sm"
          >
            Test Backend Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default InputSection
