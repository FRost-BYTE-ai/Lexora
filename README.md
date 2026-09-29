# Lexora

> **Tamil-first legal intelligence for citizens — legal answers grounded in authoritative sources.**

Lexora is a multilingual legal research and assistance platform designed to help users understand Indian and Tamil Nadu legal information through natural-language conversations.

It is built around a simple principle:

**Ask naturally → find the relevant law → verify the evidence → explain it clearly.**

Lexora supports **English, Tamil, Tanglish, and Hindi**, with conversational text and voice interfaces.

---

## ✨ What Lexora Does

Lexora combines conversational AI with legal retrieval so that the language model explains retrieved legal information rather than acting as an unsupported source of law.

### Core capabilities

* ⚖️ Multilingual legal question answering
* 🇮🇳 Indian and Tamil Nadu legal research
* 🗣️ English, Tamil, Tanglish, and Hindi interaction
* 🔎 Hybrid legal retrieval
* 📚 Legal source and provision inspection
* 💬 Multi-turn conversational memory
* 📄 Legal document analysis
* 📷 Camera-based document capture and OCR
* 🎙️ Voice consultation
* 🏛️ Government scheme discovery
* 📑 Draft generation
* ⚖️ Supreme Court case exploration
* 🧪 RAG diagnostics and retrieval evaluation
* 💾 Saved legal research items
* 🌐 Multilingual translation

> **Disclaimer:** Lexora is a legal information and research assistant. It does not replace a qualified lawyer, advocate, court, or other appropriate legal professional.

---

## 🧠 Architecture

Lexora uses a retrieval-grounded conversational architecture:

```text
                    ┌─────────────────────┐
                    │     User Input      │
                    │ Text / Voice / Doc  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Query Understanding │
                    │ Language / Intent   │
                    │ Jurisdiction/Domain │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐         ┌─────────────────┐
        │ Quick Response  │         │   Legal Scope   │
        │    Layer        │         │   Detection      │
        └────────┬────────┘         └────────┬────────┘
                 │                           │
                 │                    ┌──────┴──────┐
                 │                    │             │
                 │                 Non-Legal      Legal
                 │                    │             │
                 │                    ▼             ▼
                 │               Scope Reply   Corpus Router
                 │                                  │
                 │                                  ▼
                 │                         Hybrid Retrieval
                 │                         Dense + Sparse
                 │                              + RRF
                 │                                  │
                 │                                  ▼
                 │                         Evidence Validation
                 │                                  │
                 └──────────────────────────────────┤
                                                    │
                                                    ▼
                                         ┌──────────────────┐
                                         │ Qwen3-0.6B       │
                                         │ Base / LoRA      │
                                         └────────┬─────────┘
                                                  │
                                                  ▼
                                         Hallucination Guard
                                                  │
                                                  ▼
                                      ┌──────────────────────┐
                                      │ Lexora Research Desk │
                                      │ Text / Voice / Docs  │
                                      └──────────────────────┘
```

---

## 🏛️ Legal Knowledge Architecture

Lexora is designed around multiple legal corpora rather than a single undifferentiated knowledge base.

### Current corpus structure

| Corpus             | Purpose                                      |
| ------------------ | -------------------------------------------- |
| Constitution       | Constitution of India provisions             |
| BNS                | Bharatiya Nyaya Sanhita, 2023                |
| BNSS               | Bharatiya Nagarik Suraksha Sanhita, 2023     |
| BSA                | Bharatiya Sakshya Adhiniyam, 2023            |
| Tamil Nadu         | Tamil Nadu-specific legal material           |
| Supreme Court      | Case and judgment research                   |
| Government Schemes | Scheme discovery and eligibility information |

Legal documents are represented with structured metadata such as:

```text
document_id
title
document_type
act_name
chapter
section
subsection
heading
jurisdiction
state
effective_date
amendment_date
source_authority
source_url
status
text
```

Where applicable, Lexora preserves the hierarchy:

```text
Act
 └── Chapter
      └── Section
           └── Subsection
                └── Clause
                     └── Proviso
                          └── Explanation
```

