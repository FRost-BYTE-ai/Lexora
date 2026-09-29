import os
import sys
import json
import time
import psutil
import math
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForLanguageModeling, TrainerCallback
from datasets import load_dataset
from peft import LoraConfig, get_peft_model
import warnings
warnings.filterwarnings("ignore")

model_path = r"C:\Lexora\models\qwen3-0.6b-base"
train_path = r"C:\Lexora\data\training\final\train.jsonl"
val_path = r"C:\Lexora\data\training\final\validation.jsonl"
output_dir = r"C:\Lexora\models\qwen3-0.6b-lora-pilot"

os.makedirs(output_dir, exist_ok=True)

def get_ram_gb():
    return psutil.Process(os.getpid()).memory_info().rss / (1024**3)

print("Loading datasets...")
dataset = load_dataset('json', data_files={'train': train_path, 'validation': val_path})

print("Loading tokenizer and base model...")
tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

def tokenize_function(examples):
    texts = []
    for msgs in examples["messages"]:
        try:
            t = tokenizer.apply_chat_template(msgs, tokenize=False)
        except Exception:
            t = f"User: {msgs[0]['content']}\nAssistant: {msgs[1]['content']}"
        texts.append(t)
    return tokenizer(texts, truncation=True, max_length=1024)

print("Tokenizing datasets...")
tokenized_train = dataset['train'].map(tokenize_function, batched=True, remove_columns=["messages"])
tokenized_val = dataset['validation'].map(tokenize_function, batched=True, remove_columns=["messages"])

model = AutoModelForCausalLM.from_pretrained(
    model_path, 
    local_files_only=True,
    torch_dtype=torch.float32, 
    device_map="cpu"
)

# Freeze base model check
for param in model.parameters():
    param.requires_grad = False

print("\n--- LoRA Configuration ---")
peft_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(model, peft_config)

trainable_params = 0
all_param = 0
for _, param in model.named_parameters():
    num_params = param.numel()
    if num_params == 0 and hasattr(param, "ds_numel"):
        num_params = param.ds_numel
    all_param += num_params
    if param.requires_grad:
        trainable_params += num_params
        
print(f"Target Modules: {peft_config.target_modules}")
print(f"LoRA Rank (r): {peft_config.r}")
print(f"LoRA Alpha: {peft_config.lora_alpha}")
print(f"LoRA Dropout: {peft_config.lora_dropout}")
print(f"Trainable params: {trainable_params:,d}")
print(f"Total params: {all_param:,d}")
print(f"Trainable %: {100 * trainable_params / all_param:.4f}\n")

class LoggingCallback(TrainerCallback):
    def on_log(self, args, state, control, logs=None, **kwargs):
        if logs:
            loss = logs.get("loss")
            val_loss = logs.get("eval_loss")
            if loss is not None and (math.isnan(loss) or math.isinf(loss)):
                print("CRITICAL: NaN or Inf loss detected. Stopping training immediately.")
                control.should_training_stop = True
            ram = get_ram_gb()
            step = state.global_step
            print(f"[Step {step}] Loss: {loss} | Val Loss: {val_loss} | LR: {logs.get('learning_rate')} | RAM: {ram:.2f} GB")

training_args = TrainingArguments(
    output_dir=output_dir,
    per_device_train_batch_size=1,
    per_device_eval_batch_size=1,
    gradient_accumulation_steps=8,
    num_train_epochs=1,
    learning_rate=2e-4,
    fp16=False,
    bf16=False,
    logging_steps=5,
    eval_strategy="epoch",
    save_strategy="epoch",
    gradient_checkpointing=True,
    optim="adamw_torch",
    remove_unused_columns=False,
)

data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

trainer = Trainer(
    model=model,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_val,
    args=training_args,
    data_collator=data_collator,
    callbacks=[LoggingCallback()]
)

print(f"Starting full pilot training. Initial RAM: {get_ram_gb():.2f} GB")
start_time = time.time()
train_result = trainer.train()
end_time = time.time()

print(f"\nTraining completed in {end_time - start_time:.2f} seconds.")
trainer.model.save_pretrained(output_dir)
print(f"Saved LoRA adapter to {output_dir}")

# Log final metrics for the evaluation step to consume
final_metrics = {
    "train_loss": train_result.metrics.get("train_loss", 0.0),
    "training_time": end_time - start_time,
}
with open(os.path.join(output_dir, "final_metrics.json"), "w") as f:
    json.dump(final_metrics, f)
