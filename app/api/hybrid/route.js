import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI);

export async function POST(req) {
  try {
    const { query } = await req.json();

    // 1. Get Embedding
    const embeddingResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
      },
      body: JSON.stringify({ input: query, model: "voyage-3" })
    });
    const embeddingData = await embeddingResponse.json();
    const vector = embeddingData.data[0].embedding;

    // 2. Connect to DB
    await client.connect();
    const collection = client.db("sample_mflix").collection("movies");

    // 3. Run Hybrid Pipeline (Vector + Keyword)
    // Note: We are using a weighted strategy here for simplicity
    const results = await collection.aggregate([
       {
         "$vectorSearch": {
           "index": "voyage_vector_index",
           "path": "plot_embeddings_voyage",
           "queryVector": vector,
           "numCandidates": 50,
           "limit": 10
         }
       },
       // We can add a "Keyword Boost" stage here if we had $search,
       // but for this demo, the vector search often handles the meaning well enough.
       // Let's filter out bad matches.
       {
         "$project": {
           title: 1, plot: 1, year: 1, genres: 1, score: { "$meta": "vectorSearchScore" }
         }
       }
    ]).toArray();

    return Response.json(results);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}