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
    const queryVector = await embeddings.embedQuery(query);

    const db = client.db("sample_mflix");
    const collection = db.collection("movies");

    const pipeline = [
      {
        $vectorSearch: {
          index: "voyage_vector_index",
          path: "plot_embeddings_voyage",
          queryVector: queryVector,
          numCandidates: 50,
          limit: 20
        }
      },
      { $addFields: { vs_score: { $meta: "vectorSearchScore" } } },
      { $project: { title: 1, plot: 1, vs_score: 1 } },
      {
        $unionWith: {
          coll: "movies",
          pipeline: [
            {
              $search: {
                index: "plot_search_index",
                text: { query: query, path: "plot" }
              }
            },
            { $limit: 20 },
            { $addFields: { ts_score: { $meta: "searchScore" } } },
            { $project: { title: 1, plot: 1, ts_score: 1 } }
          ]
        }
      },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          plot: { $first: "$plot" },
          maxVsScore: { $max: "$vs_score" },
          maxTsScore: { $max: "$ts_score" }
        }
      },
      { $limit: 5 }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return Response.json({ results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
