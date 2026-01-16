import { MongoClient } from "mongodb";
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { ChatGroq } from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

const client = new MongoClient(process.env.MONGO_URI);

export async function POST(req) {
  try {
    const { query } = await req.json();
    await client.connect();
    
    // 1. Connect to Vector Store
    const collection = client.db("rag_demo").collection("aggregations_knowledge");
    const embeddings = new VoyageEmbeddings({
      apiKey: process.env.VOYAGE_API_KEY,
      modelName: "voyage-3", // Voyage still uses 'modelName'
    });
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection: collection,
      indexName: "vector_index", 
    });

    // 2. Setup Retriever & Model
    const retriever = vectorStore.asRetriever(3);
    
    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile", // FIXED: Changed from 'modelName' to 'model'
      temperature: 0.1
    });

    // 3. Create Prompt Template
    const template = `Answer the question based only on the following context:
{context}

Question: {question}`;
    const prompt = ChatPromptTemplate.fromTemplate(template);

    // 4. Build the RAG Chain (LCEL)
    const chain = RunnableSequence.from([
      {
        context: async (input) => {
          const docs = await retriever.invoke(input.question);
          return docs.map(doc => doc.pageContent).join("\n\n");
        },
        question: (input) => input.question,
      },
      prompt,
      model,
      new StringOutputParser(),
    ]);
    
    // 5. Run it
    const response = await chain.invoke({ question: query });
    
    return Response.json({ answer: response });

  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
