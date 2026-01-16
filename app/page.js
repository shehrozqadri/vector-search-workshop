"use client";
import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setResult(null);

    let endpoint = "";
    if (activeTab === "vector") endpoint = "/api/vectorSearch";
    if (activeTab === "hybrid") endpoint = "/api/hybridSearch";
    if (activeTab === "rag") endpoint = "/api/rag";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Failed to fetch results" });
    }
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '50px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>🔍 Vector Search Workshop</h1>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '40px' }}>
        <button onClick={() => { setActiveTab("vector"); setResult(null); }} style={btnStyle(activeTab === 'vector')}>Vector Search</button>
        <button onClick={() => { setActiveTab("hybrid"); setResult(null); }} style={btnStyle(activeTab === 'hybrid')}>Hybrid Search</button>
        <button onClick={() => { setActiveTab("rag"); setResult(null); }} style={btnStyle(activeTab === 'rag')}>RAG Chat</button>
      </div>

      {activeTab && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3>{activeTab === 'rag' ? "Ask the MongoDB Expert Bot" : "Find Movies"}</h3>
          <input 
            type="text" 
            placeholder="Enter query..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: '15px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc', color: 'black' }}
          />
          <button onClick={handleSearch} disabled={loading} style={{ padding: '15px', background: '#000', color: '#fff', borderRadius: '5px', cursor: 'pointer' }}>
            {loading ? "Thinking..." : "Submit"}
          </button>
        </div>
      )}

      {/* FIXED: Added "color: 'black'" to force dark text on light background */}
      {result && (
        <div style={{ marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '10px', color: 'black' }}>
          {result.answer && (
            <div>
              <h3>🤖 AI Answer:</h3>
              <p style={{ lineHeight: '1.6' }}>{result.answer}</p>
            </div>
          )}

          {result.results && (
            <div>
              <h3>🎬 Results:</h3>
              {result.results.map((m, i) => (
                <div key={i} style={{ marginBottom: '15px', borderBottom: '1px solid #ddd' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{m.title}</h4>
                  <p style={{ margin: 0, color: '#555' }}>{m.plot}</p>
                  {m.score && <small style={{ color: 'blue' }}>Score: {m.score}</small>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

const btnStyle = (active) => ({
  padding: '15px 30px', cursor: 'pointer', borderRadius: '5px', border: 'none',
  background: active ? '#0070f3' : '#eee', color: active ? 'white' : 'black'
});
