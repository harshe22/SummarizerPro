import React from 'react'
import { motion } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import InputSection from '../components/sections/InputSection'
import SummarySection from '../components/sections/SummarySection'
import QASection from '../components/sections/QASection'

const HomePage = () => {
  const { currentStep } = useAppStore()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }

  return (
    <motion.div
      className="max-w-7xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold gradient-text">
          Professional Content Summarization
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Transform any content into comprehensive summaries with AI-powered analysis, 
          interactive Q&A, and professional export options.
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <InputSection />
        </motion.div>

        {/* Results Section */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          {currentStep === 'results' ? (
            <div className="space-y-6">
              <SummarySection />
              <QASection />
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {currentStep === 'processing' 
                    ? 'Processing your content...' 
                    : 'Select content type and input to get started'
                  }
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div variants={itemVariants} className="mt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground">
            Everything you need for professional content analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

const features = [
  {
    title: 'Multi-format Support',
    description: 'Process text, PDFs, Word docs, URLs, and YouTube videos',
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    title: 'AI-Powered Analysis',
    description: 'Advanced NLP models for accurate summarization and insights',
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  {
    title: 'Interactive Q&A',
    description: 'Ask questions about your content and get instant answers',
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: 'Export Options',
    description: 'Download summaries as PDF, Word, or text files',
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }
]

export default HomePage
