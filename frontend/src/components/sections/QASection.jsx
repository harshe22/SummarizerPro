import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Lightbulb, 
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import useAppStore from '../../store/useAppStore'
import { qaAPI } from '../../api/client'
import toast from 'react-hot-toast'

const QASection = () => {
  const {
    summaryResults,
    qaHistory,
    currentQuestion,
    setCurrentQuestion,
    addQAInteraction,
    clearQAHistory,
    getQAContext
  } = useAppStore()

  const [isAsking, setIsAsking] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  useEffect(() => {
    if (summaryResults) {
      loadSuggestedQuestions()
    }
  }, [summaryResults])

  const loadSuggestedQuestions = async () => {
    setIsLoadingSuggestions(true)
    try {
      const context = getQAContext()
      if (context) {
        const response = await qaAPI.getSuggestedQuestions(context, 5)
        setSuggestedQuestions(response.suggested_questions || [])
      }
    } catch (error) {
      console.error('Failed to load suggested questions:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleAskQuestion = async (question = currentQuestion) => {
    if (!question.trim()) {
      toast.error('Please enter a question')
      return
    }

    const context = getQAContext()
    if (!context) {
      toast.error('No content available for Q&A')
      return
    }

    setIsAsking(true)
    try {
      const conversationHistory = qaHistory.slice(0, 3).map(qa => ({
        question: qa.question,
        answer: qa.answer
      }))

      const response = await qaAPI.conversationalQA({
        question,
        context,
        conversation_history: conversationHistory,
        language: 'en'
      })

      addQAInteraction(
        question,
        response.answer,
        response.confidence,
        response.supporting_text
      )

      setCurrentQuestion('')
      toast.success('Question answered!')
    } catch (error) {
      toast.error('Failed to get answer. Please try again.')
    } finally {
      setIsAsking(false)
    }
  }

  const handleSuggestedQuestion = (question) => {
    setCurrentQuestion(question)
    handleAskQuestion(question)
  }

  const handleCopyAnswer = async (answer) => {
    try {
      await navigator.clipboard.writeText(answer)
      toast.success('Answer copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy answer')
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  if (!summaryResults) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Q&A Input Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Ask Questions</span>
            </CardTitle>
            {qaHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearQAHistory}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question Input */}
          <div className="flex space-x-2">
            <Input
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Ask a question about the content..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAskQuestion()
                }
              }}
              disabled={isAsking}
            />
            <Button
              onClick={() => handleAskQuestion()}
              disabled={!currentQuestion.trim() || isAsking}
              size="sm"
            >
              {isAsking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Suggested Questions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={isAsking}
                    className="text-xs h-8"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Q&A History */}
      <AnimatePresence>
        {qaHistory.map((qa, index) => (
          <motion.div
            key={qa.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Question */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">Q</span>
                    </div>
                    <p className="font-medium text-foreground">{qa.question}</p>
                  </div>
                </div>

                {/* Answer */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-green-600">A</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-foreground leading-relaxed">{qa.answer}</p>
                      
                      {/* Confidence and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(qa.confidence)}`}>
                            {getConfidenceLabel(qa.confidence)} ({Math.round(qa.confidence * 100)}%)
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyAnswer(qa.answer)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supporting Text */}
                  {qa.supportingText && (
                    <div className="ml-8 p-3 bg-muted/50 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Supporting context:</p>
                      <p className="text-sm text-muted-foreground italic">
                        "{qa.supportingText.substring(0, 200)}..."
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty State */}
      {qaHistory.length === 0 && !isAsking && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No questions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask questions about the summarized content to get instant answers.
            </p>
            {suggestedQuestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try these suggestions:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedQuestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-xs"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

export default QASection
