"""
Analysis Service
Handles KeyBERT keyword extraction, BERTopic topic modeling, 
Sentiment Analysis, and Q&A functionality
"""

import logging
from typing import List, Dict, Any, Optional
from .models import model_manager

logger = logging.getLogger(__name__)

class AnalysisService:
    """Provides content analysis capabilities"""
    
    def extract_keywords(self, text: str, top_k: int = 10) -> List[str]:
        """Extract keywords using KeyBERT"""
        try:
            keybert = model_manager.get_keybert_model()
            
            # Limit text length for performance
            text_sample = text[:5000] if len(text) > 5000 else text
            
            keywords = keybert.extract_keywords(
                text_sample,
                keyphrase_ngram_range=(1, 2),
                stop_words='english'
            )
            
            # Limit to top_k results
            keywords = keywords[:top_k] if len(keywords) > top_k else keywords
            
            return [kw[0] for kw in keywords]
        except Exception as e:
            logger.error(f"Keyword extraction failed: {str(e)}")
            return []
    
    def extract_topics(self, text: str, max_topics: int = 5) -> List[Dict[str, Any]]:
        """Extract topics using BERTopic"""
        try:
            bertopic = model_manager.get_bertopic_model()
            
            # Limit text for performance and split into sentences for better topic modeling
            text_sample = text[:5000] if len(text) > 5000 else text
            
            # Split text into sentences to provide multiple samples
            import re
            sentences = re.split(r'[.!?]+', text_sample)
            sentences = [s.strip() for s in sentences if len(s.strip()) > 20]  # Filter short sentences
            
            # Need at least 2 samples for BERTopic
            if len(sentences) < 2:
                return []
            
            topics, _ = bertopic.fit_transform(sentences)
            topic_info = bertopic.get_topic_info()
            
            topic_list = []
            for _, row in topic_info.head(max_topics).iterrows():
                if row['Topic'] != -1:
                    topic_list.append({
                        'topic_id': int(row['Topic']),
                        'count': int(row['Count']),
                        'name': row.get('Name', f"Topic {row['Topic']}")
                    })
            
            return topic_list
        except Exception as e:
            logger.error(f"Topic extraction failed: {str(e)}")
            return []
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment"""
        try:
            sentiment_model = model_manager.get_sentiment_model()
            
            # Limit text length for model
            text_sample = text[:512] if len(text) > 512 else text
            
            result = sentiment_model(text_sample)
            
            return {
                'label': result[0]['label'],
                'score': round(result[0]['score'], 3)
            }
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {str(e)}")
            return {'label': 'NEUTRAL', 'score': 0.5}
    
    def answer_question(self, question: str, context: str) -> Dict[str, Any]:
        """Answer question based on context using Q&A model"""
        try:
            qa_model = model_manager.get_qa_model()
            
            # Limit context length
            context_sample = context[:2000] if len(context) > 2000 else context
            
            result = qa_model(question=question, context=context_sample)
            
            return {
                'answer': result['answer'],
                'score': round(result['score'], 3),
                'start': result['start'],
                'end': result['end']
            }
        except Exception as e:
            logger.error(f"Q&A failed: {str(e)}")
            return {
                'answer': 'Unable to answer question',
                'score': 0.0,
                'start': 0,
                'end': 0
            }
    
    def full_analysis(self, text: str) -> Dict[str, Any]:
        """Perform complete analysis (keywords, topics, sentiment)"""
        return {
            'keywords': self.extract_keywords(text),
            'topics': self.extract_topics(text),
            'sentiment': self.analyze_sentiment(text)
        }

# Global instance
analysis_service = AnalysisService()
