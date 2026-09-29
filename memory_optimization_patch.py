import gc
import torch

def optimize_memory():
    # Force garbage collection
    gc.collect()
    # If any CUDA devices were used (not in this CPU-only setup, but good practice)
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

# We will apply this conceptually to the chatbot initialization to ensure old instances are cleared.
