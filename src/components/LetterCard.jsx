import React from "react";
import { motion } from "framer-motion";

export default function LetterCard({ letter, color, word, onClick }) {
  return (
    <div className="w-full flex flex-col items-center select-none">
      <motion.div
        onClick={onClick}
        className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl flex items-center justify-center shadow-xl cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${color} 0%, #ffffff 120%)` }}
        key={letter}
        initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        aria-label={`Letter ${letter}`}
      >
        <motion.span
          className="font-extrabold text-8xl sm:text-9xl text-slate-800 drop-shadow-sm"
          initial={{ y: 10 }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {letter}
        </motion.span>
      </motion.div>
      <div className="mt-4 text-center">
        <p className="text-lg sm:text-xl font-semibold text-slate-700">{letter} as in {word}</p>
      </div>
    </div>
  );
}
