import os
import requests
import json

SUPABASE_URL = "https://abjuvmwpjapknuxqrefg.supabase.com"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFianV2bXdwamFwa251eHFyZWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjgxMzYsImV4cCI6MjA2NDA0NDEzNn0.HU_UW-vAcG-QOBljxtfCnlaMZehQs29hQ8Xx-ugq7RA"
EXPECTED_DIM = 1536  # Change if your embedding dimension is different

def fetch_chunks(limit=20):
    url = f"{SUPABASE_URL}/rest/v1/document_chunks?select=id,embedding,document_id&limit={limit}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    return resp.json()

def fetch_document_ids():
    url = f"{SUPABASE_URL}/rest/v1/documents?select=id"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    return set(doc['id'] for doc in resp.json())

def check_embeddings():
    print("Checking embeddings...")
    chunks = fetch_chunks()
    doc_ids = fetch_document_ids()
    for chunk in chunks:
        eid = chunk['id']
        emb = chunk['embedding']
        doc_id = chunk['document_id']

        # Check for missing embedding
        if emb is None:
            print(f"Chunk {eid} is missing embedding!")
            continue

        # Parse embedding
        try:
            # Embedding may be stored as a stringified list
            if isinstance(emb, str):
                emb_list = json.loads(emb)
            else:
                emb_list = emb
        except Exception as e:
            print(f"Chunk {eid} embedding could not be parsed: {e}")
            continue

        # Check dimension
        if not isinstance(emb_list, list) or len(emb_list) != EXPECTED_DIM:
            print(f"Chunk {eid} embedding has wrong dimension: {len(emb_list)}")
        
        # Check for NaN or extreme values
        if any((not isinstance(x, (int, float)) or x != x or abs(x) > 1e6) for x in emb_list):
            print(f"Chunk {eid} embedding has invalid values.")

        # Check for orphaned chunk
        if doc_id not in doc_ids:
            print(f"Chunk {eid} references missing document_id {doc_id}")

    print("Check complete.")

if __name__ == "__main__":
    check_embeddings() 