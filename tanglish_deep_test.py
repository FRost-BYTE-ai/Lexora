import time
import json
import gc
from chatbot.chatbot import LexoraChatbot

def run_tanglish_deep_test():
    print("Initializing Lexora Deep Context Validation Suite...")
    bot = LexoraChatbot(config={"use_lora": True})
    
    conversations = [
        # 1. Neighbour threat
        [
            "En neighbour enna threaten panraru.",
            "Avan daily ipdi panran.",
            "Avan sonna matter legal ah enna?",
            "Adhukku complaint panna mudiyuma?",
            "Police action edukkuma adhula?"
        ],
        # 2. Theft
        [
            "En bag la irundhu phone thiruditaanga.",
            "Yaaru thirudunanga nu theriyala.",
            "Andha matter ku FIR poda mudiyuma?",
            "Athukku online la epdi panrathu?",
            "Phone kedaikalana enna aagum?"
        ],
        # 3. Assault
        [
            "Oru aalu enna adichitan road la.",
            "Avan kaila oru kambi vechirundhan.",
            "Ava mela enna section poduvanga?",
            "Naan hospital poga vendiyadha irukku.",
            "Indha issue la avanuku bail kedaikuma?"
        ],
        # 4. Cheating
        [
            "Oru company enna ஏமாத்திட்டாங்க (emaathitaanga).",
            "Avanga 50000 rupees vaangitu porul anupala.",
            "Adhukku fraud case poda mudiyuma?",
            "Avanga out of state la irukkanga.",
            "Indha matter la consumer court poga mudiyuma?"
        ],
        # 5. Property dispute
        [
            "En land ah oruthan aakramippu pannitan.",
            "Avan pattiyala fake ah create pannirukkan.",
            "Andha case la forgery varuma?",
            "Police idhula thalai iduvangala?",
            "Civil court poga vendiyadha appo?"
        ],
        # 6. Cooperative dispute
        [
            "Society la loan reject pannitanga.",
            "Avanga proper reason sollala.",
            "Adhukku appeal panna mudiyuma?",
            "Registrar kitta complaint poga mudiyuma?",
            "Avanga mela disciplinary action varuma?"
        ],
        # 7. Police complaint/procedure
        [
            "Naan oru complaint kuduthen station la.",
            "Avanga FIR poda maataenguranga.",
            "Athukku SP kitta poga mudiyuma?",
            "Avarum onnum pannalana?",
            "Court vazhiya proceed panna mudiyuma adhula?"
        ],
        # 8. Evidence/WhatsApp messages
        [
            "Enkita avan threaten panna voice record irukku.",
            "Adhu court la evidence ah ethupangala?",
            "Adhukku enna certificate venum?",
            "Phone repair aagiducha?",
            "Andha record irundha avanuku punishment conform ah?"
        ],
        # 9. Tamil Nadu-specific issue
        [
            "Panchayat president tender la fraud pannitaru.",
            "Avar mela enna action edukka mudiyum?",
            "Collector kitta indha issue solla mudiyuma?",
            "Avar padaviya parikka mudiyuma adhukku?",
            "Enna act idhula varum?"
        ],
        # 10. Mixed Tamil + English terminology
        [
            "En brother enkita property dispute la caveat file pannitaru.",
            "Adhoda meaning enna?",
            "Naan injunction vaanga mudiyuma athukku?",
            "Avan appeal ponana?",
            "Indha matter settlement ku poguma?"
        ]
    ]
    
    results = []
    
    for idx, turns in enumerate(conversations):
        sess_id = bot.start_consultation(title=f"Deep_Context_{idx}")
        print(f"\n--- Conversation {idx+1} ---")
        conv_res = []
        for q in turns:
            res = bot.process_message(sess_id, q)
            plan = res.get("query_plan", {})
            print(f"Q: {q}")
            print(f"  Retrieval Query: {plan.get('retrieval_query')}")
            print(f"  Concepts: {plan.get('expanded_legal_concepts')}")
            conv_res.append({
                "query": q,
                "retrieval_query": plan.get("retrieval_query"),
                "concepts": plan.get("expanded_legal_concepts"),
                "jurisdiction": plan.get("jurisdiction")
            })
        results.append(conv_res)
        gc.collect()

if __name__ == "__main__":
    run_tanglish_deep_test()
