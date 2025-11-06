"""
Input validation and security middleware
"""

import re
import logging
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, UploadFile
from pydantic import BaseModel, validator
import bleach
from urllib.parse import urlparse

from config.settings import settings, is_file_type_supported, validate_file_size

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Custom validation error"""
    pass

class InputValidator:
    """Comprehensive input validation"""
    
    def __init__(self):
        self.settings = settings
        
        # Malicious patterns to detect
        self.malicious_patterns = [
            r'<script[^>]*>.*?</script>',  # Script tags
            r'javascript:',  # JavaScript URLs
            r'on\w+\s*=',  # Event handlers
            r'<iframe[^>]*>.*?</iframe>',  # Iframes
            r'<object[^>]*>.*?</object>',  # Objects
            r'<embed[^>]*>.*?</embed>',  # Embeds
        ]
        
        # Compile patterns for performance
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE | re.DOTALL) 
                                for pattern in self.malicious_patterns]
    
    def sanitize_text(self, text: str) -> str:
        """Sanitize text input to prevent XSS and injection attacks"""
        if not text:
            return text
        
        # Remove potentially malicious content
        for pattern in self.compiled_patterns:
            text = pattern.sub('', text)
        
        # Use bleach for additional sanitization
        if self.settings.SANITIZE_INPUTS:
            # Allow basic formatting but strip dangerous tags
            allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li']
            text = bleach.clean(text, tags=allowed_tags, strip=True)
        
        return text.strip()
    
    def validate_text_length(self, text: str, field_name: str = "text") -> str:
        """Validate text length against limits"""
        if not text or not text.strip():
            raise ValidationError(f"{field_name} cannot be empty")
        
        text = text.strip()
        
        if len(text) < 10:
            raise ValidationError(f"{field_name} must be at least 10 characters long")
        
        if len(text) > self.settings.MAX_TEXT_LENGTH:
            raise ValidationError(
                f"{field_name} exceeds maximum length of {self.settings.MAX_TEXT_LENGTH} characters"
            )
        
        return text
    
    def validate_url(self, url: str) -> str:
        """Validate URL format and security"""
        if not url:
            raise ValidationError("URL cannot be empty")
        
        # Parse URL
        try:
            parsed = urlparse(str(url))
        except Exception:
            raise ValidationError("Invalid URL format")
        
        # Check scheme
        if parsed.scheme not in ['http', 'https']:
            raise ValidationError("Only HTTP and HTTPS URLs are allowed")
        
        # Check for localhost/private IPs in production
        if not self.settings.DEBUG:
            private_patterns = [
                r'^localhost$',
                r'^127\.',
                r'^192\.168\.',
                r'^10\.',
                r'^172\.(1[6-9]|2[0-9]|3[01])\.'
            ]
            
            for pattern in private_patterns:
                if re.match(pattern, parsed.hostname or ''):
                    raise ValidationError("Private/localhost URLs not allowed in production")
        
        return str(url)
    
    def validate_youtube_url(self, url: str) -> str:
        """Validate YouTube URL specifically"""
        url = self.validate_url(url)
        
        youtube_patterns = [
            r'^https?://(?:www\.)?youtube\.com/watch\?v=[\w-]+',
            r'^https?://youtu\.be/[\w-]+',
            r'^https?://(?:www\.)?youtube\.com/embed/[\w-]+',
        ]
        
        if not any(re.match(pattern, url) for pattern in youtube_patterns):
            raise ValidationError("Invalid YouTube URL format")
        
        return url
    
    def validate_file(self, file: UploadFile) -> UploadFile:
        """Validate uploaded file"""
        if not file:
            raise ValidationError("No file provided")
        
        if not file.filename:
            raise ValidationError("File must have a name")
        
        # Check file type
        if not is_file_type_supported(file.content_type or '', file.filename):
            raise ValidationError(
                f"Unsupported file type: {file.content_type}. "
                f"Supported types: PDF, DOCX, TXT, MD"
            )
        
        # Check file size
        if hasattr(file, 'size') and file.size:
            if not validate_file_size(file.size, self.settings.MAX_FILE_SIZE_MB):
                raise ValidationError(
                    f"File size exceeds limit of {self.settings.MAX_FILE_SIZE_MB}MB"
                )
        
        # Validate filename for security
        filename = file.filename
        if re.search(r'[<>:"/\\|?*]', filename):
            raise ValidationError("Filename contains invalid characters")
        
        if filename.startswith('.') or filename.endswith('.'):
            raise ValidationError("Invalid filename format")
        
        return file
    
    def validate_files(self, files: List[UploadFile]) -> List[UploadFile]:
        """Validate multiple files"""
        if not files:
            raise ValidationError("No files provided")
        
        if len(files) > self.settings.MAX_FILES_PER_REQUEST:
            raise ValidationError(
                f"Too many files. Maximum {self.settings.MAX_FILES_PER_REQUEST} files allowed"
            )
        
        validated_files = []
        total_size = 0
        
        for file in files:
            validated_file = self.validate_file(file)
            validated_files.append(validated_file)
            
            # Track total size
            if hasattr(file, 'size') and file.size:
                total_size += file.size
        
        # Check total size limit
        max_total_size = self.settings.MAX_FILE_SIZE_MB * len(files) * 1024 * 1024
        if total_size > max_total_size:
            raise ValidationError("Total file size exceeds limit")
        
        return validated_files
    
    def validate_summary_params(self, max_length: int, min_length: int) -> tuple[int, int]:
        """Validate summary length parameters"""
        if max_length < self.settings.MIN_SUMMARY_LENGTH:
            max_length = self.settings.MIN_SUMMARY_LENGTH
        
        if max_length > self.settings.MAX_SUMMARY_LENGTH:
            max_length = self.settings.MAX_SUMMARY_LENGTH
        
        if min_length < self.settings.MIN_SUMMARY_LENGTH:
            min_length = self.settings.MIN_SUMMARY_LENGTH
        
        if min_length >= max_length:
            min_length = max(max_length - 20, self.settings.MIN_SUMMARY_LENGTH)
        
        return max_length, min_length
    
    def validate_summary_type(self, summary_type: str) -> str:
        """Validate summary type parameter"""
        valid_types = ['comprehensive', 'bullet_points', 'story']
        if summary_type not in valid_types:
            raise ValidationError(f"Invalid summary type. Must be one of: {valid_types}")
        return summary_type
    
    def validate_summary_style(self, summary_style: str) -> str:
        """Validate summary style parameter"""
        valid_styles = ['brief', 'detailed', 'comprehensive']
        if summary_style not in valid_styles:
            raise ValidationError(f"Invalid summary style. Must be one of: {valid_styles}")
        return summary_style
    
    def validate_custom_prompt(self, custom_prompt: Optional[str]) -> Optional[str]:
        """Validate custom prompt"""
        if not custom_prompt:
            return None
        
        custom_prompt = self.sanitize_text(custom_prompt)
        
        if len(custom_prompt) > 1000:
            raise ValidationError("Custom prompt too long (max 1000 characters)")
        
        return custom_prompt
    
    def validate_tts_params(self, text: str, language: str, speed: float) -> tuple[str, str, float]:
        """Validate TTS parameters"""
        # Validate text
        text = self.validate_text_length(text, "TTS text")
        
        if len(text) > self.settings.MAX_TTS_LENGTH:
            raise ValidationError(f"Text too long for TTS (max {self.settings.MAX_TTS_LENGTH} characters)")
        
        # Validate language code
        valid_languages = [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 
            'ar', 'hi', 'nl', 'sv', 'no', 'da', 'fi', 'pl', 'tr', 'th'
        ]
        
        if language not in valid_languages:
            logger.warning(f"Unsupported language: {language}, using default")
            language = self.settings.TTS_DEFAULT_LANGUAGE
        
        # Validate speed
        if speed < 0.5 or speed > 2.0:
            raise ValidationError("TTS speed must be between 0.5 and 2.0")
        
        return text, language, speed

# Global validator instance
input_validator = InputValidator()

# Validation decorators and middleware
def validate_request_size(max_size_mb: int = None):
    """Decorator to validate request size"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # This would be implemented with FastAPI middleware
            # For now, just pass through
            return await func(*args, **kwargs)
        return wrapper
    return decorator

class SecurityHeaders:
    """Security headers middleware"""
    
    @staticmethod
    def add_security_headers(response):
        """Add security headers to response"""
        from config.settings import SECURITY_HEADERS
        
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value
        
        return response
