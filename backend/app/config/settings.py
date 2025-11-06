"""
Configuration management for SummarizePro
Handles environment variables, model settings, and application configuration
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from pydantic_settings import BaseSettings
from pydantic import field_validator
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    API_LOG_LEVEL: str = "info"
    
    # CORS Settings
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    CORS_ALLOW_CREDENTIALS: bool = True
    
    # Model Configuration
    MODEL_CACHE_DIR: Optional[str] = None
    MAX_MODELS_IN_MEMORY: int = 3
    MODEL_DEVICE: str = "auto"  # auto, cpu, cuda
    USE_QUANTIZATION: bool = True
    LLM_MODEL: str = "google/flan-t5-base"  # Instruction-tuned model for custom prompts
    
    # Content Processing Limits
    MAX_TEXT_LENGTH: int = 50000
    MAX_FILE_SIZE_MB: int = 50
    MAX_FILES_PER_REQUEST: int = 10
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # Summary Settings
    DEFAULT_MAX_LENGTH: int = 150
    DEFAULT_MIN_LENGTH: int = 50
    MAX_SUMMARY_LENGTH: int = 500
    MIN_SUMMARY_LENGTH: int = 20
    
    # TTS Settings
    MAX_TTS_LENGTH: int = 5000
    TTS_DEFAULT_LANGUAGE: str = "en"
    TTS_CACHE_ENABLED: bool = True
    
    # Export Settings
    EXPORT_TEMP_DIR: Optional[str] = None
    EXPORT_CLEANUP_INTERVAL: int = 3600  # seconds
    
    # Security Settings
    ENABLE_RATE_LIMITING: bool = False
    RATE_LIMIT_PER_MINUTE: int = 60
    SANITIZE_INPUTS: bool = True
    
    # Caching Configuration
    REDIS_URL: Optional[str] = None
    CACHE_TTL: int = 3600  # seconds
    ENABLE_RESULT_CACHING: bool = False
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE: Optional[str] = "app.log"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Development Settings
    DEBUG: bool = False
    TESTING: bool = False
    
    @field_validator('MODEL_CACHE_DIR')
    @classmethod
    def validate_cache_dir(cls, v):
        if v is None:
            return str(Path.home() / ".cache" / "summarizepro")
        return v
    
    @field_validator('EXPORT_TEMP_DIR')
    @classmethod
    def validate_temp_dir(cls, v):
        if v is None:
            return str(Path.cwd() / "temp")
        return v
    
    @field_validator('MAX_FILE_SIZE_MB')
    @classmethod
    def validate_file_size(cls, v):
        if v > 100:
            logger.warning(f"Large file size limit: {v}MB. Consider reducing for better performance.")
        return v
    
    def get_cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, list) else []
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True
    }

# Model-specific configurations
MODEL_CONFIGS = {
    "text_summarizer": {
        "model_name": "google/flan-t5-xl",
        "fallbacks": ["google/flan-t5-large", "google/flan-t5-base"],
        "task": "text2text-generation",
        "max_length": 1024,
        "min_length": 50,
        "do_sample": False,
        "temperature": 0.7,
        "top_p": 0.9
    },
    "document_summarizer": {
        "model_name": "facebook/bart-large-cnn",
        "fallbacks": ["facebook/bart-base"],
        "task": "summarization",
        "max_length": 1024,
        "min_length": 50,
        "length_penalty": 2.0,
        "num_beams": 4,
        "early_stopping": True
    },
    "url_summarizer": {
        "model_name": "google/pegasus-xsum",
        "fallbacks": ["facebook/bart-large-cnn"],
        "task": "summarization",
        "max_length": 512,
        "min_length": 30,
        "length_penalty": 1.0,
        "num_beams": 4
    },
    "long_summarizer": {
        "model_name": "google/long-t5-tglobal-base",
        "fallbacks": ["google/flan-t5-base"],
        "task": "text2text-generation",
        "max_length": 2048,
        "min_length": 100
    },
    "qa_model": {
        "model_name": "deepset/roberta-base-squad2",
        "fallbacks": ["distilbert-base-cased-distilled-squad"],
        "task": "question-answering",
        "max_answer_len": 512,
        "max_seq_len": 384,
        "doc_stride": 128
    },
    "sentiment_model": {
        "model_name": "cardiffnlp/twitter-roberta-base-sentiment-latest",
        "fallbacks": ["distilbert-base-uncased-finetuned-sst-2-english"],
        "task": "sentiment-analysis",
        "return_all_scores": True
    }
}

# File type configurations
SUPPORTED_FILE_TYPES = {
    "text/plain": [".txt"],
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/msword": [".doc"],
    "text/markdown": [".md"],
    "text/csv": [".csv"]
}

# URL validation patterns
ALLOWED_URL_PATTERNS = [
    r"^https?://.*",  # HTTP/HTTPS URLs
    r"^https://www\.youtube\.com/watch\?v=.*",  # YouTube videos
    r"^https://youtu\.be/.*",  # YouTube short URLs
    r"^https://.*\.pdf$",  # Direct PDF links
]

# Security configurations
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}

# Rate limiting configurations
RATE_LIMIT_RULES = {
    "/api/v1/summarize/*": "10/minute",
    "/api/v1/qa/*": "20/minute",
    "/api/v1/export/*": "5/minute",
    "/api/v1/tts/*": "3/minute"
}

def get_settings() -> Settings:
    """Get application settings instance"""
    return Settings()

def get_model_config(model_type: str) -> Dict[str, Any]:
    """Get configuration for specific model type"""
    return MODEL_CONFIGS.get(model_type, {})

def is_file_type_supported(content_type: str, filename: str) -> bool:
    """Check if file type is supported"""
    if content_type in SUPPORTED_FILE_TYPES:
        return True
    
    # Check by file extension
    file_ext = Path(filename).suffix.lower()
    for supported_extensions in SUPPORTED_FILE_TYPES.values():
        if file_ext in supported_extensions:
            return True
    
    return False

def validate_file_size(file_size: int, max_size_mb: int) -> bool:
    """Validate file size against limits"""
    max_size_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_size_bytes

def get_chunk_settings(content_length: int) -> Dict[str, int]:
    """Get optimal chunk settings based on content length"""
    settings = get_settings()
    
    if content_length < 2000:
        return {"chunk_size": content_length, "chunk_overlap": 0}
    elif content_length < 10000:
        return {"chunk_size": 1500, "chunk_overlap": 150}
    else:
        return {"chunk_size": settings.CHUNK_SIZE, "chunk_overlap": settings.CHUNK_OVERLAP}

# Global settings instance
settings = get_settings()
