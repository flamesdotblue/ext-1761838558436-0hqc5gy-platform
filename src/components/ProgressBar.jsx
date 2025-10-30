import React from "react";

export default function ProgressBar({ current, total, onJump }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="w-full mt-6">
      <div className="flex items-center justify-between mb-2 text-xs text-slate-600">
        <span>
          Letter {current + 1} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-13 sm:grid-cols-26 gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => onJump(i)}
            className={`h-2 rounded ${i === current ? "bg-indigo-500" : "bg-slate-200 hover:bg-slate-300"}`}
            aria-label={`Jump to letter ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
