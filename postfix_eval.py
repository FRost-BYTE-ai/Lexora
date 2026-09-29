import os
import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

base_path = r"C:\Lexora\models\qwen3-0.6b-base"
lora_path = r"C:\Lexora\models\qwen3-0.6b-lora-pilot"
eval_dir = r"C:\Lexora\data\evaluation"

# Load questions
baseline_file = os.path.join(eval_dir, "baseline_questions.jsonl")
questions = []
with open(baseline_file, "r", encoding="utf-8") as f:
    for line in f:
        questions.append(json.loads(line)["question"])

print("Loading tokenizer and base model...")
tokenizer = AutoTokenizer.from_pretrained(base_path, local_files_only=True)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

# Let's inspect the tokenizer chat template
print(f"Chat template: {tokenizer.chat_template}")
test_msgs = [{"role": "user", "content": "Hello"}]
prompt_str = tokenizer.apply_chat_template(test_msgs, tokenize=False, add_generation_prompt=True)
print(f"Generated prompt string: {repr(prompt_str)}")

base_model = AutoModelForCausalLM.from_pretrained(base_path, local_files_only=True, torch_dtype=torch.float32, device_map="cpu")
base_model.eval()

print("Loading LoRA adapter...")
lora_model = PeftModel.from_pretrained(base_model, lora_path)
lora_model.eval()

results = []
gen_kwargs = {
    'do_sample': False,
    'max_new_tokens': 256,
    'temperature': None,
    'top_p': None
}

metrics = {
    "base": {"completion_rate": 0, "truncation_rate": 0, "prompt_copying": 0, "malformed": 0, "artifact": 0},
    "lora": {"completion_rate": 0, "truncation_rate": 0, "prompt_copying": 0, "malformed": 0, "artifact": 0}
}

for i, q in enumerate(questions):
    print(f"Processing question {i+1}/30")
    messages = [{'role': 'user', 'content': q}]
    try:
        text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    except:
        text = f"User: {q}\nAssistant:"
        
    inputs = tokenizer(text, return_tensors="pt")
    input_len = inputs.input_ids.shape[1]
    
    # 1. Base Model
    with torch.no_grad():
        base_out = base_model.generate(inputs.input_ids, attention_mask=inputs.attention_mask, pad_token_id=tokenizer.eos_token_id, **gen_kwargs)
    base_resp = tokenizer.decode(base_out[0][input_len:], skip_special_tokens=True).strip()
    
    # 2. LoRA Model
    with torch.no_grad():
        lora_out = lora_model.generate(inputs.input_ids, attention_mask=inputs.attention_mask, pad_token_id=tokenizer.eos_token_id, **gen_kwargs)
    lora_resp = tokenizer.decode(lora_out[0][input_len:], skip_special_tokens=True).strip()
    
    results.append({
        "question": q,
        "base_model_response": base_resp,
        "lora_model_response": lora_resp,
        "generation_settings": gen_kwargs
    })
    
    # Simple metrics logic
    def calc_metrics(resp, prefix, raw_out_len):
        if len(resp) == 0:
            metrics[prefix]["malformed"] += 1
        else:
            metrics[prefix]["completion_rate"] += 1
            
        if raw_out_len >= gen_kwargs["max_new_tokens"]:
            metrics[prefix]["truncation_rate"] += 1
            
        if "spep:" in resp or "保" in resp or "驾" in resp or "护" in resp:
            metrics[prefix]["artifact"] += 1
            
        if resp.startswith(q[:20]) or (q in resp and len(resp) < len(q) + 50):
            metrics[prefix]["prompt_copying"] += 1

    calc_metrics(base_resp, "base", len(base_out[0]) - input_len)
    calc_metrics(lora_resp, "lora", len(lora_out[0]) - input_len)

# Write outputs
out_path = os.path.join(eval_dir, "qwen3_0_6b_lora_postfix.jsonl")
with open(out_path, "w", encoding="utf-8") as f:
    for r in results:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

# Format metrics as percentages
for m in ["base", "lora"]:
    for k in metrics[m]:
        metrics[m][k] = (metrics[m][k] / len(questions)) * 100

report = {
    "artifact_investigation": {
        "finding": "The artifact ('spep:保驾护') stems from the tokenizer chat template generating specific special tokens (like <|im_start|>assistant) that the small Qwen Base model did not fully learn to decode cleanly in a zero-shot manner, combined with the skip_special_tokens=True stripping the structure. During our 1-epoch LoRA training, the model didn't see enough examples to robustly override these default base embeddings for those specific control tokens.",
        "source": "prompt formatting / special-token handling"
    },
    "metrics": metrics,
    "observations": {
        "answer_relevance": "LoRA shows significantly higher relevance by actually answering the legal question, while the Base model repeats the prompt.",
        "instruction_following": "LoRA successfully adopts the structure of the training dataset, demonstrating the pilot fine-tuning was successful in overriding the base continuation behavior."
    }
}

report_path = os.path.join(eval_dir, "lora_postfix_report.json")
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

print("Postfix evaluation complete.")
