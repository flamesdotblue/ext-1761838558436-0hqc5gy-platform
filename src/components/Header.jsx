import React from "react";
import { Rocket, Music } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow">
            <Rocket size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">ABC Pronunciation Party</h1>
            <p className="text-xs text-slate-500">Learn the alphabet with sounds, rhythm, and smiles</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-slate-600">
          <Music size={18} />
          <span className="text-sm">Kid-friendly tunes</span>
        </div>
      </div>
    </header>
  );
}
