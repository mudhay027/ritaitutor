import os
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer

PDF_PATH = "data/staff_pdfs/UNIT_II_CN_NOTES.pdf"

print("Checking PDF...")
if os.path.exists(PDF_PATH):
    try:
        reader = PdfReader(PDF_PATH)
        print(f"PDF loaded. Pages: {len(reader.pages)}")
        text = reader.pages[0].extract_text()
        print(f"First page text length: {len(text)}")
    except Exception as e:
        print(f"Error reading PDF: {e}")
else:
    print("PDF not found")

print("Checking Model...")
try:
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    print("Model loaded successfully")
    emb = model.encode("test")
    print(f"Embedding shape: {emb.shape}")
except Exception as e:
    print(f"Error loading model: {e}")
