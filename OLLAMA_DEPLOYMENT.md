# Ollama LLM Deployment Guide
## Smart Education Newsletter Platform - Enhanced RAG System

---

## 📋 Overview

This guide explains how to deploy and use the enhanced Ollama-based LLM for the Smart Education Newsletter Platform with:
- ✅ Structured response formatting (Summary → Table → Observations → Source → Questions)
- ✅ Source URLs for verification
- ✅ Contextual question generation
- ✅ Query type detection
- ✅ Chapter-wise navigation
- ✅ Zero hallucination policy

---

## 🚀 Quick Start

### Option 1: Using Pre-configured Modelfile (Recommended)

```bash
# Navigate to project directory
cd /path/to/LLM-dashboard

# Create the custom model from Modelfile
ollama create vsk-newsletter -f Modelfile

# Verify the model
ollama list | grep vsk-newsletter

# Run the model
ollama run vsk-newsletter
```

### Option 2: Using Base Llama 3.1 Model

```bash
# Pull the base model
ollama pull llama3.1:8b

# The system will automatically use the enhanced prompt from system_prompt.py
```

---

## ⚙️ Configuration

### Environment Variables

Set these in your `.env` file or Render environment:

```bash
# Ollama Configuration
OLLAMA_URL=http://your-ollama-server:11434
OLLAMA_MODEL=vsk-newsletter  # or llama3.1

# Optional: If using cloud Ollama service
OLLAMA_API_KEY=your_api_key_here
```

### Model Parameters

The Modelfile is configured with optimized parameters for government-grade accuracy:

```
temperature: 0.3          # Low for factual accuracy
top_p: 0.9               # Controlled diversity
top_k: 40                # Focused sampling
repeat_penalty: 1.1      # Avoid repetition
num_predict: 1024        # Support long structured responses
```

---

## 📊 Response Structure

Every LLM response follows this mandatory format:

```markdown
**Summary:**
Total schools in January 2026: 948,000 (+3.6% from April 2025)

**Detailed Data:**
| Month | Schools | Change | % Growth |
|-------|---------|--------|----------|
| April 2025 | 915,000 | - | - |
| January 2026 | 948,000 | +33,000 | +3.6% |

**Key Observations:**
• Steady growth of 3,300 schools per month on average
• Primary schools constitute 57.5% of total infrastructure
• Rural schools grew faster (+4.2%) than urban schools (+2.8%)

**Data Source:**
Newsletter: January 2026, Section: Infrastructure Statistics
📊 Live Data API: https://llm-dashboard-backend-8gb0.onrender.com/api/analytics/full-data
🏛️ Official Website: https://www.education.gov.in/en/documents-reports-category/newsletter
✅ Verification: Users can access the live API or official Ministry website to verify this information

**Related Questions You Might Ask:**
1. How did school infrastructure growth compare across different states?
2. What is the breakdown of schools by type (primary, secondary, etc.)?
3. What initiatives contributed to this infrastructure expansion?
```

---

## 🔍 Query Type Detection

The system automatically detects query types and formats responses accordingly:

### Type 1: Statistical Queries
**Triggers:** show, compare, how many, total, statistics, data, numbers, breakdown, trend

**Example Query:**
```
"Show me the total number of schools in January 2026"
```

**Response:** Full structured format with Markdown table

---

### Type 2: Temporal Comparison
**Triggers:** compare, growth, change, increase, decrease, from X to Y, trend

**Example Query:**
```
"Compare APAAR ID growth from April 2025 to January 2026"
```

**Response:** Time-series table with absolute change and percentage change

---

### Type 3: Highlights/Summary
**Triggers:** highlights, summary, overview, achievements, major updates

**Example Query:**
```
"What were the highlights of December 2025?"
```

**Response:** Categorized lists + mini-tables with numeric data

---

### Type 4: Specific Facts
**Triggers:** what is, how many, which state, when, where

**Example Query:**
```
"Which state has the highest attendance rate?"
```

**Response:** Direct answer in summary + contextual table

---

## 📚 Chapter-Wise Navigation

The system organizes data into 8 chapters for easy navigation:

### Chapter 1: Infrastructure Statistics
- Total schools (by type)
- New schools added
- Smart classrooms
- State-wise distribution
- Rural vs urban breakdown

