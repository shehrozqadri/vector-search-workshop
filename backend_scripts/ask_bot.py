import os
from pymongo import MongoClient
from langchain_voyageai import VoyageAIEmbeddings
from langchain_community.vectorstores import MongoDBAtlasVectorSearch
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq

# --- CONFIGURATION ---
# 1. Credentials
MONGO_URI = "PASTE_YOUR_MONGODB_URI_HERE"
VOYAGE_API_KEY = "PASTE_YOUR_VOYAGE_API_KEY_HERE" 
GROQ_API_KEY = "PASTE_YOUR_GROQ_API_KEY_HERE"

# --- MAIN SETUP ---

# 1. Connect to MongoDB
try:
    client = MongoClient(MONGO_URI)
    collection = client["rag_demo"]["aggregations_knowledge"]
except Exception as e:
    print(f"MongoDB Connection Error: {e}")
    exit()

# 2. Initialize Embeddings (Voyage AI)
# This converts user questions into vectors (numbers)
embeddings = VoyageAIEmbeddings(
    voyage_api_key=VOYAGE_API_KEY, 
    model="voyage-3"
)

# 3. Connect to Vector Store
# This connects to your "Filing Cabinet" in MongoDB
vector_store = MongoDBAtlasVectorSearch(
    collection=collection,
    embedding=embeddings,
    index_name="vector_index"
)

# 4. Retriever
# We ask MongoDB to find the top 3 most relevant pages
retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 3})

# 5. Initialize LLM (Groq)
# Connecting to Llama 3.3 (70 Billion Parameters) via Groq
print("Connecting to Groq (Llama 3.3)...")
llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name="llama-3.3-70b-versatile", 
    temperature=0.1
)

# 6. Create Chain
# This links the Retriever (Data) with the LLM (Brain)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    return_source_documents=True
)

# --- INTERACTIVE LOOP ---
print("\n--- MongoDB Aggregations Expert Bot (Powered by Groq) ---")
print("Type 'exit' to quit.\n")

while True:
    query = input("Ask a question: ")
    if query.lower() == "exit":
        break
    
    try:
        response = qa_chain.invoke({"query": query})
        print(f"\nAnswer: {response['result']}")
        
        print("\n[Source Information]")
        if 'source_documents' in response:
            for doc in response['source_documents']:
                page_num = doc.metadata.get('page', 'N/A')
                print(f"- Source: Page {page_num}")
        print("-" * 40)
        
    except Exception as e:
        print(f"Error: {e}")