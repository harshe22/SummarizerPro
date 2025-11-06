"""
Summarization API Routes - Refactored to match architecture diagram
Handles all summarization endpoints with modular service architecture
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
import logging
import tempfile
import os
from pathlib import Path

from app.services.tokenizer import tokenizer_service
from app.services.text_extractor import text_extractor
from app.services.content_extractor import content_extractor
from app.services.speech_to_text import speech_to_text
from app.services.summarizer import summarizer
from app.services.analysis import analysis_service

logger = logging.getLogger(__name__)
router = APIRouter()

# ============ REQUEST/RESPONSE MODELS ============

class TextSummarizeRequest(BaseModel):
    text: str
    max_length: Optional[int] = None  # Will use adaptive calculation
    min_length: Optional[int] = None  # Will use adaptive calculation
    summary_type: Optional[str] = "comprehensive"
    summary_style: Optional[str] = "comprehensive"
    custom_prompt: Optional[str] = None

class URLSummarizeRequest(BaseModel):
    url: HttpUrl
    max_length: Optional[int] = None  # Will use adaptive calculation
    min_length: Optional[int] = None  # Will use adaptive calculation
    summary_type: Optional[str] = "comprehensive"
    summary_style: Optional[str] = "comprehensive"
    custom_prompt: Optional[str] = None

class YoutubeSummarizeRequest(BaseModel):
    url: HttpUrl
    max_length: Optional[int] = None  # Will use adaptive calculation
    min_length: Optional[int] = None  # Will use adaptive calculation
    summary_type: Optional[str] = "comprehensive"
    summary_style: Optional[str] = "comprehensive"
    custom_prompt: Optional[str] = None

class SummaryResponse(BaseModel):
    summary: str
    keywords: List[str]
    topics: List[Dict[str, Any]]
    sentiment: Dict[str, Any]
    metadata: Dict[str, Any]

# ============ ENDPOINTS ============

@router.post("/summarize/text", response_model=SummaryResponse)
async def summarize_text_endpoint(request: TextSummarizeRequest):
    """Summarize plain text using DistilBART-CNN"""
    try:
        logger.info("Processing text summarization")
        
        if not request.text or len(request.text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Text is too short or empty")
        
        # Generate summary
        summary = summarizer.summarize_text(
            request.text,
            summary_style=request.summary_style,
            custom_prompt=request.custom_prompt
        )
        
        # Step 3: Analysis (KeyBERT, BERTopic, Sentiment)
        analysis = analysis_service.full_analysis(request.text)
        
        # Step 4: Metadata
        metadata = {
            'original_word_count': len(request.text.split()),
            'summary_word_count': len(summary.split()),
            'compression_ratio': summarizer.calculate_compression_ratio(request.text, summary),
            'reading_time_minutes': summarizer.calculate_reading_time(summary),
            'content_type': 'text',
            'summary_style': request.summary_style,
            'custom_prompt_used': bool(request.custom_prompt)
        }
        
        return SummaryResponse(
            summary=summary,
            keywords=analysis['keywords'],
            topics=analysis['topics'],
            sentiment=analysis['sentiment'],
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text summarization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@router.post("/summarize/document", response_model=SummaryResponse)
async def summarize_document_endpoint(
    files: List[UploadFile] = File(...),
    summary_style: str = Form("comprehensive"),
    custom_prompt: Optional[str] = Form(None)
):
    """Summarize documents (PDF, DOCX, TXT) using DistilBART-CNN"""
    try:
        logger.info(f"Processing {len(files)} document(s)")
        
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Step 1: Text Extraction & Structure
        combined_text = ""
        processed_files = []
        
        for file in files:
            if not file.filename:
                continue
            
            file_extension = Path(file.filename).suffix.lower()
            if file_extension not in text_extractor.supported_formats:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file_extension}"
                )
            
            # Save temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_file_path = temp_file.name
            
            try:
                # Extract text
                file_type = file_extension[1:]
                extraction_result = await text_extractor.extract(temp_file_path, file_type)
                
                if extraction_result['text'].strip():
                    combined_text += f"\n\n{extraction_result['text']}"
                    processed_files.append(file.filename)
            finally:
                os.unlink(temp_file_path)
        
        if not combined_text.strip():
            raise HTTPException(status_code=400, detail="No text extracted from files")
        
        if len(combined_text.split()) < 10:
            raise HTTPException(status_code=400, detail="Extracted text too short")
        
        # Step 2: Summarization
        summary = summarizer.summarize_document(
            combined_text,
            summary_style=summary_style
        )
        
        # Step 3: Analysis (optimized for large documents)
        # For large documents, limit analysis to prevent timeouts
        analysis_text = combined_text[:5000] if len(combined_text) > 5000 else combined_text
        logger.info(f"Running analysis on {len(analysis_text)} characters (truncated from {len(combined_text)})")
        
        try:
            analysis = analysis_service.full_analysis(analysis_text)
        except Exception as analysis_error:
            logger.warning(f"Analysis failed, using fallback: {analysis_error}")
            # Fallback analysis if full analysis fails
            analysis = {
                'keywords': [],
                'topics': [],
                'sentiment': {'label': 'neutral', 'score': 0.0}
            }
        
        # Step 4: Metadata
        metadata = {
            'original_word_count': len(combined_text.split()),
            'summary_word_count': len(summary.split()),
            'compression_ratio': summarizer.calculate_compression_ratio(combined_text, summary),
            'reading_time_minutes': summarizer.calculate_reading_time(summary),
            'content_type': 'document',
            'summary_style': summary_style,
            'files_processed': processed_files
        }
        
        return SummaryResponse(
            summary=summary,
            keywords=analysis['keywords'],
            topics=analysis['topics'],
            sentiment=analysis['sentiment'],
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document summarization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document summarization failed: {str(e)}")

@router.post("/summarize/url", response_model=SummaryResponse)
async def summarize_url_endpoint(request: URLSummarizeRequest):
    """Summarize web article using Pegasus-XSUM"""
    try:
        logger.info(f"Processing URL: {request.url}")
        
        # Step 1: Content Extraction & Preprocessing
        url_content = await content_extractor.extract_from_url(str(request.url))
        
        if not url_content['content'].strip():
            raise HTTPException(status_code=400, detail="No content extracted from URL")
        
        if len(url_content['content'].split()) < 10:
            raise HTTPException(status_code=400, detail="URL content too short")
        
        # Step 2: Summarization
        summary_text = summarizer.summarize_url(
            url_content['content'],
            summary_style=request.summary_style
        )
        
        # Step 3: Analysis
        analysis = analysis_service.full_analysis(url_content['content'])
        
        # Step 4: Metadata
        metadata = {
            'original_word_count': url_content['word_count'],
            'summary_word_count': len(summary_text.split()),
            'compression_ratio': summarizer.calculate_compression_ratio(url_content['content'], summary_text),
            'reading_time_minutes': summarizer.calculate_reading_time(summary_text),
            'content_type': 'url',
            'summary_style': request.summary_style,
            'source_url': str(request.url),
            'source_title': url_content['title']
        }
        
        return SummaryResponse(
            summary=summary_text,
            keywords=analysis['keywords'],
            topics=analysis['topics'],
            sentiment=analysis['sentiment'],
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL summarization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"URL summarization failed: {str(e)}")

@router.post("/summarize/youtube", response_model=SummaryResponse)
async def summarize_youtube_endpoint(request: YoutubeSummarizeRequest):
    """Summarize YouTube video using Speech-to-Text (Whisper) + Long-T5-TGlobal"""
    try:
        logger.info(f"Processing YouTube: {request.url}")
        
        # Validate YouTube URL
        if not speech_to_text.is_youtube_url(str(request.url)):
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
        # Step 1: Speech-to-Text (OpenAI Whisper)
        youtube_content = await speech_to_text.extract_transcript(str(request.url))
        
        if not youtube_content['transcript'].strip():
            raise HTTPException(status_code=400, detail="No transcript available")
        
        if len(youtube_content['transcript'].split()) < 10:
            raise HTTPException(status_code=400, detail="Transcript too short")
        
        # Step 2: Summarization
        summary_text = summarizer.summarize_youtube(
            youtube_content['transcript'],
            summary_style=request.summary_style
        )
        
        # Step 3: Analysis
        analysis = analysis_service.full_analysis(youtube_content['transcript'])
        
        # Step 4: Metadata
        metadata = {
            'original_word_count': youtube_content['word_count'],
            'summary_word_count': len(summary_text.split()),
            'compression_ratio': summarizer.calculate_compression_ratio(youtube_content['transcript'], summary_text),
            'reading_time_minutes': summarizer.calculate_reading_time(summary_text),
            'content_type': 'youtube',
            'summary_style': request.summary_style,
            'video_title': youtube_content['title'],
            'video_duration': youtube_content['duration'],
            'video_id': youtube_content['video_id'],
            'source_url': str(request.url)
        }
        
        return SummaryResponse(
            summary=summary_text,
            keywords=analysis['keywords'],
            topics=analysis['topics'],
            sentiment=analysis['sentiment'],
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"YouTube summarization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"YouTube summarization failed: {str(e)}")

@router.post("/summarize/multilingual", response_model=SummaryResponse)
async def summarize_multilingual_endpoint(request: TextSummarizeRequest):
    """Summarize multilingual text using mBART-Large-50"""
    try:
        logger.info("Processing multilingual text")
        
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Step 1: Preprocessing
        preprocessed = tokenizer_service.preprocess_text(request.text)
        
        # Step 2: Summarization
        summary_text = summarizer.summarize_multilingual(
            preprocessed['text'],
            summary_style=request.summary_style
        )
        
        # Step 3: Analysis
        analysis = analysis_service.full_analysis(preprocessed['text'])
        
        # Step 4: Metadata
        metadata = {
            'original_word_count': preprocessed['word_count'],
            'summary_word_count': len(summary_text.split()),
            'compression_ratio': summarizer.calculate_compression_ratio(preprocessed['text'], summary_text),
            'reading_time_minutes': summarizer.calculate_reading_time(summary_text),
            'content_type': 'multilingual_text',
            'summary_style': request.summary_style
        }
        
        return SummaryResponse(
            summary=summary_text,
            keywords=analysis['keywords'],
            topics=analysis['topics'],
            sentiment=analysis['sentiment'],
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multilingual summarization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Multilingual summarization failed: {str(e)}")
