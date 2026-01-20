import { MongoClient } from 'mongodb';

// NOTE: In Next.js, it's better to define the client outside the function
// to prevent reconnecting on every single request.
const client = new MongoClient(process.env.MONGO_URI);

export async function POST(req) {
  console.log("------------------------------------------");
  console.log("1. Received Search Request");

  try {
    const { query } = await req.json();
    console.log("2. Query:", query);

    if (!process.env.VOYAGE_API_KEY) {
      throw new Error("Missing VOYAGE_API_KEY in .env file");
    }

    // --- Step A: Get Embedding ---
    console.log("3. Fetching embedding from Voyage AI...");
    const embeddingResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
      },
      body: JSON.stringify({
        input: query,
        model: "voyage-3"
      })
    });

    const embeddingData = await embeddingResponse.json();

    if (!embeddingData.data) {
      console.error("Voyage Error:", embeddingData);
      throw new Error("Failed to get embedding from Voyage AI");
    }

    const vector = embeddingData.data[0].embedding;
    console.log("4. Got Embedding! (Length: " + vector.length + ")");

    // --- Step B: Connect to MongoDB ---
    console.log("5. Connecting to MongoDB...");
    await client.connect();
    const db = client.db("sample_mflix");
    const collection = db.collection("movies");
    console.log("6. Connected to DB: sample_mflix.movies");

    // --- Step C: Vector Search ---
    console.log("7. Running Vector Search...");
    const pipeline = [
      {
        "$vectorSearch": {
          "index": "voyage_vector_index",
          "path": "plot_embeddings_voyage",
          "queryVector": vector,
          "numCandidates": 100,
          "limit": 9
        }
      },
      {
        "$project": {
          "_id": 1,
          "title": 1,
          "plot": 1,
          "year": 1,
          "genres": 1,
          "score": { "$meta": "vectorSearchScore" }
        }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    console.log("8. Search Complete. Found results:", results.length);

    return Response.json(results);

  } catch (error) {
    console.error("!!! API ERROR !!!", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}