This allows retrieval to operate on legal structure rather than treating legislation as ordinary unstructured text.

---

## 🔎 Retrieval Pipeline

Lexora uses a hybrid retrieval approach:

```text
User Query
    │
    ▼
Language Detection
    │
    ▼
Query Normalization
    │
    ▼
Legal Concept Expansion
    │
    ▼
Corpus / Jurisdiction Routing
    │
    ├── Constitution
    ├── BNS
    ├── BNSS
    ├── BSA
    ├── Tamil Nadu
    └── Supreme Court
    │
    ▼
Dense Retrieval
    │
    +
    │
Sparse Retrieval
    │
    ▼
RRF Fusion
    │
    ▼
Legal Re-ranking / LARV
    │
    ▼
Evidence Sufficiency
    │
    ▼
Grounded Generation
```

Lexora's retrieval and verification layer is designed to reduce unsupported legal claims by requiring relevant evidence before generation.

---

## 🧮 LARV

Lexora includes a conceptual legal retrieval ranking approach called **LARV — Lexora Adaptive Retrieval & Verification**.

The proposed ranking factors include:

* Semantic similarity
* Keyword relevance
* Legal authority
* Jurisdiction match
* Section match
* Recency
* Conflict penalty

Conceptually:

```text
LARV =
    Semantic Similarity
  + Keyword Relevance
  + Legal Authority
  + Jurisdiction Match
  + Section Match
  + Recency
  - Conflict Penalty
```

LARV is used as a retrieval/ranking concept within Lexora and should not be interpreted as independently validated legal or scientific evidence.

---

## 🤖 AI Model

Lexora uses **Qwen3-0.6B** as its local conversational model.

The project also includes a LoRA fine-tuning workflow designed to improve response behavior and instruction following.

The architecture separates:

```text
RAG
=
Provides legal knowledge and evidence

LoRA
=
Shapes response behavior and instruction following

Qwen
=
Synthesizes the final response
```

The model is therefore not treated as the authoritative source of law.

---

## 🌍 Multilingual Support

Lexora is designed for multilingual legal interaction.

### Supported languages

* 🇬🇧 English
* 🇮🇳 Tamil
* 🇮🇳 Tanglish
* 🇮🇳 Hindi

Users can ask questions naturally without having to manually convert their query into formal legal terminology.

Example:

```text
English:
"What is the punishment for theft?"

Tamil:
"திருட்டுக்கு என்ன தண்டனை?"

Tanglish:
"thiruttu ku enna punishment?"

Hindi:
"चोरी की सजा क्या है?"
```

The query-understanding layer can normalize colloquial language into legal concepts before retrieval.

---

## 💬 Conversational Memory

Lexora supports session-based multi-turn conversations.

Example:

```text
User:
My neighbour threatened me.

Lexora:
What exactly did they say or do?

User:
He said he would hurt me.

Lexora:
Based on what you've described...
```

Conversation state can preserve:

* Previous queries
* Legal concepts
* Jurisdiction
* Domain
* Relevant entities
* Retrieved context
* Session-specific documents

Different consultations remain isolated from one another.

---

## ⚡ Instant Response Layer

Lexora also supports deterministic pre-stored responses for predefined interactions.

```text
User Input
    │
    ▼
Quick Response Matcher
    │
    ├── Match → Stored Response
    │
    └── No Match → Normal Lexora Pipeline
```

Matched responses bypass:

* LLM inference
* RAG
* Qdrant
* Embeddings
* Legal retrieval

This allows frequently used conversational responses to return instantly.

---

## 🎙️ Voice Consultation

Voice interaction uses the same conversational engine as text.

```text
Speech
  ↓
Speech-to-Text
  ↓
Lexora Query Understanding
  ↓
Scope / Intent
  ↓
RAG / Tools / Qwen
  ↓
Response
  ↓
Text-to-Speech
  ↓
Voice Response
```

Voice and text share:

* Session memory
* Legal scope
* Query understanding
* Corpus routing
* RAG
* Evidence validation
* Tool routing
* Response generation

The goal is a genuine conversational voice interface rather than a separate chatbot implementation.

---

## 📷 Smart Document & Camera Assist

