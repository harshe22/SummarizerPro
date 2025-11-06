import React from 'react'
import { motion } from 'framer-motion'
import useAppStore from '../../store/useAppStore'
import SummarySettings from '../settings/SummarySettings'

const TextInput = () => {
  const { inputContent, updateInputContent } = useAppStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <SummarySettings />
      
      <div>
        <label className="text-sm font-medium mb-2 block">
          Enter your text content
        </label>
        <textarea
          value={inputContent.text}
          onChange={(e) => updateInputContent('text', e.target.value)}
          placeholder="Paste or type your text here... (minimum 10 words)"
          className="w-full h-32 p-3 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>
      
      <div className="text-xs text-muted-foreground">
        Word count: {inputContent.text.split(' ').filter(word => word.length > 0).length}
      </div>
    </motion.div>
  )
}

export default TextInput
