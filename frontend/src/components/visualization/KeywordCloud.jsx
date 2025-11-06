import React from 'react'
import { motion } from 'framer-motion'

const KeywordCloud = ({ keywords }) => {
  if (!keywords || keywords.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No keywords extracted
      </div>
    )
  }

  // Generate different sizes and colors for keywords
  const getKeywordStyle = (index, total) => {
    const sizeClasses = [
      'text-2xl font-bold',
      'text-xl font-semibold', 
      'text-lg font-medium',
      'text-base font-medium',
      'text-sm font-normal'
    ]
    
    const colorClasses = [
      'text-blue-600',
      'text-green-600', 
      'text-purple-600',
      'text-orange-600',
      'text-red-600',
      'text-indigo-600',
      'text-pink-600',
      'text-teal-600'
    ]

    const sizeIndex = Math.min(Math.floor(index / Math.ceil(total / 5)), sizeClasses.length - 1)
    const colorIndex = index % colorClasses.length

    return {
      className: `${sizeClasses[sizeIndex]} ${colorClasses[colorIndex]} hover:opacity-80 transition-opacity cursor-default`,
      delay: index * 0.1
    }
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center items-center p-4">
      {keywords.map((keyword, index) => {
        const style = getKeywordStyle(index, keywords.length)
        
        return (
          <motion.span
            key={`${keyword}-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: style.delay,
              duration: 0.3,
              ease: "easeOut"
            }}
            className={style.className}
            whileHover={{ scale: 1.1 }}
          >
            {keyword}
          </motion.span>
        )
      })}
    </div>
  )
}

export default KeywordCloud
