"""
Q&A API Routes
Handles interactive question-answering functionality
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

from app.services.analysis import analysis_service
from app.services.models import model_manager

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class QARequest(BaseModel):
    question: str
    context: str
    language: Optional[str] = "en"  # en for English, multilingual for others

class QAResponse(BaseModel):
    answer: str
    confidence: float
    start_position: int
    end_position: int
    supporting_text: str
    metadata: Dict[str, Any]

class ConversationQARequest(BaseModel):
    question: str
    context: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    language: Optional[str] = "en"

@router.post("/qa/ask", response_model=QAResponse)
async def ask_question(request: QARequest):
    """Answer a question based on provided context"""
    try:
        logger.info(f"Processing Q&A request: {request.question[:50]}...")
        
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        if not request.context.strip():
            raise HTTPException(status_code=400, detail="Context cannot be empty")
        
        # Choose appropriate model based on language
        if request.language == "en":
            qa_model = model_manager.get_qa_model()
        else:
            qa_model = model_manager.get_multilingual_qa_model()
        
        # Truncate context if too long (model limit is usually 512 tokens)
        max_context_length = 2000  # characters, roughly 400-500 tokens
        context = request.context[:max_context_length] if len(request.context) > max_context_length else request.context
        
        # Get answer from model
        result = qa_model(
            question=request.question,
            context=context
        )
        
        # Extract supporting text (context around the answer)
        start_pos = max(0, result['start'] - 100)
        end_pos = min(len(context), result['end'] + 100)
        supporting_text = context[start_pos:end_pos]
        
        # Calculate metadata
        metadata = {
            'question_length': len(request.question.split()),
            'context_length': len(request.context.split()),
            'answer_length': len(result['answer'].split()),
            'language': request.language,
            'model_used': 'roberta-base-squad2' if request.language == 'en' else 'xlm-roberta-large-mlqa'
        }
        
        return QAResponse(
            answer=result['answer'],
            confidence=round(result['score'], 4),
            start_position=result['start'],
            end_position=result['end'],
            supporting_text=supporting_text,
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in Q&A processing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Q&A processing failed: {str(e)}")

@router.post("/qa/conversation", response_model=QAResponse)
async def conversational_qa(request: ConversationQARequest):
    """Handle conversational Q&A with context from previous questions"""
    try:
        logger.info(f"Processing conversational Q&A: {request.question[:50]}...")
        
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        if not request.context.strip():
            raise HTTPException(status_code=400, detail="Context cannot be empty")
        
        # Build enhanced context with conversation history
        enhanced_context = request.context
        
        if request.conversation_history:
            # Add previous Q&A pairs to context for better understanding
            history_text = "\n\nPrevious conversation:\n"
            for qa_pair in request.conversation_history[-3:]:  # Last 3 exchanges
                if 'question' in qa_pair and 'answer' in qa_pair:
                    history_text += f"Q: {qa_pair['question']}\nA: {qa_pair['answer']}\n"
            
            enhanced_context = history_text + "\n\nCurrent context:\n" + request.context
        
        # Choose appropriate model
        if request.language == "en":
            qa_model = model_manager.get_qa_model()
        else:
            qa_model = model_manager.get_multilingual_qa_model()
        
        # Get answer
        result = qa_model(
            question=request.question,
            context=enhanced_context
        )
        
        # Extract supporting text
        start_pos = max(0, result['start'] - 100)
        end_pos = min(len(enhanced_context), result['end'] + 100)
        supporting_text = enhanced_context[start_pos:end_pos]
        
        # Calculate metadata
        metadata = {
            'question_length': len(request.question.split()),
            'context_length': len(request.context.split()),
            'enhanced_context_length': len(enhanced_context.split()),
            'answer_length': len(result['answer'].split()),
            'conversation_turns': len(request.conversation_history),
            'language': request.language,
            'model_used': 'roberta-base-squad2' if request.language == 'en' else 'xlm-roberta-large-mlqa'
        }
        
        return QAResponse(
            answer=result['answer'],
            confidence=round(result['score'], 4),
            start_position=result['start'],
            end_position=result['end'],
            supporting_text=supporting_text,
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in conversational Q&A: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Conversational Q&A failed: {str(e)}")

@router.post("/qa/batch")
async def batch_qa(questions: List[str], context: str, language: str = "en"):
    """Answer multiple questions at once"""
    try:
        logger.info(f"Processing batch Q&A with {len(questions)} questions")
        
        if not questions:
            raise HTTPException(status_code=400, detail="No questions provided")
        
        if not context.strip():
            raise HTTPException(status_code=400, detail="Context cannot be empty")
        
        # Choose appropriate model
        if language == "en":
            qa_model = model_manager.get_qa_model()
        else:
            qa_model = model_manager.get_multilingual_qa_model()
        
        results = []
        
        for question in questions:
            if not question.strip():
                continue
                
            try:
                result = qa_model(
                    question=question,
                    context=context
                )
                
                # Extract supporting text
                start_pos = max(0, result['start'] - 50)
                end_pos = min(len(context), result['end'] + 50)
                supporting_text = context[start_pos:end_pos]
                
                results.append({
                    'question': question,
                    'answer': result['answer'],
                    'confidence': round(result['score'], 4),
                    'supporting_text': supporting_text
                })
                
            except Exception as e:
                logger.warning(f"Failed to answer question '{question}': {str(e)}")
                results.append({
                    'question': question,
                    'answer': "Unable to answer this question",
                    'confidence': 0.0,
                    'supporting_text': ""
                })
        
        return {
            'results': results,
            'total_questions': len(questions),
            'successful_answers': len([r for r in results if r['confidence'] > 0]),
            'language': language
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch Q&A: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch Q&A failed: {str(e)}")

@router.get("/qa/suggested-questions")
async def get_suggested_questions(context: str, num_questions: int = 5):
    """Generate suggested questions based on context"""
    try:
        logger.info("Generating suggested questions")
        
        if not context.strip():
            raise HTTPException(status_code=400, detail="Context cannot be empty")
        
        # Simple rule-based question generation
        # In a production system, you might use a more sophisticated model
        
        suggested_questions = []
        
        # Extract key entities and concepts for question generation
        words = context.lower().split()
        
        # Common question patterns
        question_patterns = [
            "What is the main topic discussed?",
            "What are the key points mentioned?",
            "Who are the main people or entities involved?",
            "When did these events take place?",
            "Where do these events occur?",
            "Why is this important?",
            "How does this work?",
            "What are the implications?",
            "What are the benefits mentioned?",
            "What challenges are discussed?"
        ]
        
        # Filter questions based on context content
        if any(word in words for word in ['when', 'date', 'year', 'time']):
            suggested_questions.append("When did this happen?")
        
        if any(word in words for word in ['where', 'location', 'place']):
            suggested_questions.append("Where does this take place?")
        
        if any(word in words for word in ['who', 'person', 'people', 'author']):
            suggested_questions.append("Who are the key people involved?")
        
        if any(word in words for word in ['how', 'method', 'process', 'way']):
            suggested_questions.append("How does this process work?")
        
        if any(word in words for word in ['why', 'reason', 'because', 'cause']):
            suggested_questions.append("Why is this significant?")
        
        # Add generic questions
        suggested_questions.extend([
            "What is the main idea?",
            "What are the key takeaways?",
            "What details are most important?"
        ])
        
        # Remove duplicates and limit to requested number
        unique_questions = list(dict.fromkeys(suggested_questions))
        return {
            'suggested_questions': unique_questions[:num_questions],
            'context_length': len(context.split()),
            'total_suggestions': len(unique_questions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating suggested questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")
