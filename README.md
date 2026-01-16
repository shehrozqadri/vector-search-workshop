🚀 Vector Search & RAG Workshop
Welcome! In this workshop, we will build an intelligent "Movie Search" and "Document Chat" application using MongoDB Atlas, Next.js, and Python.

Prerequisites
Node.js (v18 or higher)

Python (v3.9 or higher)

Git & VS Code

Accounts for: MongoDB Atlas, Groq, and Voyage AI.

Step 1: Get the Code
Clone the repository to your local machine:

git clone https://github.com/shehrozqadri/vector-search-workshop.git
cd vector-search-workshop


Step 2: Frontend Security Setup (The Keys)
We need to give the Next.js application permission to access your accounts.

Duplicate the Example File: Rename the file .env.example to .env (or create a new file named .env in the main folder).

Add Your Keys: Open .env and paste your specific credentials:

MONGO_URI="mongodb+srv://<your_user>:<your_password>@..."
VOYAGE_API_KEY="pa-..."
GROQ_API_KEY="gsk_..."



Step 3: The "Kitchen" (Backend Data Prep)
We use Python to prepare our data and configure the database.

Navigate to the scripts folder:

cd backend_scripts
Install Python Tools:

pip install -r requirements.txt
(Note: If pip fails, try pip3)

Prep Movies (Vector Search):

Open create_embeddings_voyage.py.

Paste your API keys into the placeholders at the top (PASTE_YOUR_KEY_HERE).

Run it:

python create_embeddings_voyage.py
Result: Your MongoDB movies collection now has vector embeddings.

Create the Movie Index (Crucial!):

Go to MongoDB Atlas -> Atlas Search.

Create a new index on sample_mflix.movies.

Name it: voyage_vector_index.

Select JSON Editor and paste this configuration:

JSON

{
  "fields": [
    {
      "numDimensions": 1024,
      "path": "plot_embeddings_voyage",
      "similarity": "cosine",
      "type": "vector"
    },
    {
      "path": "genres",
      "type": "filter"
    }
  ]
}
(Note: We added "genres" as a filter so the Hybrid Search works perfectly!)


Create the Movie TEXT Index (For Hybrid Search):

While still in Atlas Search on sample_mflix.movies, create another index.

Name it: plot_search_index.

Select JSON Editor and paste this configuration:

{
  "mappings": {
    "dynamic": false,
    "fields": {
      "plot": {
        "type": "string"
      }
    }
  }
}



Prep PDF (RAG):

Open ingest_pdf.py.

Paste your API keys into the placeholders at the top.

Run it:

python ingest_pdf.py
Result: Your MongoDB aggregations_knowledge collection now has PDF chunks + vectors.

Create the PDF Index:

Go to MongoDB Atlas -> Atlas Search.

Create a new index on rag_demo.aggregations_knowledge.

Name it: vector_index.

Select JSON Editor and paste this configuration:

{
  "fields": [
    {
      "numDimensions": 1024,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}


Step 4: The "Restaurant" (The App)
Now we run the website.

Go back to the main folder:

cd ..
Install Node Dependencies:

npm install
Open for Business:

npm run dev
Open your browser and go to: http://localhost:3000


What we built
Semantic Search: Finds movies by meaning, not just keywords.

Hybrid Search: Combines keyword precision with AI understanding.

RAG (Retrieval-Augmented Generation): A chatbot that reads your PDF and answers questions about it accurately.
