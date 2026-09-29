import os
import time
import psutil
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

model_path = "C:/Lexora/models/qwen3-0.6b-base"

print(f"Testing model loading from {model_path}...")

# Check device
device = "cpu"
if torch.cuda.is_available():
    device = "cuda"
    print("Using NVIDIA GPU.")
else:
    try:
        import torch_directml
        device = torch_directml.device()
        print("Using AMD GPU via DirectML.")
    except ImportError:
        print("torch_directml not found. PyTorch is using CPU for inference.")

# Memory tracking helper
def get_memory_usage():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)

print(f"Initial Memory Usage: {get_memory_usage():.2f} MB")

# Load Tokenizer & Model
start_time = time.time()
try:
    tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
    # Using float32 for CPU compatibility, use bfloat16/float16 if desired
    model = AutoModelForCausalLM.from_pretrained(
        model_path, 
        local_files_only=True, 
        torch_dtype=torch.float32
    ).to(device)
    load_time = time.time() - start_time
    print(f"Model and Tokenizer loaded successfully in {load_time:.2f} seconds.")
    print(f"Memory Usage after loading: {get_memory_usage():.2f} MB")
except Exception as e:
    print(f"Failed to load model/tokenizer. Error: {e}")
    exit(1)

# Generation Test
prompt = "The quick brown fox"
inputs = tokenizer(prompt, return_tensors="pt").to(device)

print(f"\nRunning generation test...")
start_time = time.time()
try:
    outputs = model.generate(**inputs, max_new_tokens=20)
    gen_time = time.time() - start_time
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"Generation successful in {gen_time:.2f} seconds.")
    print(f"Input: {prompt}")
    print(f"Output: {response}")
    print(f"Final Memory Usage: {get_memory_usage():.2f} MB")
except Exception as e:
    print(f"Generation failed. Error: {e}")
    exit(1)
