import os
import faiss
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List, Optional
import build_index

app = FastAPI(title="AI Tutor Indexer Service")

# ---------- CONFIG ----------
DATA_DIR = os.getenv("INDEXER_DATA_DIR", "data")
CONFIG_DIR = os.path.join(DATA_DIR, "config")
INDEX_FILE = os.path.join(CONFIG_DIR, "pdf_index.faiss")
METADATA_FILE = os.path.join(CONFIG_DIR, "metadata.txt")
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Global state
index = None
metadata = []
model = None

def load_resources():
    global index, metadata, model
    print("🔄 Loading resources...")
    
    # Load Model
    if model is None:
        model = SentenceTransformer(EMBEDDING_MODEL)
    
    # Load Index
    if os.path.exists(INDEX_FILE):
        index = faiss.read_index(INDEX_FILE)
    else:
        print("⚠️ Index file not found. Creating empty index.")
        d = 384
        index = faiss.IndexFlatL2(d)
        
    # Load Metadata
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            metadata = [line.strip() for line in f.readlines()]
    else:
        metadata = []
        
    print(f"✅ Resources loaded. Index size: {index.ntotal}, Metadata size: {len(metadata)}")

# Initial load
load_resources()

class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 5
    active_pdf: Optional[str] = None

@app.post("/rebuild")
def trigger_rebuild():
    """Triggers a full index rebuild."""
    try:
        result = build_index.build_index()
        load_resources() # Reload after build
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
def get_status():
    """Returns current index status."""
    return {
        "index_exists": os.path.exists(INDEX_FILE),
        "chunk_count": index.ntotal if index else 0,
        "metadata_count": len(metadata)
    }

@app.post("/retrieve")
def retrieve(req: RetrieveRequest):
    """Retrieves relevant chunks for a query."""
    print(f"🔍 [Retrieve] Query: '{req.query}', Active PDF: '{req.active_pdf}', Top K: {req.top_k}")
    
    if not index or index.ntotal == 0:
        print("⚠️ [Retrieve] Index is empty.")
        return {"results": []}
        
    query_vector = model.encode([req.query]).astype("float32")
    
    # Search more than k to account for filtering
    search_k = min(req.top_k * 10, index.ntotal) # Increased multiplier to find more candidates
    distances, indices = index.search(query_vector, search_k)
    
    results = []
    seen_chunks = set()
    
    for i, idx in enumerate(indices[0]):
        if idx < 0 or idx >= len(metadata):
            continue
            
        meta = metadata[idx]
        pdf_name, chunk_id = meta.split("|")
        
        # Filter by active PDF if specified
        if req.active_pdf:
            # Normalize for comparison (just in case)
            if req.active_pdf.strip().lower() != pdf_name.strip().lower():
                # print(f"  Skipping {pdf_name} (Active: {req.active_pdf})")
                continue
            
        if meta in seen_chunks:
            continue
            
        seen_chunks.add(meta)
        
        # Get text for this chunk
        text = ""
        try:
            chunk_idx = int(chunk_id.split("_")[1])
            pdf_path = os.path.join(build_index.PDF_FOLDER, pdf_name)
            
            full_text = build_index.extract_text_from_pdf(pdf_path)
            full_text = build_index.clean_text(full_text)
            chunks = build_index.chunk_text(full_text, build_index.CHUNK_SIZE, build_index.CHUNK_OVERLAP)
            
            if 0 <= chunk_idx < len(chunks):
                text = chunks[chunk_idx]
        except Exception as e:
            print(f"❌ Error getting text for {chunk_id}: {e}")
            text = "[Error extracting text]"

        results.append({
            "pdf_name": pdf_name,
            "chunk_id": chunk_id,
            "score": float(distances[0][i]),
            "text": text
        })
        
        if len(results) >= req.top_k:
            break
            
    print(f"✅ [Retrieve] Found {len(results)} results.")
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
