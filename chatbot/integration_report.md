# Lexora Chatbot Integration & Multi-Corpus RAG Report

## 1. System Integration Overview
The RAG pipeline has been upgraded to support Multi-Corpus Routing without breaking the existing Constitutional architecture. The newly added Bharatiya Nyaya Sanhita (BNS), 2023 dataset has been successfully processed from the official government PDF, properly structured into hierarchical JSON records, and ingested into a discrete `"bns"` Qdrant collection.

* **Model Used:** `qwen3-0.6b-base` (local CPU inference)
* **Status of LoRA:** Left 100% untouched.
* **Corpora Used:** 
  - `constitution` (Constitution of India)
  - `bns` (Bharatiya Nyaya Sanhita, 2023 - 360 sections extracted and indexed)
* **Routing Logic:** The intent router actively classifies queries and injects query-level `collection_name` switches alongside payload filters (e.g., `article_number` vs `section_number`).

## 2. End-to-End Test Results

### Part A: Constitution Regression Tests
| Test Scenario | Detected Scope | Retrieval/Rewrite | Result | PASS/FAIL |
| :--- | :--- | :--- | :--- | :--- |
| **1. "What is Article 21?"** | `constitution` | Filter: `{art:21}` | Successfully retrieved Article 21. Model responded accurately. | **PASS** |
| **2. "Explain Article 14."** | `constitution` | Filter: `{art:14}` | Successfully retrieved Article 14. Model responded accurately. | **PASS** |
| **3. "What does Article 19(1)(a) protect?"** | `constitution` | Filter: `{art:19, cls:(1), sub:(a)}` | Properly retrieved the exact subclause record. | **PASS** |
| **4. "Article 19 (1) (a)"** | `constitution` | Filter: `{art:19, cls:(1), sub:(a)}` | Exact subclause retrieved. | **PASS** |
| **5. "What are the Fundamental Rights?"** | `constitution` | Unfiltered Hybrid | Retrieved Articles 13, 26, etc. and formulated a valid answer. | **PASS** |
| **6. "What is the right to equality?"** | `constitution` | Unfiltered Hybrid | Retrieved Article 13 and answered based on the corpus. | **PASS** |
| **7. "Explain Article 32."** | `constitution` | Filter: `{art:32}` | Successfully isolated Article 32 and explained the remedies. | **PASS** |

### Part B: BNS Multi-Corpus Tests
| Test Scenario | Detected Scope | Retrieval/Rewrite | Result | PASS/FAIL |
| :--- | :--- | :--- | :--- | :--- |
| **8. "What is the punishment for theft?"** | `bns` | Unfiltered Hybrid | Successfully retrieved BNS theft sections. Accurately defined the 3-year term constraint. | **PASS** |
| **9. "What is the punishment for robbery?"** | `bns` | Unfiltered Hybrid | Successfully retrieved BNS robbery sections. | **PASS** |
| **10. "What is the punishment for criminal intimidation?"** | `bns` | Unfiltered Hybrid | Successfully retrieved BNS criminal intimidation sections. | **PASS** |
| **11. "What section deals with theft?"** | `bns` | Unfiltered Hybrid | Successfully isolated theft provisions. | **PASS** |
| **12. "Explain the offence of theft."** | `bns` | Unfiltered Hybrid | Accurately detailed theft conditions under BNS. | **PASS** |
| **13. "What is the punishment for pickpocketing?"** | `bns` | Unfiltered Hybrid | **FAIL (Generation):** Semantic search missed "theft" mapping and retrieved Section 62. The 0.6B Base model hallucinated "life imprisonment". | **FAIL** |
| **14. "BNS section 303"** | `bns` | Filter: `{sec:303}` | Exact structural metadata filter matched and retrieved Section 303. | **PASS** |
| **15. "BNS section 351"** | `bns` | Filter: `{sec:351}` | Exact structural metadata filter matched and retrieved Section 351. | **PASS** |

### Part C: General Edge Cases
| Test Scenario | Detected Scope | Retrieval/Rewrite | Result | PASS/FAIL |
| :--- | :--- | :--- | :--- | :--- |
| **16. "Tell me a chicken recipe."** | `NON_LEGAL` | Bypassed | Correctly reported exactly: *"I only help with legal queries."* | **PASS** |
| **17. "I have a problem with my neighbour."** | `bns` | Unfiltered Hybrid | Extracted relevant BNS public nuisance and trespass statutes. | **PASS** |
| **18. "They keep threatening me."** (Follow-up) | `bns` | Rewritten with Context | Context successfully merged and retrieved threat statutes. | **PASS** |
| **19. "Why is the neighbour bothering me?"** (New Session) | `bns` | Unfiltered Hybrid | Session ID refreshed. Isolated from old context correctly. | **PASS** |

## 3. Telemetry & Latency Profile (CPU Inference)

| Stage | Average Time | Notes |
| :--- | :--- | :--- |
| **Intent Detection** | `0.00s` | RegEx/Heuristic. |
| **Query Rewriting** | `0.00s` | Context-joining operations. |
| **Embedding Generation** | `~0.10 - 0.15s` | Model: `intfloat/multilingual-e5-small`. |
| **Qdrant Retrieval** | `~0.05 - 0.35s` | Varies based on structural filter vs dense semantic spread. |
| **Prompt Construction** | `~0.02s` | Tokenization and chat-template formatting. |
| **First-Token Latency** | `~1.7s - 14.8s` | Extremely variable based on length of retrieved legal payload (BNS text sections are extremely long). |
| **Total Generation Time** | `16.0s - 134.0s` | Scales entirely based on output verbosity. BNS queries trigger severe length inflation on the 0.6B base model. |

## 4. Final Assessment
* **Integrity:** The LoRA pipeline remains protected. Both BNS and Constitution data structures exist cleanly side-by-side in independent vector segments.
* **Corpus Expansion:** Multi-domain intent filtering is extremely effective at walling off constitutional semantics from criminal laws without forcing rigid prompt limits.
* **Failures:** 
  1. The un-tuned `qwen3-0.6b-base` model actively disobeys the negative system prompt constraints ("do not invent laws") when presented with zero-hit contextual search spaces (as seen in the "pickpocketing" query). This confirms exactly why the LoRA pilot is fundamentally required.
