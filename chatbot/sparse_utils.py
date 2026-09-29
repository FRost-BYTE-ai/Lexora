"""
Lexora Deterministic Sparse Vector Representation
==================================================
Shared across ingestion and query-time retrieval to guarantee 100%
cross-process determinism and eliminate Python hash randomization (PYTHONHASHSEED).
"""

import zlib
import re
from typing import Tuple, List

VOCAB_SIZE = 100000

def compute_sparse_vector(text: str) -> Tuple[List[int], List[float]]:
    """
    Computes a deterministic term-frequency sparse vector for text.
    Uses CRC32 hashing over UTF-8 encoded stripped tokens.
    Returns:
        (indices, values) where indices are sorted integers in [0, VOCAB_SIZE-1].
    """
    if not text:
        return [], []
        
    # Standardize delimiters
    normalized = text.lower().replace('.', ' ').replace(',', ' ').replace(';', ' ').replace(':', ' ').replace('(', ' ').replace(')', ' ').replace('[', ' ').replace(']', ' ').replace('{', ' ').replace('}', ' ').replace('"', ' ').replace("'", " ")
    tokens = normalized.split()
    
    counts = {}
    for t in tokens:
        cleaned = re.sub(r'^[^\w]+|[^\w]+$', '', t)
        if len(cleaned) > 1:
            idx = zlib.crc32(cleaned.encode('utf-8')) % VOCAB_SIZE
            counts[idx] = counts.get(idx, 0) + 1.0
            
    indices = sorted(list(counts.keys()))
    values = [counts[i] for i in indices]
    return indices, values
