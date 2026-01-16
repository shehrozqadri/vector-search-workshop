import pymongo
import voyageai

# --- CONFIGURATION ---
MONGO_URI = "PASTE_YOUR_MONGODB_URI_HERE"
VOYAGE_API_KEY = "PASTE_YOUR_VOYAGE_API_KEY_HERE"
DB_NAME = "sample_mflix"
COLLECTION_NAME = "movies"

# Index Names
VECTOR_INDEX_NAME = "voyage_vector_index"
TEXT_INDEX_NAME = "plot_search_index" 

try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    vo = voyageai.Client(api_key=VOYAGE_KEY)
except Exception as e:
    print(f"Connection Error: {e}")
    exit()

def hybrid_search(query, k=60):
    print(f"\nRunning Hybrid Search for: '{query}'")

    # 1. Generate Vector
    query_vector = vo.embed([query], model="voyage-3", input_type="query").embeddings[0]

    # 2. Define the RRF Pipeline
    pipeline = [
        # --- Stage A: Vector Search ---
        {
            "$vectorSearch": {
                "index": VECTOR_INDEX_NAME,
                "path": "plot_embeddings_voyage",
                "queryVector": query_vector,
                "numCandidates": 50,
                "limit": 20
            }
        },
        # Extract score to a field first
        {
            "$addFields": {
                "vs_score": { "$meta": "vectorSearchScore" }
            }
        },
        # Sort by that new field
        {
            "$setWindowFields": {
                "sortBy": { "vs_score": -1 },
                "output": { "vectorRank": { "$documentNumber": {} } }
            }
        },
        {
            "$project": {
                "_id": 1,
                "title": 1,
                "plot": 1,
                "vectorRank": 1, 
                "textRank": { "$literal": None } 
            }
        },
        # --- Stage B: Text Search (Union) ---
        {
            "$unionWith": {
                "coll": COLLECTION_NAME,
                "pipeline": [
                    {
                        "$search": {
                            "index": TEXT_INDEX_NAME,
                            "text": {
                                "query": query,
                                "path": "plot"
                            }
                        }
                    },
                    { "$limit": 20 },
                    # Extract text score to a field first
                    {
                        "$addFields": {
                            "ts_score": { "$meta": "searchScore" }
                        }
                    },
                    # Sort by that new field
                    {
                        "$setWindowFields": {
                            "sortBy": { "ts_score": -1 },
                            "output": { "textRank": { "$documentNumber": {} } }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "title": 1,
                            "plot": 1,
                            "vectorRank": { "$literal": None }, 
                            "textRank": 1
                        }
                    }
                ]
            }
        },
        # --- Stage C: RRF Math ---
        {
            "$group": {
                "_id": "$_id",
                "title": { "$first": "$title" },
                "plot": { "$first": "$plot" },
                "vectorRank": { "$max": "$vectorRank" },
                "textRank": { "$max": "$textRank" }
            }
        },
        {
            "$addFields": {
                "rrf_score": {
                    "$add": [
                        {
                            "$cond": [
                                { "$ifNull": ["$vectorRank", False] },
                                { "$divide": [1.0, { "$add": [k, "$vectorRank"] }] },
                                0
                            ]
                        },
                        {
                            "$cond": [
                                { "$ifNull": ["$textRank", False] },
                                { "$divide": [1.0, { "$add": [k, "$textRank"] }] },
                                0
                            ]
                        }
                    ]
                }
            }
        },
        { "$sort": { "rrf_score": -1 } },
        { "$limit": 5 }
    ]

    results = collection.aggregate(pipeline)

    # 3. Print
    count = 0
    for i, result in enumerate(results, 1):
        count += 1
        print(f"\n{i}. {result.get('title')}")
        print(f"   RRF Score:   {result.get('rrf_score'):.4f}")
        print(f"   Vector Rank: {result.get('vectorRank', 'N/A')}")
        print(f"   Text Rank:   {result.get('textRank', 'N/A')}")
        
        # --- CHANGED: Removed [:100] to show the full plot ---
        print(f"   Plot:        {result.get('plot', '')}") 
        print("-" * 50) # Adds a separator line for readability

    if count == 0:
        print("\nNo results found.")

# --- Run ---
hybrid_search("movies about space adventure")