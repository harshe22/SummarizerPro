import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Youtube, ExternalLink, CheckCircle, AlertCircle, Play } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import useAppStore from '../../store/useAppStore'
import SummarySettings from '../settings/SummarySettings'
import { isYouTubeUrl } from '../../lib/utils'

const YoutubeInput = () => {
  const { inputContent, updateInputContent } = useAppStore()
  const [videoInfo, setVideoInfo] = useState(null)
  const [validationStatus, setValidationStatus] = useState(null)

  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const validateYouTubeUrl = async (url) => {
    if (!url.trim()) {
      setValidationStatus(null)
      setVideoInfo(null)
      return
    }

    if (!isYouTubeUrl(url)) {
      setValidationStatus('invalid')
      setVideoInfo(null)
      return
    }

    setValidationStatus('validating')
    
    try {
      const videoId = extractVideoId(url)
      if (videoId) {
        // In a real app, you might fetch video info from YouTube API
        // For now, we'll simulate it
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setVideoInfo({
          id: videoId,
          title: 'YouTube Video', // Would come from API
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          duration: 'Unknown', // Would come from API
          channel: 'Unknown Channel' // Would come from API
        })
        setValidationStatus('valid')
      } else {
        setValidationStatus('invalid')
        setVideoInfo(null)
      }
    } catch (error) {
      setValidationStatus('error')
      setVideoInfo(null)
    }
  }

  const handleUrlChange = (value) => {
    updateInputContent('youtubeUrl', value)
    
    // Debounce validation
    clearTimeout(window.youtubeValidationTimeout)
    window.youtubeValidationTimeout = setTimeout(() => {
      validateYouTubeUrl(value)
    }, 500)
  }

  const openVideo = () => {
    if (inputContent.youtubeUrl && isYouTubeUrl(inputContent.youtubeUrl)) {
      window.open(inputContent.youtubeUrl, '_blank', 'noopener,noreferrer')
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
        return 'YouTube video detected and ready to process'
      case 'invalid':
        return 'Please enter a valid YouTube URL'
      case 'error':
        return 'Unable to validate YouTube URL'
      case 'validating':
        return 'Validating YouTube URL...'
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
          Enter YouTube URL
        </label>
        <div className="relative">
          <Input
            type="url"
            value={inputContent.youtubeUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {getValidationIcon()}
            {inputContent.youtubeUrl && isYouTubeUrl(inputContent.youtubeUrl) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={openVideo}
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

      {/* Video Preview */}
      {videoInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-muted/50 rounded-md"
        >
          <div className="flex items-start space-x-3">
            <div className="relative flex-shrink-0">
              <img
                src={videoInfo.thumbnail}
                alt="Video thumbnail"
                className="w-16 h-12 rounded object-cover"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                <Play className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{videoInfo.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {videoInfo.channel} • {videoInfo.duration}
              </p>
            </div>
            <Youtube className="w-5 h-5 text-red-500 flex-shrink-0" />
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Supports YouTube videos with captions/subtitles</p>
        <p>• Works best with educational or informational content</p>
        <p>• Processing time depends on video length</p>
        <p>• Requires available captions for transcription</p>
      </div>
    </motion.div>
  )
}

export default YoutubeInput
