"""
Speech-to-Text Service (OpenAI Whisper)
Handles YouTube video transcription and audio processing
"""

import logging
import yt_dlp
import tempfile
import os
import asyncio
import subprocess
import re
from typing import Dict, Any, Optional
from urllib.parse import urlparse, parse_qs

logger = logging.getLogger(__name__)

class SpeechToTextService:
    """Handles YouTube transcription using Whisper"""
    
    def __init__(self):
        self.whisper_model = None
    
    def is_youtube_url(self, url: str) -> bool:
        """Validate YouTube URL"""
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/)',
            r'youtube\.com\/.*[?&]v='
        ]
        return any(re.search(p, url, re.IGNORECASE) for p in patterns)
    
    async def extract_transcript(self, youtube_url: str) -> Dict[str, Any]:
        """Extract transcript from YouTube video"""
        try:
            # Get video info
            video_info = await self._get_video_info(youtube_url)
            
            # Try to get captions first
            transcript = await self._get_captions(video_info)
            
            # If no captions, transcribe audio with Whisper
            if not transcript:
                logger.info("No captions found, using Whisper transcription")
                transcript = await self._transcribe_audio(youtube_url, video_info['id'])
            
            return {
                'title': video_info['title'],
                'transcript': transcript,
                'duration': video_info['duration'],
                'video_id': video_info['id'],
                'url': youtube_url,
                'word_count': len(transcript.split())
            }
        except Exception as e:
            logger.error(f"Error extracting YouTube transcript: {str(e)}")
            raise
    
    async def _get_video_info(self, url: str) -> Dict[str, Any]:
        """Get YouTube video metadata"""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'extractor_args': {
                'youtube': {
                    'player_client': ['android'],
                    'skip': ['dash', 'hls'],
                }
            },
            'http_headers': {
                'User-Agent': 'com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) gzip',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-us,en;q=0.5',
                'Sec-Fetch-Mode': 'navigate',
            },
        }
        
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(
            None,
            lambda: yt_dlp.YoutubeDL(ydl_opts).extract_info(url, download=False)
        )
        
        return {
            'title': info.get('title', 'Unknown'),
            'duration': info.get('duration', 0),
            'id': info.get('id', ''),
            'captions': info.get('automatic_captions', {}),
            'subtitles': info.get('subtitles', {})
        }
    
    async def _get_captions(self, video_info: Dict[str, Any]) -> Optional[str]:
        """Try to get automatic captions with fallback"""
        # Try multiple languages
        languages = ['en', 'en-US', 'en-GB', 'en-IN']
        
        for lang in languages:
            # Check automatic captions
            if lang in video_info['captions']:
                for caption in video_info['captions'][lang]:
                    if caption.get('ext') == 'vtt':
                        transcript = await self._download_vtt(caption['url'])
                        if transcript:
                            logger.info(f"Successfully retrieved captions in {lang}")
                            return transcript
            
            # Check manual subtitles
            if lang in video_info['subtitles']:
                for subtitle in video_info['subtitles'][lang]:
                    if subtitle.get('ext') == 'vtt':
                        transcript = await self._download_vtt(subtitle['url'])
                        if transcript:
                            logger.info(f"Successfully retrieved subtitles in {lang}")
                            return transcript
        
        logger.warning("No captions found in any language")
        return None
    
    async def _download_vtt(self, url: str) -> str:
        """Download and parse VTT captions"""
        try:
            import requests
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Parse VTT
            lines = response.text.split('\n')
            transcript_lines = []
            
            for line in lines:
                line = line.strip()
                if (line and 
                    not line.startswith('WEBVTT') and 
                    not line.startswith('NOTE') and 
                    '-->' not in line and 
                    not line.isdigit()):
                    # Remove HTML tags
                    clean_line = re.sub(r'<[^>]+>', '', line)
                    if clean_line:
                        transcript_lines.append(clean_line)
            
            return ' '.join(transcript_lines)
        except Exception as e:
            logger.error(f"Error downloading VTT: {str(e)}")
            return ""
    
    async def _transcribe_audio(self, url: str, video_id: str) -> str:
        """Transcribe audio using OpenAI Whisper"""
        # Check FFmpeg availability
        try:
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("FFmpeg not found. Please install FFmpeg.")
            raise RuntimeError(
                "FFmpeg is required for audio transcription but is not installed. "
                "Please install it:\n"
                "Windows: choco install ffmpeg (or winget install ffmpeg)\n"
                "Linux: sudo apt install ffmpeg\n"
                "Mac: brew install ffmpeg\n"
                "Download: https://ffmpeg.org/download.html"
            )
        
        audio_file = None
        try:
            # Download audio
            temp_dir = tempfile.mkdtemp()
            audio_file = os.path.join(temp_dir, f"{video_id}.mp3")
            
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': audio_file,
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'quiet': True,
                'no_warnings': True,
                'nocheckcertificate': True,
                'geo_bypass': True,
                'extractor_args': {
                    'youtube': {
                        'player_client': ['android'],
                        'skip': ['dash', 'hls'],
                    }
                },
                'http_headers': {
                    'User-Agent': 'com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) gzip',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-us,en;q=0.5',
                    'Sec-Fetch-Mode': 'navigate',
                },
            }
            
            logger.info(f"Downloading audio for {video_id}")
            loop = asyncio.get_event_loop()
            
            # Try downloading with retry logic
            download_success = False
            last_error = None
            
            # Try different player clients if first attempt fails
            player_clients = [
                ['android'],         # Android client (best for bypassing restrictions)
                ['android', 'web'],  # Android + web fallback
                ['ios'],             # iOS client
            ]
            
            for attempt, clients in enumerate(player_clients, 1):
                try:
                    ydl_opts['extractor_args']['youtube']['player_client'] = clients
                    logger.info(f"Download attempt {attempt}/3 using player clients: {clients}")
                    
                    await loop.run_in_executor(
                        None,
                        lambda opts=ydl_opts.copy(): yt_dlp.YoutubeDL(opts).download([url])
                    )
                    
                    if os.path.exists(audio_file):
                        download_success = True
                        logger.info(f"Audio download successful on attempt {attempt}")
                        break
                except Exception as e:
                    last_error = str(e)
                    logger.warning(f"Download attempt {attempt} failed: {last_error}")
                    if attempt < len(player_clients):
                        await asyncio.sleep(1)  # Wait before retry
            
            if not download_success:
                raise RuntimeError(f"Audio download failed after {len(player_clients)} attempts. Last error: {last_error}")
            
            # Transcribe with Whisper
            logger.info("Transcribing with Whisper")
            whisper_model = self._get_whisper_model()
            
            result = await loop.run_in_executor(
                None,
                lambda: whisper_model(audio_file)
            )
            
            return result.get('text', '')
        
        finally:
            # Cleanup
            if audio_file and os.path.exists(audio_file):
                try:
                    os.unlink(audio_file)
                    temp_dir = os.path.dirname(audio_file)
                    if os.path.exists(temp_dir) and not os.listdir(temp_dir):
                        os.rmdir(temp_dir)
                except Exception as e:
                    logger.warning(f"Cleanup failed: {str(e)}")
    
    def _get_whisper_model(self):
        """Lazy load OpenAI Whisper model for speech-to-text"""
        if self.whisper_model is None:
            try:
                from transformers import pipeline
                import torch
                
                logger.info("Loading OpenAI Whisper model for speech-to-text...")
                device = 0 if torch.cuda.is_available() else -1
                torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
                
                self.whisper_model = pipeline(
                    "automatic-speech-recognition",
                    model="openai/whisper-base",
                    device=device,
                    torch_dtype=torch_dtype,
                    chunk_length_s=30,  # Process in 30-second chunks
                    return_timestamps=False
                )
                logger.info("✓ OpenAI Whisper model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load Whisper model: {str(e)}")
                raise
        
        return self.whisper_model

# Global instance
speech_to_text = SpeechToTextService()
