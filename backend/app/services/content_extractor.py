"""
Content Extraction & Preprocessing Service
Handles web article URL content extraction and preprocessing
"""

import logging
import requests
from bs4 import BeautifulSoup
import re
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ContentExtractorService:
    """Extracts and preprocesses content from web URLs"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    async def extract_from_url(self, url: str) -> Dict[str, Any]:
        """Extract article content from URL"""
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
                element.decompose()
            
            # Extract title
            title = soup.find('title')
            title_text = title.get_text().strip() if title else "Untitled"
            
            # Extract main content
            content_text = self._extract_main_content(soup)
            
            # Clean text
            content_text = self._clean_text(content_text)
            
            return {
                'title': title_text,
                'content': content_text,
                'url': url,
                'word_count': len(content_text.split()),
                'char_count': len(content_text)
            }
        except Exception as e:
            logger.error(f"Error extracting URL content: {str(e)}")
            raise
    
    def _extract_main_content(self, soup: BeautifulSoup) -> str:
        """Extract main article content using multiple strategies"""
        # Try common article selectors
        selectors = [
            'article',
            'main',
            '[role="main"]',
            '.article-content',
            '.post-content',
            '.entry-content',
            '.content',
            '.story-body'
        ]
        
        for selector in selectors:
            content = soup.select_one(selector)
            if content:
                return content.get_text(separator='\n', strip=True)
        
        # Fallback to body
        body = soup.find('body')
        return body.get_text(separator='\n', strip=True) if body else ""
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text"""
        # Remove multiple newlines
        text = re.sub(r'\n\s*\n', '\n\n', text)
        # Remove multiple spaces
        text = re.sub(r' +', ' ', text)
        # Remove leading/trailing whitespace
        return text.strip()

# Global instance
content_extractor = ContentExtractorService()
