import os
import re
import hashlib
import numpy as np
import faiss
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# ---------- CONFIG ----------
DATA_DIR = os.getenv("INDEXER_DATA_DIR", "data")
PDF_FOLDER = os.path.join(DATA_DIR, "staff_pdfs")
CONFIG_DIR = os.path.join(DATA_DIR, "config")
INDEX_FILE = os.path.join(CONFIG_DIR, "pdf_index.faiss")
METADATA_FILE = os.path.join(CONFIG_DIR, "metadata.txt")
HASH_FILE = os.path.join(CONFIG_DIR, "pdf_hash.txt")

CHUNK_SIZE = 800
CHUNK_OVERLAP = 200
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Ensure directories exist
os.makedirs(PDF_FOLDER, exist_ok=True)
os.makedirs(CONFIG_DIR, exist_ok=True)

def extract_text_from_pdf(pdf_path):
    """Extract text from a text-based PDF."""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text
    except Exception as e:
        print(f"❌ Error reading {pdf_path}: {e}")
        return ""

def clean_text(text):
    """Clean and normalize text."""
    text = re.sub(r'\s+', ' ', text)
    text = text.replace('\x00', '')
    return text.strip()

def chunk_text(text, chunk_size=800, overlap=200):
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end]
        # Only add if chunk has enough content
        if len(chunk.strip()) > 50: 
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def get_pdf_hashes():
    """Calculate hash of all PDFs to detect changes."""
    if not os.path.exists(PDF_FOLDER):
        return ""
    pdfs = [os.path.join(PDF_FOLDER, f) for f in os.listdir(PDF_FOLDER) if f.lower().endswith(".pdf")]
    hash_data = ""
    for pdf in sorted(pdfs):
        try:
            mtime = os.path.getmtime(pdf)
            hash_data += f"{pdf}-{mtime}"
        except OSError:
            continue
    return hashlib.md5(hash_data.encode()).hexdigest()

def update_hash():
    current_hash = get_pdf_hashes()
    with open(HASH_FILE, "w") as f:
        f.write(current_hash)

def build_index():
    """Builds the FAISS index from scratch."""
    print("🔄 Starting index build process...")
    
    model = SentenceTransformer(EMBEDDING_MODEL)
    embeddings = []
    metadata = []
    
    pdf_files = [f for f in os.listdir(PDF_FOLDER) if f.lower().endswith(".pdf")]
    
    if not pdf_files:
        print("⚠️ No PDFs found in staff_pdfs folder.")
        # Create empty index if no files
        d = 384 # Dimension for all-MiniLM-L6-v2
        index = faiss.IndexFlatL2(d)
        faiss.write_index(index, INDEX_FILE)
        with open(METADATA_FILE, "w", encoding="utf-8") as f:
            f.write("")
        update_hash()
        return {"status": "success", "message": "No PDFs found. Empty index created.", "chunk_count": 0}

    total_chunks = 0
    
    for filename in tqdm(pdf_files, desc="Processing PDFs"):
        path = os.path.join(PDF_FOLDER, filename)
        text = extract_text_from_pdf(path)
        text = clean_text(text)
        
        chunks = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)
        
        if not chunks:
            continue
            
        # Batch encode chunks
        try:
            batch_embeddings = model.encode(chunks)
            for i, emb in enumerate(batch_embeddings):
                embeddings.append(emb)
                metadata.append(f"{filename}|chunk_{i}")
            total_chunks += len(chunks)
        except Exception as e:
            print(f"❌ Error encoding chunks for {filename}: {e}")
            continue

    if embeddings:
        embeddings = np.vstack(embeddings).astype("float32")
        d = embeddings.shape[1]
        index = faiss.IndexFlatL2(d)
        index.add(embeddings)
        faiss.write_index(index, INDEX_FILE)
    else:
        # Create empty index
        d = 384
        index = faiss.IndexFlatL2(d)
        faiss.write_index(index, INDEX_FILE)

    # Save metadata
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        for m in metadata:
            f.write(m + "\n")
            
    update_hash()
    
    print(f"✅ Index built. Saved to {INDEX_FILE}")
    return {"status": "success", "chunk_count": len(metadata)}

if __name__ == "__main__":
    build_index()
