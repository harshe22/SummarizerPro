import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Download, 
  Volume2, 
  Copy, 
  Share2, 
  BarChart3,
  Clock,
  Hash,
  Heart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import useAppStore from '../../store/useAppStore'
import { exportAPI } from '../../api/client'
import { downloadBlob, formatReadingTime, getSentimentColor, getSentimentIcon } from '../../lib/utils'
import toast from 'react-hot-toast'
import KeywordCloud from '../visualization/KeywordCloud'
import TopicsChart from '../visualization/TopicsChart'

const SummarySection = () => {
  const { summaryResults } = useAppStore()
  const [isExporting, setIsExporting] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)

  if (!summaryResults) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryResults.summary)
      toast.success('Summary copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy summary')
    }
  }

  const handleExport = async (format) => {
    setIsExporting(true)
    try {
      const exportData = {
        content: summaryResults.summary,
        title: `Summary - ${new Date().toLocaleDateString()}`,
        metadata: summaryResults.metadata
      }

      let response
      switch (format) {
        case 'txt':
          response = await exportAPI.exportTxt(exportData)
          break
        case 'docx':
          response = await exportAPI.exportDocx(exportData)
          break
        case 'pdf':
          response = await exportAPI.exportPdf(exportData)
          break
        default:
          throw new Error('Invalid format')
      }

      const filename = `summary_${Date.now()}.${format}`
      downloadBlob(response.data, filename)
      toast.success(`Summary exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true)
    try {
      const response = await exportAPI.generateTTS({
        text: summaryResults.summary,
        language: 'en',
        speed: 1.0
      })

      const filename = `summary_audio_${Date.now()}.mp3`
      downloadBlob(response.data, filename)
      toast.success('Audio generated successfully!')
    } catch (error) {
      toast.error('Failed to generate audio')
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Summary from Summarize-Pro',
          text: summaryResults.summary,
          url: window.location.href
        })
      } catch (error) {
        // User cancelled or error occurred
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Summary</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Text */}
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {summaryResults.summary}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('txt')}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              TXT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('docx')}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              DOCX
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAudio}
              disabled={isGeneratingAudio}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              {isGeneratingAudio ? 'Generating...' : 'Audio'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reading Time */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reading Time</p>
                <p className="font-semibold">
                  {formatReadingTime(summaryResults.metadata?.reading_time_minutes || 1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compression Ratio */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compression</p>
                <p className="font-semibold">
                  {summaryResults.metadata?.compression_ratio || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getSentimentColor(summaryResults.sentiment)}`}>
                <span className="text-lg">
                  {getSentimentIcon(summaryResults.sentiment)}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sentiment</p>
                <p className="font-semibold capitalize">
                  {summaryResults.sentiment?.label?.replace(/\d+\s*stars?/i, 'stars') || 'Neutral'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keywords and Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords */}
        {summaryResults.keywords && summaryResults.keywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="w-5 h-5" />
                <span>Key Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KeywordCloud keywords={summaryResults.keywords} />
            </CardContent>
          </Card>
        )}

        {/* Topics */}
        {summaryResults.topics && summaryResults.topics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Topics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopicsChart topics={summaryResults.topics} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Metadata */}
      {summaryResults.metadata && (
        <Card>
          <CardHeader>
            <CardTitle>Summary Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Original Words</p>
                <p className="font-medium">{summaryResults.metadata.original_word_count?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Summary Words</p>
                <p className="font-medium">{summaryResults.metadata.summary_word_count?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Content Type</p>
                <p className="font-medium capitalize">{summaryResults.metadata.content_type?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Summary Type</p>
                <p className="font-medium capitalize">{summaryResults.metadata.summary_type?.replace('_', ' ')}</p>
              </div>
              {summaryResults.metadata.summary_style && (
                <div>
                  <p className="text-muted-foreground">Summary Style</p>
                  <p className="font-medium capitalize">{summaryResults.metadata.summary_style}</p>
                </div>
              )}
              {summaryResults.metadata.custom_prompt_used && (
                <div>
                  <p className="text-muted-foreground">Custom Prompt</p>
                  <p className="font-medium">Used</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

export default SummarySection
