'use client';

import { motion } from "framer-motion";
import { Star, Calendar, Clapperboard } from "lucide-react";

export default function MovieCard({ movie, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }} // Stagger effect
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative h-full bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer"
    >
      {/* Gradient Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="p-6 flex flex-col h-full relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
               <Clapperboard size={18} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 leading-tight group-hover:text-purple-300 transition-colors">
              {movie.title}
            </h3>
          </div>
          {movie.score && (
            <span className="flex items-center gap-1 bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded-full border border-green-500/20">
              <Star size={10} fill="currentColor" />
              {(movie.score * 10).toFixed(0)}% Match
            </span>
          )}
        </div>

        {/* Plot */}
        <p className="text-slate-400 text-sm line-clamp-4 mb-6 flex-grow">
          {movie.plot}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400" />
            <span>{movie.year}</span>
          </div>
          {movie.genres && (
             <div className="flex gap-2">
               {movie.genres.slice(0, 2).map((g) => (
                 <span key={g} className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                   {g}
                 </span>
               ))}
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}