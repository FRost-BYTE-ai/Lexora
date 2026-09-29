# DEEP TANGLISH CONTEXT RESOLUTION REPORT

## 1. Root Cause
The previous `understand_query` network in `query_understanding.py` (Step 8: Query Contextualization) was suffering from three critical flaws that degraded deep multi-turn contexts:
1. **English-Only Pronouns:** It exclusively monitored English pronouns (`he`, `she`, `they`) to decide if a query was a follow-up, completely ignoring elliptical Tanglish references like `avan`, `adhukku`, `andha matter`.
2. **Assistant Text Dilution:** When resolving context, it concatenated the user's new query with the *entire text of the assistant's previous response* (`last_turn = conversation_context[-1].get("content")`). Over 5 turns, this ballooned the retrieval query into a massive, diluted block of generated text, destroying the precise legal keywords needed for vector search.
3. **Loss of Session State:** The query understanding layer discarded the heavily computed `expanded_legal_concepts`, `domain`, and `jurisdiction` from previous turns, treating every query as a fresh semantic search if it didn't explicitly mention the jurisdiction again.

## 2. General Architectural Fix
I implemented a robust state-management solution across the pipeline:
1. **State Preservation (`chatbot.py`):** The `query_plan` (containing the resolved jurisdiction, domain, and expanded concepts) is now systematically saved into the `session.turns` metadata for every user message.
2. **Deep Reference Detection (`query_understanding.py`):** Injected a comprehensive array of Tanglish pronouns and elliptical pointers (`avan`, `ava`, `avanga`, `adhukku`, `athukku`, `athula`, `indha`, `andha`, `matter`, `issue`, `appo`, `apdi`, `enna`) alongside the English pointers.
3. **Contextual Semantic Anchoring:** Instead of concatenating the LLM's long-winded answer, the system now walks backwards through `session.turns`, locates the last valid `query_plan`, and anchors the new retrieval query directly to the *previous normalized query* while explicitly carrying over the `jurisdiction` and `expanded_legal_concepts`. 

## 3. Files Changed
*   `C:\Lexora\chatbot\chatbot.py`
*   `C:\Lexora\chatbot\query_understanding.py`
*   `C:\Lexora\tanglish_deep_test.py` (Created for the 10-conversation evaluation)

## 4. 10 Deep-Tanglish Test Results
The 10 deep conversations (covering assault, theft, property disputes, cooperative issues, and procedure) were executed successfully up to 7 turns each.
*   **Result:** **10/10 PASS**. 
*   **Observation:** The system consistently maintained the `legal_domain` and `jurisdiction`. For instance, in the "Cooperative dispute" test, asking *"Registrar kitta complaint poga mudiyuma?"* correctly persisted the Tamil Nadu Cooperative Societies Act domain from the first turn, instead of broadly searching central government registrar laws.

## 5. Existing Regression Results
*   19 Baseline Integration Tests: **PASS**
*   15 Unseen Criminal Tests: **PASS**
*   Scope & Insufficient Evidence Tests: **PASS**
*   **No regressions occurred.** The fix simply anchors the semantic retrieval; it does not alter the rigorous scope guard or the RAG insufficiency threshold.

## 6. Remaining Ambiguity Cases
While the general context resolution is vastly improved, the system is not perfectly omniscient. 
*   **Ambiguity:** If a user jumps wildly between unrelated topics within the *same* session using heavy Tanglish pronouns (e.g., Turn 1: Discussing neighbor threat. Turn 2: Discussing property forgery. Turn 3: *"Avanuku bail kedaikuma?"*), the system may struggle to determine if "avan" refers to the threatening neighbor or the property forger. 
*   **Behavior:** In these genuinely ambiguous edge cases, the system defaults to blending the concepts, which can occasionally trigger the ambiguous scope guard asking the user for clarification (exactly as desired).
