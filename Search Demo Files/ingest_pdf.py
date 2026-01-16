import os
from pymongo import MongoClient
# CHANGED: Using PyMuPDFLoader which is more robust
from langchain_community.document_loaders import PyMuPDFLoader 
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_voyageai import VoyageAIEmbeddings
from langchain_community.vectorstores import MongoDBAtlasVectorSearch

# --- 1. CREDENTIALS ---
MONGO_URI = "PASTE_YOUR_MONGODB_URI_HERE"
VOYAGE_API_KEY = "PASTE_YOUR_VOYAGE_API_KEY_HERE"

# --- 2. SETUP ---
PDF_FILENAME = "Practical MongoDB Aggregations Book.pdf"

try:
    client = MongoClient(MONGO_URI)
    collection = client["rag_demo"]["aggregations_knowledge"]
    print("Connected to MongoDB.")
except Exception as e:
    print(f"Connection Error: {e}")
    exit()

# --- 3. LOAD PDF ---
print(f"Loading PDF: {PDF_FILENAME}...")
try:
    # CHANGED: Using PyMuPDFLoader
    loader = PyMuPDFLoader(PDF_FILENAME) 
    data = loader.load()
    print(f"Successfully loaded {len(data)} pages.")
except Exception as e:
    print(f"Error loading PDF: {e}")
    exit()

# --- 4. CHUNK DATA ---
print("Splitting text into chunks...")
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
docs = text_splitter.split_documents(data)
print(f"Created {len(docs)} document chunks.")

# --- 5. EMBED & UPLOAD ---
print("Generating vectors and uploading to Atlas... (This might take a minute)")
embeddings = VoyageAIEmbeddings(
    voyage_api_key=VOYAGE_API_KEY, 
    model="voyage-3" 
)

vector_store = MongoDBAtlasVectorSearch.from_documents(
    documents=docs,
    embedding=embeddings,
    collection=collection,
    index_name="vector_index"
)

print("Success! The PDF content is now searchable in MongoDB.")