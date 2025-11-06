"""
Optimized Model Manager for SummarizePro
Consolidates all model management with GPU optimization and efficient memory usage
"""

import logging
import warnings
import torch
from transformers import (
    pipeline, AutoTokenizer, AutoModelForSeq2SeqLM, 
    BartTokenizer, BartForConditionalGeneration
)
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
from bertopic import BERTopic
import os
import gc
import psutil
from typing import Dict, Any, Optional
from functools import lru_cache

# Suppress transformers warnings
warnings.filterwarnings("ignore", message=".*max_length.*input_length.*")
warnings.filterwarnings("ignore", message=".*summarization task.*")
warnings.filterwarnings("ignore", category=UserWarning, module="transformers")
import transformers
transformers.logging.set_verbosity_error()

logger = logging.getLogger(__name__)

class OptimizedModelManager:
    """
    Optimized model manager with:
    - GPU acceleration when available
    - Memory-efficient loading
    - Model caching and cleanup
    - Fallback mechanisms
    - Performance monitoring
    """
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.device = self._get_optimal_device()
        self.torch_dtype = torch.float16 if self.device == "cuda" else torch.float32
        self.max_models_in_memory = int(os.getenv("MAX_MODELS_IN_MEMORY", "3"))
        self.model_load_order = []
        
        logger.info(f"OptimizedModelManager initialized")
        logger.info(f"Device: {self.device}")
        logger.info(f"Torch dtype: {self.torch_dtype}")
        logger.info(f"Max models in memory: {self.max_models_in_memory}")
        self._log_system_info()
    
    def _get_optimal_device(self) -> str:
        """Determine the best device for model inference"""
        if torch.cuda.is_available():
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            logger.info(f"CUDA available - GPU memory: {gpu_memory:.1f}GB")
            return "cuda"
        else:
            logger.info("CUDA not available, using CPU")
            return "cpu"
    
    def _log_system_info(self):
        """Log system information for debugging"""
        memory = psutil.virtual_memory()
        logger.info(f"System RAM: {memory.total / 1024**3:.1f}GB (Available: {memory.available / 1024**3:.1f}GB)")
        
        if self.device == "cuda":
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            logger.info(f"GPU: {torch.cuda.get_device_name(0)} ({gpu_memory:.1f}GB)")
    
    def _manage_memory(self, model_name: str):
        """Manage memory by unloading old models if needed"""
        if len(self.model_load_order) >= self.max_models_in_memory:
            # Remove oldest model
            oldest_model = self.model_load_order.pop(0)
            if oldest_model in self.models:
                logger.info(f"Unloading model: {oldest_model}")
                del self.models[oldest_model]
                gc.collect()
                if self.device == "cuda":
                    torch.cuda.empty_cache()
        
        # Add current model to load order
        if model_name in self.model_load_order:
            self.model_load_order.remove(model_name)
        self.model_load_order.append(model_name)
    
    def _load_model_with_fallback(self, model_name: str, task: str, fallback_model: str = None):
        """Load model with fallback mechanism"""
        try:
            logger.info(f"Loading {model_name} for {task}...")
            
            # Configure device and optimization
            device_id = 0 if self.device == "cuda" else -1
            
            model = pipeline(
                task,
                model=model_name,
                device=device_id,
                model_kwargs={
                    "torch_dtype": self.torch_dtype,
                    "low_cpu_mem_usage": True,
                    "use_cache": True
                }
            )
            
            logger.info(f"Successfully loaded {model_name}")
            return model
            
        except Exception as e:
            logger.error(f"Failed to load {model_name}: {str(e)}")
            
            if fallback_model:
                logger.info(f"Trying fallback model: {fallback_model}")
                try:
                    model = pipeline(
                        task,
                        model=fallback_model,
                        device=device_id,
                        model_kwargs={
                            "torch_dtype": self.torch_dtype,
                            "low_cpu_mem_usage": True
                        }
                    )
                    logger.info(f"Successfully loaded fallback model: {fallback_model}")
                    return model
                except Exception as fallback_error:
                    logger.error(f"Fallback model also failed: {str(fallback_error)}")
            
            raise Exception(f"Failed to load both primary and fallback models for {task}")
    
    # ============ SUMMARIZATION MODELS ============
    
    def get_text_summarizer(self):
        """DistilBART-CNN for efficient abstractive summarization"""
        model_name = "sshleifer/distilbart-cnn-12-6"  # Smaller CNN-trained model for abstractive summaries
        if model_name not in self.models:
            self._manage_memory(model_name)
            self.models[model_name] = self._load_model_with_fallback(
                model_name, 
                "summarization",
                fallback_model="facebook/bart-base"  # Fallback to base if distilbart fails
            )
        return self.models[model_name]
    
    def get_instruction_tuned_summarizer(self):
        """Get instruction-tuned model for better prompt following"""
        model_name = os.getenv("LLM_MODEL", "google/flan-t5-base")  # Use base model for memory efficiency
        if model_name not in self.models:
            self._manage_memory(model_name)
            try:
                # Try as text generation first for instruction-tuned models
                self.models[model_name] = self._load_model_with_fallback(
                    model_name,
                    "text2text-generation",
                    fallback_model="google/flan-t5-small"  # Smaller fallback
                )
            except:
                # Fallback to summarization task with smaller BART
                self.models[model_name] = self._load_model_with_fallback(
                    "facebook/bart-base",
                    "summarization", 
                    fallback_model="sshleifer/distilbart-cnn-12-6"
                )
        return self.models[model_name]
    
    def get_document_summarizer(self):
        """Same as text summarizer - BART handles documents well"""
        return self.get_text_summarizer()
    
    def get_url_summarizer(self):
        """Use DistilBART-CNN for URL summarization"""
        model_name = "sshleifer/distilbart-cnn-12-6"
        if model_name not in self.models:
            self._manage_memory(model_name)
            self.models[model_name] = self._load_model_with_fallback(
                model_name,
                "summarization",
                fallback_model="facebook/bart-base"
            )
        return self.models[model_name]
    
    def get_long_summarizer(self):
        """Long-T5 for long content like YouTube transcripts"""
        model_name = "google/long-t5-tglobal-base"
        if model_name not in self.models:
            self._manage_memory(model_name)
            self.models[model_name] = self._load_model_with_fallback(
                model_name,
                "summarization",
                fallback_model="facebook/bart-large-cnn"
            )
        return self.models[model_name]
    
    def get_multilingual_summarizer(self):
        """mBART for multilingual summarization"""
        model_name = "facebook/mbart-large-50-many-to-many-mmt"
        if model_name not in self.models:
            self._manage_memory(model_name)
            self.models[model_name] = self._load_model_with_fallback(
                model_name,
                "summarization",
                fallback_model="facebook/bart-large-cnn"
            )
        return self.models[model_name]
    
    # ============ SPEECH-TO-TEXT MODELS ============
    
    def get_whisper_model(self):
        """OpenAI Whisper for speech-to-text"""
        model_name = "openai/whisper-base"
        if model_name not in self.models:
            self._manage_memory(model_name)
            self.models[model_name] = self._load_model_with_fallback(
                model_name,
                "automatic-speech-recognition",
                fallback_model="openai/whisper-tiny"
            )
        return self.models[model_name]
    
    # ============ ANALYSIS MODELS ============
    
    @lru_cache(maxsize=1)
    def get_keybert_model(self):
        """KeyBERT for keyword extraction"""
        try:
            logger.info("Loading KeyBERT model...")
            model = KeyBERT(model='all-MiniLM-L6-v2')
            logger.info("Successfully loaded KeyBERT")
            return model
        except Exception as e:
            logger.error(f"Failed to load KeyBERT: {str(e)}")
            # Simple fallback
            return None
    
    @lru_cache(maxsize=1)
    def get_bertopic_model(self):
        """BERTopic for topic modeling"""
        try:
            logger.info("Loading BERTopic model...")
            model = BERTopic(
                embedding_model='all-MiniLM-L6-v2',
                calculate_probabilities=True,
                verbose=False
            )
            logger.info("Successfully loaded BERTopic")
            return model
        except Exception as e:
            logger.error(f"Failed to load BERTopic: {str(e)}")
            return None
    
    def get_sentiment_model(self):
        """Sentiment analysis model"""
        model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
        if model_name not in self.models:
            self._manage_memory(model_name)
            self.models[model_name] = self._load_model_with_fallback(
                model_name,
                "sentiment-analysis",
                fallback_model="distilbert-base-uncased-finetuned-sst-2-english"
            )
        return self.models[model_name]
    
    # ============ Q&A MODELS ============
    
    def get_qa_model(self):
        """English Q&A model"""
        model_name = "deepset/roberta-base-squad2"
        if model_name not in self.models:
            self._manage_memory(model_name)
            self.models[model_name] = self._load_model_with_fallback(
                model_name,
                "question-answering",
                fallback_model="distilbert-base-cased-distilled-squad"
            )
        return self.models[model_name]
    
    def get_multilingual_qa_model(self):
        """Multilingual Q&A model"""
        model_name = "deepset/xlm-roberta-base-squad2"
        if model_name not in self.models:
            self._manage_memory(model_name)
            self.models[model_name] = self._load_model_with_fallback(
                model_name,
                "question-answering",
                fallback_model="deepset/roberta-base-squad2"
            )
        return self.models[model_name]
    
    # ============ UTILITY METHODS ============
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models"""
        return {
            "device": self.device,
            "torch_dtype": str(self.torch_dtype),
            "loaded_models": list(self.models.keys()),
            "model_count": len(self.models),
            "max_models": self.max_models_in_memory,
            "load_order": self.model_load_order.copy()
        }
    
    def clear_cache(self):
        """Clear all cached models"""
        logger.info("Clearing model cache...")
        self.models.clear()
        self.model_load_order.clear()
        gc.collect()
        if self.device == "cuda":
            torch.cuda.empty_cache()
        logger.info("Model cache cleared")
    
    def get_memory_usage(self) -> Dict[str, float]:
        """Get current memory usage"""
        memory = psutil.virtual_memory()
        result = {
            "system_ram_total_gb": memory.total / 1024**3,
            "system_ram_used_gb": memory.used / 1024**3,
            "system_ram_available_gb": memory.available / 1024**3,
            "system_ram_percent": memory.percent
        }
        
        if self.device == "cuda":
            gpu_memory = torch.cuda.get_device_properties(0).total_memory
            gpu_allocated = torch.cuda.memory_allocated(0)
            gpu_cached = torch.cuda.memory_reserved(0)
            
            result.update({
                "gpu_total_gb": gpu_memory / 1024**3,
                "gpu_allocated_gb": gpu_allocated / 1024**3,
                "gpu_cached_gb": gpu_cached / 1024**3,
                "gpu_free_gb": (gpu_memory - gpu_cached) / 1024**3
            })
        
        return result

# Global instance
model_manager = OptimizedModelManager()
