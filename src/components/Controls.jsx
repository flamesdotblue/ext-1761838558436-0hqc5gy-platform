import React from "react";
import { Play, Pause, SkipBack, SkipForward, Music, Volume2, VolumeX } from "lucide-react";

export default function Controls({
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  autoplay,
  onToggleAutoplay,
  musicOn,
  onToggleMusic,
  volume,
  onVolumeChange,
}) {
  return (
    <div className="w-full mt-6 flex flex-col gap-4">
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onPrev}
          className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm active:scale-95 transition"
          aria-label="Previous letter"
        >
          <SkipBack size={20} />
        </button>
        <button
          onClick={onPlayPause}
          className="px-5 py-3 rounded-xl bg-indigo-600 text-white shadow hover:bg-indigo-500 active:scale-95 transition font-semibold"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <div className="flex items-center gap-2">
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </div>
        </button>
        <button
          onClick={onNext}
          className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm active:scale-95 transition"
          aria-label="Next letter"
        >
          <SkipForward size={20} />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <button
          onClick={onToggleAutoplay}
          className={`px-3 py-2 rounded-lg border shadow-sm active:scale-95 transition ${
            autoplay ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-slate-200 text-slate-700"
          }`}
          aria-pressed={autoplay}
        >
          {autoplay ? "Autoplay On" : "Autoplay Off"}
        </button>

        <button
          onClick={onToggleMusic}
          className={`px-3 py-2 rounded-lg border shadow-sm active:scale-95 transition flex items-center gap-2 ${
            musicOn ? "bg-pink-50 border-pink-200 text-pink-700" : "bg-white border-slate-200 text-slate-700"
          }`}
          aria-pressed={musicOn}
        >
          <Music size={16} />
          <span>{musicOn ? "Music On" : "Music Off"}</span>
        </button>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
          {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            aria-label="Music volume"
          />
        </div>
      </div>
    </div>
  );
}
