import { MongoClient } from "mongodb";
// FIXED: Correct Import Name
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";

const client = new MongoClient(process.env.MONGO_URI);

export async function POST(req) {
  try {
    const { query } = await req.json();
    await client.connect();

    // FIXED: Correct Class Name
    const embeddings = new VoyageEmbeddings({
      apiKey: process.env.VOYAGE_API_KEY,
      modelName: "voyage-3",
    });
    const vector = await embeddings.embedQuery(query);

    const db = client.db("sample_mflix");
    const collection = db.collection("movies");

    const pipeline = [
      {
        $vectorSearch: {
          index: "voyage_vector_index",
          path: "plot_embeddings_voyage",
          queryVector: vector,
          numCandidates: 100,
          limit: 5
        }
      },
      {
        $project: {
          _id: 0,
          title: 1,
          plot: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return Response.json({ results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
