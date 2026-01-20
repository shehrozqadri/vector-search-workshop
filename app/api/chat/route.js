import { MongoClient } from 'mongodb';
import Groq from 'groq-sdk';

const client = new MongoClient(process.env.MONGO_URI);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { message } = await req.json();

    // 1. Embed the user's question
    const embeddingResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
      },
      body: JSON.stringify({
        input: message,
        model: "voyage-3" 
      })
    });
    const embeddingData = await embeddingResponse.json();
    const vector = embeddingData.data[0].embedding;

    // 2. Connect to DB
    await client.connect();
    const db = client.db("rag_demo"); // Note: Different DB for PDF!
    const collection = db.collection("aggregations_knowledge");

    // 3. Find relevant chunks (Vector Search)
    const results = await collection.aggregate([
      {
        "$vectorSearch": {
          "index": "vector_index",
          "path": "embedding",
          "queryVector": vector,
          "numCandidates": 100,
          "limit": 4
        }
      },
      {
        "$project": { "text": 1, "_id": 0 }
      }
    ]).toArray();

    const context = results.map(r => r.text).join("\n\n");

    // 4. Ask Groq (Llama 3)
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant. Use the provided context to answer the user's question. If the answer isn't in the context, say you don't know." },
        { role: "user", content: `Context: ${context}\n\nQuestion: ${message}` }
      ],
      model: "llama-3.3-70b-versatile",
    });

    const answer = completion.choices[0]?.message?.content || "No answer generated.";
    
    return Response.json({ answer, context });

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}