Vector Search & RAG Workshop
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


Step 2: Security Setup (The Keys)
We need to give the application permission to access your accounts.

Duplicate the Example File: Rename the file .env.example to .env (or create a new file named .env).

Add Your Keys: Open .env and paste your specific credentials:
MONGO_URI="mongodb+srv://<your_user>:<your_password>@..."
VOYAGE_API_KEY="pa-..."
GROQ_API_KEY="gsk_..."


⚠️ Important: Never share this file or commit it to GitHub!

Step 3: The "Kitchen" (Backend Data Setup)
We use Python to prepare our data. This scripts acts like a "chef"—it reads the raw PDF, cuts it into small chunks, translates them into vectors (numbers), and stores them in the database.

Install Python Dependencies:
pip install -r requirements.txt
(Note: If you have issues, try pip3)

Run the Ingestion Script: This will read Practical MongoDB Aggregations Book.pdf and upload the vectors to MongoDB.

python ingest_pdf.py
Wait for the success message: "Success! The PDF content is now searchable."


Create the Vector Index:
Go to MongoDB Atlas -> Atlas Search.

Create a new index on rag_demo.aggregations_knowledge.

Name it: vector_index.

Use the JSON configuration provided in the workshop slides.


Step 4: The "Restaurant" (Frontend Application)
Now we run the Next.js application. This acts like the "waiter"—it takes user questions, runs to the database to find answers, and serves them up.


Install Node Dependencies:
npm install
Run the Server:

npm run dev
Open the App: Open your browser and go to: http://localhost:3000

What we built
Semantic Search: Finds movies by meaning, not just keywords.

Hybrid Search: Combines keyword precision with AI understanding.

RAG (Retrieval-Augmented Generation): A chatbot that reads your PDF and answers questions about it accurately.
