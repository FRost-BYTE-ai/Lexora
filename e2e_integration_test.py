import os
import sys
import time
import requests
import psutil
import subprocess

PORT = 8000
BASE_URL = f"http://127.0.0.1:{PORT}"

def wait_for_server(proc):
    print("Waiting for server to start...")
    for _ in range(60):
        try:
            res = requests.get(f"{BASE_URL}/api/health")
            if res.status_code == 200:
                print("Server is healthy!")
                return True
        except:
            pass
        if proc.poll() is not None:
            print("Server crashed.")
            return False
        time.sleep(2)
    return False

def get_ram_gb(pid):
    try:
        p = psutil.Process(pid)
        return p.memory_info().rss / (1024**3)
    except:
        return 0

def run_tests():
    server_env = os.environ.copy()
    server_env["USE_LORA"] = "true"
    
    proc = None
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=2)
        already_running = (r.status_code == 200)
    except:
        already_running = False

    if already_running:
        print("Server is already running on port 8000. Reusing live server.")
        ram_startup = 0
    else:
        print("Starting server process...")
        proc = subprocess.Popen(["python", r"C:\Lexora\server.py"], env=server_env)
        
        if not wait_for_server(proc):
            proc.kill()
            return

        ram_startup = get_ram_gb(proc.pid)
    
    session_id = None

    def send_chat(msg, sess_id=""):
        t0 = time.time()
        res = requests.post(f"{BASE_URL}/api/chat", json={"message": msg, "session_id": sess_id})
        dt = time.time() - t0
        return res.json(), dt

    tests = [
        {"desc": "A. Basic legal", "msg": "What is Article 21?"},
        {"desc": "B. BNS", "msg": "What is the punishment for theft?"},
        {"desc": "C. Natural language", "msg": "Someone stole my phone from my pocket."},
        {"desc": "D1. Follow-up 1", "msg": "My neighbour threatened me."},
        {"desc": "D2. Follow-up 2", "msg": "He said he would kill me."},
        {"desc": "D3. Follow-up 3", "msg": "What can I do legally?"},
        {"desc": "E. Tanglish", "msg": "En phone ah pocket la irundhu thiruditaanga, enna legal action?"},
        {"desc": "F. Non-legal", "msg": "Tell me a chicken recipe."},
        {"desc": "I. Insufficient evidence", "msg": "What is the punishment for flying a drone on Mars?"}
    ]
    
    report = {}
    report["health"] = requests.get(f"{BASE_URL}/api/health").json()
    report["ram_startup_gb"] = ram_startup
    report["tests"] = []
    
    print("Running queries...")
    for idx, t in enumerate(tests):
        print(f"Testing {t['desc']}...")
        if "Follow-up" not in t['desc'] and "Non-legal" not in t['desc']:
            # Create a new session for independent tests
            sess_res = requests.post(f"{BASE_URL}/api/sessions/new?title=Test")
            session_id = sess_res.json()["session_id"]
        
        data, dt = send_chat(t["msg"], session_id)
        
        ram_now = get_ram_gb(proc.pid) if proc else 0
        report["tests"].append({
            "desc": t["desc"],
            "query": t["msg"],
            "response": data.get("response", ""),
            "scope": data.get("scope", ""),
            "sufficient": data.get("evidence_sufficient", True),
            "sources_count": len(data.get("source_metadata", [])),
            "ram_gb": ram_now,
            "latency_s": dt
        })
        
    print("Testing isolated new consultation...")
    sess2_res = requests.post(f"{BASE_URL}/api/sessions/new?title=NewContext")
    s2_id = sess2_res.json()["session_id"]
    data, dt = send_chat("What did I just say about my neighbour?", s2_id)
    report["tests"].append({
        "desc": "G. New consultation isolation",
        "query": "What did I just say about my neighbour?",
        "response": data.get("response", ""),
        "ram_gb": get_ram_gb(proc.pid) if proc else 0
    })
    
    if proc:
        proc.kill()
    
    import json
    with open(r"C:\Lexora\data\evaluation\e2e_integration_report.json", "w") as f:
        json.dump(report, f, indent=2)
    print("E2E tests complete.")

if __name__ == "__main__":
    run_tests()
