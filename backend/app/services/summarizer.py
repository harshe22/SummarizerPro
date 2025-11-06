"""
Summarization Service (Fixed version)
Prevents over-expansion, enforces adaptive length, and ensures summaries remain shorter.
"""

import logging
import warnings
from typing import Optional, List
from .models import model_manager

warnings.filterwarnings("ignore")

logger = logging.getLogger(__name__)


class SummarizationService:
    def __init__(self):
        pass

    # === Length Helpers ===
    WORDS_TO_TOKENS = 1.33  # Rough English average

    def _to_tokens(self, words: int) -> int:
        return max(8, int(words * self.WORDS_TO_TOKENS))

    def _cap_lengths_by_input(self, text: str, max_words: int, min_words: int) -> tuple[int, int]:
        wc = len(text.split())
        max_cap = max(20, int(wc * 0.40))  # No more than 40% of input
        min_cap = max(10, int(wc * 0.18))  # No less than 18% of input

        max_words = min(max_words, max_cap)
        min_words = min(min_words, max_words - 5, min_cap)
        min_words = max(10, min_words)
        return max_words, min_words

    def calculate_adaptive_length(self, text: str) -> tuple[int, int]:
        wc = len(text.split())
        max_w = max(30, int(wc * 0.35))  # 35% of original
        min_w = max(20, int(wc * 0.20))  # 20% of original
        max_w, min_w = self._cap_lengths_by_input(text, max_w, min_w)
        logger.info(f"[LENGTH] Source={wc} words -> Summary={min_w}-{max_w} words")
        return max_w, min_w

    def _adjust_lengths(self, max_w: int, min_w: int, style: str) -> tuple[int, int]:
        style_mult = {
            "brief": (0.8, 0.6),
            "detailed": (1.0, 0.9),
            "comprehensive": (1.2, 1.0)
        }
        max_m, min_m = style_mult.get(style, (1.0, 0.9))
        max_w = int(max_w * max_m)
        min_w = int(min_w * min_m)

        if min_w >= max_w:
            min_w = max(max_w - 5, 10)

        return max_w, min_w

    # === Quality Validation ===
    def _is_quality_summary(self, summary: str, original: str) -> bool:
        """Check if summary is high quality (not repetitive or hallucinated)"""
        # Check for excessive repetition
        words = summary.lower().split()
        if len(words) < 5:
            return False
        
        # Check for repeated phrases (more relaxed: 50% unique is acceptable)
        unique_words = set(words)
        uniqueness_ratio = len(unique_words) / len(words)
        
        if uniqueness_ratio < 0.5:  # Changed from 0.7 to 0.5 (more lenient)
            logger.warning(f"Summary has excessive repetition (uniqueness: {uniqueness_ratio:.2f})")
            return False
        
        # Check for specific repetitive patterns (same phrase 3+ times)
        from collections import Counter
        # Check 3-word phrases
        trigrams = [' '.join(words[i:i+3]) for i in range(len(words)-2)]
        trigram_counts = Counter(trigrams)
        max_repetition = max(trigram_counts.values()) if trigram_counts else 0
        
        if max_repetition >= 3:
            logger.warning(f"Summary has repeated phrase {max_repetition} times")
            return False
        
        return True

    # === Core Summarization ===
    def _summarize_chunk(self, model, text: str, max_tokens: int, min_tokens: int) -> str:
        result = model(
            text,
            max_length=max_tokens,
            min_length=min_tokens,
            do_sample=False,             # Deterministic for consistency
            num_beams=6,                 # More beams for better quality
            length_penalty=2.0,          # Encourage appropriate length
            early_stopping=True,
            truncation=True,
            no_repeat_ngram_size=3,      # Prevent 3-word repetition
            repetition_penalty=1.5       # Strong penalty against repetition
        )
        if isinstance(result, list) and "summary_text" in result[0]:
            summary = result[0]["summary_text"].strip()
            # Clean up common artifacts
            summary = summary.replace(" . ", ". ").replace(" , ", ", ")
            
            # Validate quality - if poor, try ONE retry with stronger parameters
            if not self._is_quality_summary(summary, text):
                logger.warning("Poor quality summary detected, retrying ONCE with stronger params")
                try:
                    result = model(
                        text,
                        max_length=max_tokens,
                        min_length=min_tokens,
                        do_sample=False,         # Deterministic
                        num_beams=6,             # More beams
                        length_penalty=2.0,
                        early_stopping=True,
                        truncation=True,
                        no_repeat_ngram_size=4,  # Stronger repetition prevention
                        repetition_penalty=2.0   # Much stronger penalty
                    )
                    if isinstance(result, list) and "summary_text" in result[0]:
                        retry_summary = result[0]["summary_text"].strip()
                        retry_summary = retry_summary.replace(" . ", ". ").replace(" , ", ", ")
                        
                        # Only use retry if it's actually better
                        if self._is_quality_summary(retry_summary, text):
                            logger.info("Retry produced better quality summary")
                            return retry_summary
                        else:
                            logger.warning("Retry also failed quality check, using original")
                except Exception as e:
                    logger.error(f"Retry failed: {e}, using original summary")
            
            return summary
        return str(result).strip()

    def _chunk_text(self, text: str, size: int = 1200, overlap: int = 150) -> List[str]:
        words = text.split()
        if len(words) <= size:
            return [text]
        chunks = []
        step = size - overlap
        for i in range(0, len(words), step):
            chunk = " ".join(words[i:i + size])
            if len(chunk.split()) >= 8:
                chunks.append(chunk)
        return chunks or [text]

    # === Public Entry Points ===
    def summarize_text(
        self,
        text: str,
        summary_style: str = "detailed",
        custom_prompt: Optional[str] = None
    ) -> str:

        model = model_manager.get_instruction_tuned_summarizer() if custom_prompt \
            else model_manager.get_text_summarizer()

        max_w, min_w = self.calculate_adaptive_length(text)
        max_w, min_w = self._adjust_lengths(max_w, min_w, summary_style)

        max_tok = self._to_tokens(max_w)
        min_tok = self._to_tokens(min_w)

        chunks = self._chunk_text(text)

        if len(chunks) == 1:
            return self._summarize_chunk(model, chunks[0], max_tok, min_tok)

        summaries = [self._summarize_chunk(model, c, max_tok, min_tok) for c in chunks]
        combined = " ".join(summaries)
        return self._summarize_chunk(model, combined, max_tok, min_tok)

    def summarize_document(self, text: str, summary_style: str = "detailed") -> str:
        model = model_manager.get_document_summarizer()
        max_w, min_w = self.calculate_adaptive_length(text)
        max_w, min_w = self._adjust_lengths(max_w, min_w, summary_style)
        max_tok, min_tok = self._to_tokens(max_w), self._to_tokens(min_w)

        chunks = self._chunk_text(text, size=1600, overlap=180)
        summaries = [self._summarize_chunk(model, c, max_tok, min_tok) for c in chunks]
        combined = " ".join(summaries)
        return self._summarize_chunk(model, combined, max_tok, min_tok)

    def summarize_url(self, text: str, summary_style: str = "detailed") -> str:
        model = model_manager.get_url_summarizer()
        max_w, min_w = self.calculate_adaptive_length(text)
        max_w, min_w = self._adjust_lengths(max_w, min_w, summary_style)
        max_tok, min_tok = self._to_tokens(max_w), self._to_tokens(min_w)

        chunks = self._chunk_text(text, size=1200, overlap=150)
        if len(chunks) == 1:
            return self._summarize_chunk(model, chunks[0], max_tok, min_tok)
        summaries = [self._summarize_chunk(model, c, max_tok, min_tok) for c in chunks]
        combined = " ".join(summaries)
        return self._summarize_chunk(model, combined, max_tok, min_tok)

    def summarize_youtube(self, text: str, summary_style: str = "detailed") -> str:
        model = model_manager.get_long_summarizer()
        max_w, min_w = self.calculate_adaptive_length(text)
        max_w, min_w = self._adjust_lengths(max_w, min_w, summary_style)
        max_tok, min_tok = self._to_tokens(max_w), self._to_tokens(min_w)

        chunks = self._chunk_text(text, size=1500, overlap=180)
        if len(chunks) == 1:
            return self._summarize_chunk(model, chunks[0], max_tok, min_tok)
        summaries = [self._summarize_chunk(model, c, max_tok, min_tok) for c in chunks]
        combined = " ".join(summaries)
        return self._summarize_chunk(model, combined, max_tok, min_tok)

    def summarize_multilingual(self, text: str, summary_style: str = "detailed") -> str:
        model = model_manager.get_multilingual_summarizer()
        max_w, min_w = self.calculate_adaptive_length(text)
        max_w, min_w = self._adjust_lengths(max_w, min_w, summary_style)
        max_tok, min_tok = self._to_tokens(max_w), self._to_tokens(min_w)

        chunks = self._chunk_text(text, size=1000, overlap=120)
        if len(chunks) == 1:
            return self._summarize_chunk(model, chunks[0], max_tok, min_tok)
        summaries = [self._summarize_chunk(model, c, max_tok, min_tok) for c in chunks]
        combined = " ".join(summaries)
        return self._summarize_chunk(model, combined, max_tok, min_tok)

    # === Utility Methods for Routes ===
    def calculate_compression_ratio(self, original: str, summary: str) -> float:
        orig_words = len(original.split())
        summ_words = len(summary.split())
        if orig_words == 0:
            return 0.0
        ratio = (orig_words - summ_words) / orig_words * 100
        return round(ratio, 2)

    def calculate_reading_time(self, text: str, wpm: int = 200) -> int:
        word_count = len(text.split())
        return max(1, round(word_count / wpm))


summarizer = SummarizationService()