Lexora supports document-oriented workflows including:

* PDF analysis
* Text document analysis
* Image-based documents
* Camera capture
* Typed document OCR
* Handwritten document OCR
* Document summarization
* Clause identification
* Date and party extraction
* Referenced-law identification
* Legal issue identification

The original document/image can be preserved while extracted text remains available for editing and analysis.

Low-confidence OCR should be surfaced rather than silently treated as accurate text.

---

## 🏛️ Government Schemes

Lexora includes a Government Schemes workflow designed to help users discover relevant government schemes.

The workflow can provide:

* Scheme search
* Central schemes
* State schemes
* Tamil Nadu schemes
* Eligibility information
* Benefits
* Required documents
* Application information
* Official scheme links

Scheme information should retain source provenance and should not be fabricated when authoritative information is unavailable.

---

## ⚖️ Case Explorer

The Case Explorer is designed for legal case research.

Users can search using:

* Case name
* Citation
* Court
* Legal provision
* Keyword
* Legal concept

Case results can be inspected, saved, translated, listened to, and sent into the main consultation.

Case information should preserve the underlying source and distinguish authoritative judgment content from generated summaries.

---

## 📚 Legal Library

The Legal Library provides a searchable interface over Lexora's legal corpus.

Users can:

* Search provisions
* Filter legal material
* Open sections/articles
* Inspect source metadata
* Save relevant material
* Translate content
* Listen to content
* Send provisions to the main consultation

The library is designed to function as a legal research workspace rather than a generic document search page.

---

## 📑 Draft Generator

Lexora can assist with structured legal drafting workflows such as:

* Complaints
* Representations
* Grievances
* Legal notices
* Cooperative complaints
* Applications
* Response letters

Generated drafts should be based on the available legal context and clearly presented as drafts for user review.

---

## 🧪 RAG Diagnostics

Lexora includes a diagnostics layer for inspecting retrieval behavior.

Diagnostics can expose information such as:

```text
Raw Query
Normalized Query
Detected Language
Legal Intent
Jurisdiction
Domain
Expanded Concepts
Selected Corpus
Dense Retrieval
Sparse Retrieval
RRF Results
Re-ranked Results
Evidence Sufficiency
Citations
Generation Model
Latency
Token Statistics
```

This makes it possible to diagnose whether a poor answer originated from:

* Query understanding
* Corpus routing
* Retrieval
* Evidence selection
* Generation
* Post-generation validation

---

## 🛡️ Safety & Grounding

Lexora includes multiple layers intended to reduce hallucinated legal information.

### Scope protection

Non-legal substantive requests are separated from legal requests.

### Evidence sufficiency

If reliable evidence cannot be retrieved, Lexora should avoid presenting unsupported legal claims as established law.

### Citation validation

Generated legal references can be checked against retrieved evidence.

### Session isolation

User conversations and uploaded documents are scoped to their sessions.

### Security controls

The application includes protections such as:

* Restricted CORS
* Session access controls
* File-upload restrictions
* Request rate limiting
* Input validation
* DOM/XSS protections
* Security headers

---

## 🛠️ Technology Stack

### Frontend

* HTML
* CSS
* JavaScript
* Source Serif 4
* Inter
* Responsive Legal Research Desk UI
* Web Speech APIs where supported

### Backend

* Python
* FastAPI
* REST APIs
* Session management
* Document processing
* Legal retrieval services

### AI / NLP

* Qwen3-0.6B
* LoRA / PEFT
* Transformers
* Multilingual embeddings
* OCR
* Speech processing
* Translation

### Retrieval

* Qdrant
* Dense retrieval
* Sparse retrieval
* RRF fusion
* Legal concept expansion
* LARV ranking

### Data

* JSON
* JSONL
* PDF
* Structured legal metadata
* Legal evaluation datasets

---

## 📁 Project Structure

