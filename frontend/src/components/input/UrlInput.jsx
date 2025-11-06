import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import SummarySettings from '../settings/SummarySettings'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { isValidUrl } from '../../lib/utils'

const UrlInput = () => {
  const { inputContent, updateInputContent } = useAppStore()
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState(null)

  const validateUrl = async (url) => {
    if (!url.trim()) {
      setValidationStatus(null)
      return
    }

    if (!isValidUrl(url)) {
      setValidationStatus('invalid')
      return
    }

    setIsValidating(true)
    setValidationStatus('validating')

    try {
      // Simple validation - just check if URL is properly formatted
      // In a real app, you might want to check if the URL is accessible
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate validation
      setValidationStatus('valid')
    } catch (error) {
      setValidationStatus('error')
    } finally {
      setIsValidating(false)
    }
  }

  const handleUrlChange = (value) => {
    updateInputContent('url', value)
    
    // Debounce validation
    clearTimeout(window.urlValidationTimeout)
    window.urlValidationTimeout = setTimeout(() => {
      validateUrl(value)
    }, 500)
  }

  const openUrl = () => {
    if (inputContent.url && isValidUrl(inputContent.url)) {
      window.open(inputContent.url, '_blank', 'noopener,noreferrer')
    }
  }

  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'invalid':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'validating':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      default:
        return null
    }
  }

  const getValidationMessage = () => {
    switch (validationStatus) {
      case 'valid':
        return 'URL is valid and ready to process'
      case 'invalid':
        return 'Please enter a valid URL'
      case 'error':
        return 'Unable to validate URL'
      case 'validating':
        return 'Validating URL...'
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <SummarySettings />
      
      <div>
        <label className="text-sm font-medium mb-2 block">
          Enter article URL
        </label>
        <div className="relative">
          <Input
            type="url"
            value={inputContent.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/article"
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {getValidationIcon()}
            {inputContent.url && isValidUrl(inputContent.url) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={openUrl}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Validation Message */}
      {validationStatus && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`text-xs p-2 rounded-md ${
            validationStatus === 'valid'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : validationStatus === 'validating'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {getValidationMessage()}
        </motion.div>
      )}

      {/* URL Preview */}
      {inputContent.url && isValidUrl(inputContent.url) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-muted/50 rounded-md"
        >
          <div className="flex items-start space-x-2">
            <Link className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{inputContent.url}</p>
              <p className="text-xs text-muted-foreground">
                Ready to extract and summarize content
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Supports most news articles and blog posts</p>
        <p>• Works best with text-heavy content</p>
        <p>• Some sites may block automated access</p>
      </div>
    </motion.div>
  )
}

export default UrlInput