### Chapter 2: Human Resources
- Total teachers
- Student-teacher ratios
- Training completion
- Vacancies

### Chapter 3: Student Enrollment & Attendance
- Enrollment (level & gender)
- Attendance rates
- Dropout rates

### Chapter 4: Digital Initiatives
- APAAR IDs
- Platform adoption
- Device access
- E-learning usage

### Chapter 5: Highlights & Policy Updates
- NEP milestones
- Policy updates
- Major events
- Budget utilization

### Chapter 6: State Performance
- State rankings
- Regional comparisons
- Best practices

### Chapter 7: Learning Outcomes
- Assessment results
- Competency achievements
- Subject proficiency

### Chapter 8: Technical Developments
- Dashboard features
- Infrastructure upgrades
- System integrations

---

## 🎯 Sample Queries & Expected Responses

### Query 1: Basic Statistics
**Input:**
```
"How many APAAR IDs were generated by January 2026?"
```

**Expected Response:**
```markdown
**Summary:**
By January 2026, 235 million APAAR IDs were generated, achieving 95.8% coverage.

**Detailed Data:**
| Metric | Value |
|--------|-------|
| Total APAAR IDs | 235 million |
| Coverage Rate | 95.8% |
| Growth from April 2025 | +115 million |
| Percentage Growth | +95.8% |

**Key Observations:**
• APAAR registrations nearly doubled from 120M (April 2025) to 235M (January 2026)
• All 36 states and union territories are now integrated
• 87.5% of consents were collected digitally
• Average monthly growth of 11.5 million registrations

**Data Source:**
Newsletter: January 2026, Section: Digital Initiatives
📊 Live Data API: https://llm-dashboard-backend-8gb0.onrender.com/api/analytics/full-data
🏛️ Official Website: https://www.education.gov.in/en/documents-reports-category/newsletter
✅ Verification: Users can access the live API or official Ministry website

**Related Questions You Might Ask:**
1. What was the month-over-month APAAR ID growth trend?
2. Which states led in APAAR adoption rates?
3. How does APAAR integration improve scholarship disbursement?
```

---

### Query 2: State Comparison
**Input:**
```
"Compare Kerala and Gujarat performance"
```

**Expected Response:**
```markdown
**Summary:**
Kerala leads with 98.6% APAAR coverage and 98.4% attendance, while Gujarat shows strong performance with 95.8% APAAR and 96.2% attendance.

**Detailed Data:**
| Metric | Kerala | Gujarat |
|--------|--------|---------|
| APAAR Coverage | 98.6% | 95.8% |
| Attendance Rate | 98.4% | 96.2% |
| Digital Readiness | 96.5% | 93.2% |
| Total Schools | 15,334 | 52,901 |

**Key Observations:**
• Kerala leads in all digital metrics despite having fewer schools
• Gujarat manages higher scale (3.5× more schools) with strong performance
• Both states exceed national averages significantly
• Kerala's success attributed to universal internet connectivity
• Gujarat's strength in public-private partnerships drives growth

**Data Source:**
Newsletter: January 2026, Section: State Performance
📊 Live Data API: https://llm-dashboard-backend-8gb0.onrender.com/api/analytics/full-data
🏛️ Official Website: https://www.education.gov.in/en/documents-reports-category/newsletter

**Related Questions You Might Ask:**
1. How do other states compare to Kerala and Gujarat?
2. What best practices from these states can be replicated?
3. What is the correlation between digital readiness and learning outcomes?
```

---

### Query 3: Temporal Trend
**Input:**
```
"Show me the attendance rate trend from April 2025 to January 2026"
```

