# SummarizePro Backend

FastAPI-based backend service for AI-powered text summarization.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- pip
- Virtual environment (recommended)

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run the server
python -m uvicorn app.main:app --reload
```

Server will start at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

## 📁 Project Structure

```
backend/
├── app/
│   ├── config/
│   │   └── settings.py          # Application configuration
│   ├── routes/
│   │   ├── summarize_new.py     # Summarization endpoints
│   │   ├── qa.py                # Q&A endpoints
│   │   ├── export.py            # Export endpoints
│   │   └── health.py            # Health check endpoints
│   ├── services/
│   │   ├── summarizer.py        # Core summarization logic
│   │   ├── text_extractor.py    # Document text extraction
│   │   ├── model_manager_optimized.py  # ML model management
│   │   ├── speech_to_text.py    # Audio transcription
│   │   ├── analysis.py          # Text analysis tools
│   │   └── content_extractor.py # Web content extraction
│   └── main.py                  # FastAPI application
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables
└── README.md
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Model Settings
LLM_MODEL=google/flan-t5-base
MODEL_CACHE_DIR=./models
MAX_MODELS_IN_MEMORY=3
MODEL_DEVICE=auto  # auto, cpu, cuda
ENABLE_QUANTIZATION=false

# Content Processing
MAX_FILE_SIZE_MB=50
MAX_TEXT_LENGTH=100000
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Summary Settings
DEFAULT_SUMMARY_STYLE=detailed
MIN_SUMMARY_LENGTH=50
MAX_SUMMARY_LENGTH=500

# Logging
LOG_LEVEL=INFO
LOG_FILE=app.log
```

## 🎯 API Endpoints

### Summarization
- `POST /api/v1/summarize/text` - Summarize text
- `POST /api/v1/summarize/document` - Summarize document
- `POST /api/v1/summarize/url` - Summarize URL
- `POST /api/v1/summarize/multilingual` - Multi-language

### Q&A
- `POST /api/v1/qa/ask` - Ask questions
- `GET /api/v1/qa/suggested-questions` - Get suggestions

### Export
- `POST /api/v1/export/txt` - Export as TXT
- `POST /api/v1/export/docx` - Export as DOCX
- `POST /api/v1/export/pdf` - Export as PDF

### Health
- `GET /health` - Health check
- `GET /health/system` - System info

## 🤖 Models Used

### Summarization Models
- **DistilBART-CNN** - Fast, efficient summarization
- **FLAN-T5** - Instruction-tuned model for custom prompts
- **Long-T5** - For long documents
- **mBART** - Multi-language support

### Analysis Models
- **KeyBERT** - Keyword extraction
- **BERTopic** - Topic modeling
- **RoBERTa** - Sentiment analysis
- **Sentence Transformers** - Semantic similarity

## 🔧 Development

### Running Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_summarizer.py

# Run with coverage
pytest --cov=app tests/
```

### Code Quality
```bash
# Format code
black app/

# Lint code
flake8 app/

# Type checking
mypy app/
```

### Adding New Models

1. Add model to `model_manager_optimized.py`:
```python
def get_your_model(self):
    if 'your_model' not in self.models:
        self.models['your_model'] = self._load_model('model-name')
    return self.models['your_model']
```

2. Use in service:
```python
model = model_manager.get_your_model()
result = model(input_text)
```

## 📊 Performance Optimization

### GPU Acceleration
```env
MODEL_DEVICE=cuda
```

### Model Quantization
```env
ENABLE_QUANTIZATION=true
```

### Memory Management
```env
MAX_MODELS_IN_MEMORY=2  # Reduce for low memory
```

## 🐛 Troubleshooting

### Models Not Loading
- Check internet connection
- Verify `MODEL_CACHE_DIR` exists and is writable
- Ensure sufficient disk space (2-3GB)

### Out of Memory
- Reduce `MAX_MODELS_IN_MEMORY`
- Use smaller models
- Enable quantization
- Process smaller text chunks

### Slow Performance
- Enable GPU if available
- Use smaller, faster models
- Reduce chunk size
- Enable model quantization

## 📝 License

MIT License - see LICENSE file for details
