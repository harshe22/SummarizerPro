import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Brain, Globe, Shield, Users, Rocket } from 'lucide-react'

const AboutPage = () => {
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
      className="max-w-4xl mx-auto space-y-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold gradient-text">
          About Summarize-Pro
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We're revolutionizing how professionals consume and analyze content with 
          cutting-edge AI technology and intuitive design.
        </p>
      </motion.div>

      {/* Mission Section */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Our Mission</h2>
        <div className="bg-card p-8 rounded-lg border">
          <p className="text-lg leading-relaxed text-center">
            To empower professionals, researchers, and content creators with intelligent 
            summarization tools that save time, enhance understanding, and unlock insights 
            from any type of content.
          </p>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div variants={itemVariants} className="space-y-8">
        <h2 className="text-3xl font-bold text-center">Why Choose Summarize-Pro?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Technology Section */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Powered by Advanced AI</h2>
        <div className="bg-card p-8 rounded-lg border space-y-4">
          <p className="text-lg leading-relaxed">
            Summarize-Pro leverages state-of-the-art natural language processing models 
            including FLAN-T5, BART, Pegasus, and Whisper to deliver accurate and 
            contextual summaries across multiple content types.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {technologies.map((tech) => (
              <div key={tech} className="text-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Impact & Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 border rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Team Section */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Built with Excellence</h2>
        <div className="bg-card p-8 rounded-lg border text-center space-y-4">
          <p className="text-lg leading-relaxed">
            Developed by a team of AI researchers, software engineers, and UX designers 
            passionate about making information more accessible and actionable.
          </p>
          <p className="text-muted-foreground">
            We believe in the power of AI to augment human intelligence, not replace it.
          </p>
        </div>
      </motion.div>

      {/* Contact Section */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Get in Touch</h2>
        <div className="bg-card p-8 rounded-lg border text-center space-y-4">
          <p className="text-lg">
            Have questions, feedback, or want to collaborate? We'd love to hear from you.
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="mailto:contact@summarize-pro.com" 
              className="text-primary hover:underline"
            >
              contact@summarize-pro.com
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

const features = [
  {
    title: 'Lightning Fast',
    description: 'Process content in seconds with optimized AI models and efficient architecture.',
    icon: Zap
  },
  {
    title: 'Intelligent Analysis',
    description: 'Advanced NLP techniques for keyword extraction, topic modeling, and sentiment analysis.',
    icon: Brain
  },
  {
    title: 'Multi-language Support',
    description: 'Support for multiple languages with specialized multilingual models.',
    icon: Globe
  },
  {
    title: 'Privacy First',
    description: 'Your content is processed securely and never stored permanently.',
    icon: Shield
  },
  {
    title: 'User-Centric Design',
    description: 'Intuitive interface designed for professionals and researchers.',
    icon: Users
  },
  {
    title: 'Continuous Innovation',
    description: 'Regular updates with the latest AI advancements and user-requested features.',
    icon: Rocket
  }
]

const technologies = [
  'FLAN-T5',
  'BART',
  'Pegasus',
  'Whisper',
  'KeyBERT',
  'BERTopic',
  'RoBERTa',
  'mBART'
]

const stats = [
  {
    value: '95%',
    label: 'Accuracy Rate'
  },
  {
    value: '<3s',
    label: 'Average Processing Time'
  },
  {
    value: '50+',
    label: 'Languages Supported'
  }
]

export default AboutPage
