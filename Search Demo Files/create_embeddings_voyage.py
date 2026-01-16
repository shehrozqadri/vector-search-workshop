import pymongo
import voyageai

# --- PASTE YOUR CREDENTIALS HERE ---
MONGO_URI = "PASTE_YOUR_MONGODB_URI_HERE"
VOYAGE_API_KEY = "PASTE_YOUR_VOYAGE_API_KEY_HERE"
# -----------------------------------

try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client.sample_mflix
    collection = db.movies
    vo = voyageai.Client(api_key=VOYAGE_KEY)
    print("Connected to MongoDB and Voyage AI.")
except Exception as e:
    print(f"Connection Error: {e}")
    exit()

def get_embedding(text):
    # Voyage returns a list, so we take the first element [0]
    result = vo.embed([text], model="voyage-3", input_type="document")
    return result.embeddings[0]

# --- Fetching movies ---
print("Fetching movies that need embeddings...")

# Only fetch movies that satisfy BOTH conditions:
# 1. Have a plot
# 2. DO NOT have an embedding yet
cursor = collection.find({
    "plot": {"$exists": True}, 
    "plot_embeddings_voyage": {"$exists": False} 
})

count = 0

for doc in cursor:
    # We double-check that the plot isn't just an empty string ""
    if doc.get("plot"):
        try:
            print(f"Processing ({count}): {doc['title']}")
            
            # Generate vector
            vector = get_embedding(doc["plot"])
            
            # Save to MongoDB
            collection.update_one(
                {"_id": doc["_id"]},
                {"$set": {"plot_embeddings_voyage": vector}}
            )
            count += 1
            
        except Exception as e:
            print(f"Error processing {doc.get('title', 'unknown')}: {e}")

print(f"\nSuccess! Updated {count} movies with embeddings.")