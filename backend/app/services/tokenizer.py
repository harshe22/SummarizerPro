"""
Tokenization & Encoding Service
Handles text preprocessing and tokenization for plain text input
"""

import logging
import re
from typing import Dict, Any

logger = logging.getLogger(__name__)

class TokenizerService:
    """Handles tokenization and encoding for plain text"""
    
    def __init__(self):
        self.max_token_length = 1024
        
    def preprocess_text(self, text: str) -> Dict[str, Any]:
        """Clean and preprocess plain text input"""
        try:
            # Remove extra whitespace
            cleaned_text = re.sub(r'\s+', ' ', text.strip())
            
            # Remove special characters but keep punctuation
            cleaned_text = re.sub(r'[^\w\s.,!?;:\-\'"()]', '', cleaned_text)
            
            # Calculate basic metrics
            word_count = len(cleaned_text.split())
            char_count = len(cleaned_text)
            
            return {
                'text': cleaned_text,
                'word_count': word_count,
                'char_count': char_count,
                'is_valid': word_count >= 10
            }
        except Exception as e:
            logger.error(f"Error preprocessing text: {str(e)}")
            raise
    
    def chunk_text(self, text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
        """Split text into overlapping chunks for processing"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if len(chunk.split()) >= 10:
                chunks.append(chunk)
        
        return chunks if chunks else [text]

# Global instance
tokenizer_service = TokenizerService()