```text
Lexora/
│
├── chatbot/
│   ├── chatbot.py
│   ├── query_understanding.py
│   ├── evidence_validator.py
│   ├── response_formatter.py
│   ├── session_manager.py
│   ├── document_analyzer.py
│   ├── draft_generator.py
│   ├── case_provider.py
│   ├── schemes_provider.py
│   ├── saved_manager.py
│   ├── ocr_engine.py
│   ├── sparse_utils.py
│   └── ...
│
├── data/
│   ├── legal/
│   ├── rag/
│   ├── evaluation/
│   ├── training/
│   └── saved_items.json
│
├── models/
│   ├── qwen3-0.6b-lora-pilot/
│   └── qwen3-0.6b-smoke-test/
│
├── static/
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── lexora-logo.jpg
│
├── tests/
│
├── server.py
├── requirements.txt
└── README.md
```

---

## 🚀 Running Lexora Locally

### 1. Clone the repository

```bash
git clone https://github.com/FRost-BYTE-ai/Lexora.git
cd Lexora
```

### 2. Create a Python environment

```bash
python -m venv .venv
```

Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file for required external services.

Do not commit API keys or credentials to Git.

Example:

```env
NVIDIA_API_KEY=your_api_key_here
```

Only configure external services that are required by the features you intend to use.

### 5. Start the application

```bash
python server.py
```

Then open:

```text
http://127.0.0.1:8000
```

---

## 🔬 Development & Evaluation

Lexora contains evaluation and verification scripts covering areas such as:

* Legal retrieval
* Constitution retrieval
* BNS / BNSS / BSA routing
* Tamil Nadu corpus routing
* Multilingual queries
* Tanglish normalization
* Session memory
* Evidence validation
* Hallucination protection
* Model behavior
* RAG integration
* End-to-end application behavior

Example:

```bash
python test_comprehensive_suite.py
```

Additional verification scripts are available throughout the project.

---

## 📌 Legal Source Philosophy

Lexora prioritizes authoritative legal sources wherever possible.

The intended source hierarchy is broadly:

```text
Primary legislation / official government source
                    ↓
Official Gazette
                    ↓
Official court judgment
                    ↓
Official government department
                    ↓
Secondary legal reference
```

Legal source metadata should be preserved so users can inspect where information came from.

---

## 🎯 Design Philosophy

Lexora is intentionally designed as:

> **A modern digital law library that happens to have an intelligent conversational interface.**

The interface avoids treating legal research as a generic AI chat experience.

The design emphasizes:

* Clear typography
* Legal-document readability
* Inspectable sources
* Minimal visual noise
* Professional information density
* Multilingual accessibility
* Conversational simplicity

---

## 🗺️ Roadmap

### Current / Core

* [x] Multilingual legal chatbot
* [x] Legal scope detection
* [x] Multi-turn memory
* [x] Hybrid RAG
* [x] Constitution corpus
* [x] BNS corpus
* [x] BNSS corpus
* [x] BSA corpus
* [x] Tamil Nadu corpus
* [x] Legal evidence validation
* [x] Qwen3-0.6B integration
* [x] LoRA experimentation
* [x] Document analysis
* [x] Legal Library
* [x] Government Scheme workflow
* [x] Case Explorer architecture
* [x] RAG Diagnostics
* [x] Voice workflow
* [x] Translation workflow

### Future

* [ ] Expanded state-level legal corpora
* [ ] Larger judgment corpus
* [ ] Additional Indian languages
* [ ] Improved handwriting recognition
* [ ] Advanced legal document comparison
* [ ] Expanded government scheme coverage
* [ ] Improved legal research analytics
* [ ] Production-scale deployment

---

## ⚠️ Disclaimer

Lexora provides legal information and research assistance for educational and informational purposes.

It does not establish an advocate-client relationship and does not replace professional legal advice.

Legal rules can depend on jurisdiction, facts, dates, amendments, procedural requirements, and the specific circumstances of a case.

Users should verify important legal matters against authoritative sources and consult a qualified legal professional where appropriate.

---

## 👨‍💻 Project

**Lexora**

Tamil-first multilingual legal intelligence platform.

Built with a focus on:

**AI × Legal Research × Retrieval × Multilingual NLP × Accessibility**

---

## 📜 License

Add the project's intended license here before public redistribution.

If this repository is intended to remain private, repository access should be controlled through GitHub's private repository permissions.
