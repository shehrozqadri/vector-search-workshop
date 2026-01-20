'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, MessageSquare, Layers } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import MovieCard from '@/components/ui/MovieCard';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Movie Search Handler
  const handleSearch = async (endpoint) => {
    if (!query) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Chat Handler
  const handleChat = async () => {
    if (!chatMessage) return;
    const userMsg = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: chatMessage }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error(error);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black px-6 py-12">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-6">
          <Sparkles size={14} />
          <span>MongoDB Atlas Search + Voyage AI + Groq</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
          Intelligent <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Search & Chat</span>
        </h1>
      </div>

      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="vector" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900 border border-slate-800 mb-8">
            <TabsTrigger value="vector">🎥 Semantic Search</TabsTrigger>
            <TabsTrigger value="hybrid">⚡ Hybrid Search</TabsTrigger>
            <TabsTrigger value="rag">🤖 RAG Chat</TabsTrigger>
          </TabsList>

          {/* TAB 1: VECTOR SEARCH */}
          <TabsContent value="vector" className="space-y-8">
            <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-800 shadow-2xl p-2">
              <Search className="absolute left-6 text-slate-500 w-6 h-6" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe a movie plot (e.g. 'time travel paradox')"
                className="w-full bg-transparent border-none text-white text-lg px-14 py-4 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch('/api/search')}
              />
              <button onClick={() => handleSearch('/api/search')} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold transition">
                {loading ? '...' : 'Find'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((movie, i) => (
                <MovieCard key={i} movie={movie} index={i} />
              ))}
            </div>
          </TabsContent>

          {/* TAB 2: HYBRID SEARCH */}
          <TabsContent value="hybrid" className="space-y-8">
            <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-800 shadow-2xl p-2">
              <Layers className="absolute left-6 text-slate-500 w-6 h-6" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try specific keywords (e.g. 'alien' 'spaceship' '1980')"
                className="w-full bg-transparent border-none text-white text-lg px-14 py-4 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch('/api/hybrid')}
              />
              <button onClick={() => handleSearch('/api/hybrid')} className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-bold transition">
                {loading ? '...' : 'Hybrid Search'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((movie, i) => (
                <MovieCard key={i} movie={movie} index={i} />
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: RAG CHAT */}
          <TabsContent value="rag">
            <div className="grid grid-cols-1 gap-6 h-[600px] border border-slate-800 rounded-xl bg-slate-900/50 backdrop-blur-sm overflow-hidden">
              <ScrollArea className="p-6 h-[500px]">
                {chatHistory.length === 0 && (
                  <div className="text-center text-slate-500 mt-20">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Ask me anything about your PDF document!</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && <div className="text-slate-500 animate-pulse">Thinking...</div>}
              </ScrollArea>
              
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input
                  className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                  placeholder="Ask a question..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                />
                <button onClick={handleChat} className="bg-purple-600 hover:bg-purple-700 text-white px-6 rounded-lg font-bold">
                  Send
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}