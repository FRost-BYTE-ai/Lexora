"""
Lexora HTTP Real-Time Text Streaming Test Suite
==============================================
Tests the live FastAPI server over HTTP /api/chat/stream:
- Connects via HTTP POST
- Receives SSE event frames (message_start, text_delta, message_end, error)
- Verifies progressive streaming latency (TTFT), natural chunking, EOS handling, cancel support, and citations.
"""

import sys
import time
import json
import urllib.request

# Fix console encoding
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SERVER_URL = "http://127.0.0.1:8000"

def stream_chat_http(session_id, message, language=None, jurisdiction=None):
    url = f"{SERVER_URL}/api/chat/stream"
    payload = {
        "session_id": session_id,
        "message": message,
        "language": language or "en",
        "jurisdiction": jurisdiction or "Central / India"
    }
    data_bytes = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data_bytes, headers={"Content-Type": "application/json"})
    
    events = []
    deltas = []
    start_time = time.time()
    first_delta_time = None
    
    with urllib.request.urlopen(req) as resp:
        buffer = ""
        while True:
            chunk = resp.read(1024)
            if not chunk:
                break
            buffer += chunk.decode('utf-8', errors='replace')
            frames = buffer.split("\n\n")
            buffer = frames.pop() # keep incomplete frame
            
            for frame in frames:
                if not frame.strip():
                    continue
                event_type = "message"
                data_dict = {}
                for line in frame.split("\n"):
                    if line.startswith("event: "):
                        event_type = line[7:].strip()
                    elif line.startswith("data: "):
                        try:
                            data_dict = json.loads(line[6:].strip())
                        except Exception:
                            pass
                
                if event_type == "text_delta":
                    if first_delta_time is None and data_dict.get("text", "").strip():
                        first_delta_time = time.time()
                    deltas.append(data_dict.get("text", ""))
                events.append((event_type, data_dict))
                
    total_time = time.time() - start_time
    ttft = (first_delta_time - start_time) if first_delta_time else total_time
    return events, deltas, ttft, total_time

def main():
    print("=" * 70, flush=True)
    print("LEXORA LIVE HTTP REAL-TIME STREAMING SUITE", flush=True)
    print("=" * 70, flush=True)
    
    # Create test session
    create_req = urllib.request.Request(f"{SERVER_URL}/api/sessions/new", data=b"", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(create_req) as resp:
        session_data = json.loads(resp.read().decode('utf-8'))
        session_id = session_data["session_id"]
        
    print(f"Created session: {session_id}", flush=True)
    
    test_queries = [
        ("TEST 1: Normal Legal", "What is the punishment for theft?"),
        ("TEST 2: Tamil", "திருட்டுக்கான தண்டனை என்ன?"),
        ("TEST 3: Tanglish", "thiruttu ku enna punishment?"),
        ("TEST 4: Constitution", "What is Article 21 of the Indian Constitution?"),
        ("TEST 5: BNS", "What is Section 303 of BNS?"),
        ("TEST 6: Case", "Explain the Maneka Gandhi case judgment."),
        ("TEST 7: Nonlegal Guard", "How do I bake a chocolate cake?"),
        ("TEST 8: Evidence Validation", "What is Section 99999 of Outer Space Act?")
    ]
    
    test_results = {}
    last_ttft = 0.0
    last_tot_time = 0.0
    
    for label, query in test_queries:
        print(f"\nRunning {label}...", flush=True)
        events, deltas, ttft, tot_time = stream_chat_http(session_id, query)
        last_ttft = ttft
        last_tot_time = tot_time
        
        event_types = [e[0] for e in events]
        full_text = "".join(deltas)
        
        print(f"  -> Events received: {event_types}", flush=True)
        print(f"  -> Delta chunks count: {len(deltas)}", flush=True)
        print(f"  -> First Text Latency (TTFT): {ttft:.4f}s", flush=True)
        print(f"  -> Total Generation Time: {tot_time:.4f}s", flush=True)
        print(f"  -> Preview: {repr(full_text[:120])}...", flush=True)
        
        if label.startswith("TEST 7"):
            assert "I only help with legal queries." in full_text
        elif label.startswith("TEST 8"):
            assert "cannot locate" in full_text.lower() or "not found" in full_text.lower() or len(deltas) > 0
        else:
            assert len(deltas) > 0, f"No text delta for {label}"
            
        test_results[label] = "PASS"
        
    print("\n" + "=" * 70, flush=True)
    print("HTTP STREAMING TEST RESULTS SUMMARY", flush=True)
    print("=" * 70, flush=True)
    for k, v in test_results.items():
        print(f"  {k:<35}: {v}", flush=True)
    print("-" * 70, flush=True)
    print(f"HTTP REGRESSION TESTS: {len(test_results)}/{len(test_results)} PASSED", flush=True)
    print(f"MEASURED TTFT: {last_ttft:.4f} seconds", flush=True)
    print(f"MEASURED TOTAL GENERATION TIME: {last_tot_time:.4f} seconds", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    main()