**Expected Response:**
```markdown
**Summary:**
Attendance rates improved from 94.2% (April 2025) to 96.8% (January 2026), showing a 2.6 percentage point increase.

**Detailed Data:**
| Month | Attendance | Change |
|-------|------------|--------|
| April 2025 | 94.2% | - |
| May 2025 | 94.6% | +0.4% |
| June 2025 | 95.0% | +0.4% |
| July 2025 | 95.3% | +0.3% |
| August 2025 | 95.6% | +0.3% |
| September 2025 | 95.9% | +0.3% |
| October 2025 | 96.2% | +0.3% |
| November 2025 | 96.4% | +0.2% |
| December 2025 | 96.6% | +0.2% |
| January 2026 | 96.8% | +0.2% |

**Key Observations:**
• Consistent month-over-month improvement averaging +0.26 percentage points
• Fastest growth in April-June period (+0.4% monthly)
• Stabilization trend in Nov-Jan with smaller increments
• Monsoon session (July) maintained growth despite seasonal challenges

**Data Source:**
Newsletter: Monthly data (April 2025 - January 2026), Section: Attendance
📊 Live Data API: https://llm-dashboard-backend-8gb0.onrender.com/api/analytics/full-data
🏛️ Official Website: https://www.education.gov.in/en/documents-reports-category/newsletter

**Related Questions You Might Ask:**
1. Which states contributed most to this attendance improvement?
2. What initiatives (SMS alerts, community mobilization) drove this trend?
3. How does attendance correlate with learning outcomes?
```

---

## 🛠️ Customization

### Modifying the System Prompt

Edit `backend/llm/system_prompt.py`:

```python
ENHANCED_SYSTEM_PROMPT = """
[Your custom instructions here]
"""
```

### Adjusting Response Format

Edit `backend/llm/response_formatter.py` to customize:
- Table formatting
- Question generation logic
- Source URL templates

### Changing Model Parameters

Edit `Modelfile`:

```
PARAMETER temperature 0.3    # Adjust for creativity vs accuracy
PARAMETER num_predict 1024   # Increase for longer responses
```

---

## 🧪 Testing

### Test Query Suite

```bash
# Test 1: Basic statistics
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "How many schools in January 2026?"}'

# Test 2: Comparison
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Compare Kerala and Tamil Nadu"}'

# Test 3: Trend analysis
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Show APAAR growth trend"}'
```

### Verification Checklist

✅ Response includes Summary section
✅ Response includes Markdown table (for stats)
✅ Response includes Key Observations
✅ Response includes Data Source with URLs
✅ Response includes exactly 3 follow-up questions
✅ All numbers match newsletter data exactly
✅ Source URLs are clickable and valid
✅ No hallucinated information

---

## 📈 Performance Optimization

### For Production Deployment

1. **Use GPU-accelerated Ollama server** for faster responses
2. **Cache frequent queries** using Redis
3. **Implement request queuing** for high concurrency
4. **Monitor response times** and adjust model parameters

### Recommended Hardware

- **Minimum:** 8GB RAM, 4 CPU cores
- **Recommended:** 16GB RAM, 8 CPU cores, NVIDIA GPU
- **Optimal:** 32GB RAM, 16 CPU cores, RTX 4090 or better

---

## 🔒 Security & Privacy

### Data Protection

- ✅ No user queries are stored permanently
- ✅ Newsletter data is publicly available (official government data)
- ✅ Source URLs point to official government websites
- ✅ No PII (Personally Identifiable Information) in responses

### API Security

```python
# Add rate limiting
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/chat")
@limiter.limit("10/minute")
async def chat_endpoint(request: Request):
    # Your code here
    pass
```

---

## 🐛 Troubleshooting

### Issue: LLM not generating tables

**Solution:** Increase `num_predict` parameter in Modelfile to allow longer responses:
```
PARAMETER num_predict 2048
```

### Issue: Hallucinated information

**Solution:** Lower temperature and add explicit warnings in system prompt:
```
PARAMETER temperature 0.1
```

### Issue: Missing source URLs

**Solution:** Check `response_formatter.py` is properly integrated:
```python
from backend.llm.response_formatter import add_source_urls
response = add_source_urls(response)
```

### Issue: Questions not contextual

**Solution:** Update question generation logic in `response_formatter.py`:
```python
def generate_contextual_questions(query, query_type, chapter):
    # Custom logic here
    pass
```

---

## 📞 Support

**GitHub Issues:** https://github.com/Akshatb848/LLM-dashboard/issues
**Documentation:** `/NEWSLETTER_FEATURES.md`
**API Docs:** https://llm-dashboard-backend-8gb0.onrender.com/docs

---

## 📄 License

© 2026 Department of School Education & Literacy, Ministry of Education, Government of India. All Rights Reserved.

---

**Last Updated:** February 2026 | Version 2.0
**Deployment Status:** ✅ Production Ready
