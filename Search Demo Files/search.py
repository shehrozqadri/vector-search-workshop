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
except Exception as e:
    print(f"Connection Error: {e}")
    exit()

# 1. The Query
query_text = "movies about jail break"

# 2. Filter by Genre (Pre-Filtering)
filter_rule = {"genres": "Action"} # Movies that are listed as 'Action'

# Filter by Year (Uncomment to use)
# filter_rule = {"year": {"$gte": 2000}} # Movies released after year 2000

print(f"\nSearching for: '{query_text}'")
print(f"Applying Filter: {filter_rule}...\n")

try:
    # 3. Convert query to vector
    query_vector = vo.embed([query_text], model="voyage-3", input_type="query").embeddings[0]

    # 4. Run the search with filters
    pipeline = [
        {
            "$vectorSearch": {
                "index": "voyage_vector_index",
                "path": "plot_embeddings_voyage",
                "queryVector": query_vector,
                "numCandidates": 100,
                "limit": 5,
                # --- ADD FILTER HERE ---
                "filter": filter_rule
                # ----------------------------
            }
        },
        {
            "$project": {
                "_id": 0, 
                "title": 1, 
                "year": 1,      # Added year so you can see it
                "genres": 1,    # Added genres so you can verify the filter worked
                "plot": 1, 
                "score": {"$meta": "vectorSearchScore"}
            }
        }
    ]

    results = collection.aggregate(pipeline)

    # 5. Print results
    count = 0
    for result in results:
        count += 1
        print(f"Title:  {result.get('title', 'No Title')}")
        print(f"Year:   {result.get('year')}")
        print(f"Genres: {result.get('genres')}")
        print(f"Score:  {result.get('score', 0):.4f}")
        print(f"Plot:   {result.get('plot', '')[:100]}...") 
        print("-" * 30)
    
    if count == 0:
        print("No results found. (Check if your Index has 'type: filter' defined for these fields)")

except Exception as e:
    print(f"Search Error: {e}")