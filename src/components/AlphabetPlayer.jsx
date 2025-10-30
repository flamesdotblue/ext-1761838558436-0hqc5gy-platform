import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LetterCard from "./LetterCard";
import Controls from "./Controls";
import ProgressBar from "./ProgressBar";

// 26 letters with phonics and examples
const LETTERS = [
  { l: "A", sound: "a", word: "apple", color: "#FDE68A" },
  { l: "B", sound: "b", word: "ball", color: "#BFDBFE" },
  { l: "C", sound: "k", word: "cat", color: "#FCA5A5" },
  { l: "D", sound: "d", word: "dog", color: "#A7F3D0" },
  { l: "E", sound: "e", word: "elephant", color: "#FBCFE8" },
  { l: "F", sound: "f", word: "fish", color: "#C7D2FE" },
  { l: "G", sound: "g", word: "goat", color: "#FDE68A" },
  { l: "H", sound: "h", word: "hat", color: "#A5F3FC" },
  { l: "I", sound: "i", word: "igloo", color: "#FCD34D" },
  { l: "J", sound: "j", word: "juice", color: "#F9A8D4" },
  { l: "K", sound: "k", word: "kite", color: "#86EFAC" },
  { l: "L", sound: "l", word: "lion", color: "#93C5FD" },
  { l: "M", sound: "m", word: "moon", color: "#FDBA74" },
  { l: "N", sound: "n", word: "nest", color: "#A7F3D0" },
  { l: "O", sound: "o", word: "octopus", color: "#FDE68A" },
  { l: "P", sound: "p", word: "panda", color: "#C4B5FD" },
  { l: "Q", sound: "kw", word: "queen", color: "#FCA5A5" },
  { l: "R", sound: "r", word: "rainbow", color: "#93C5FD" },
  { l: "S", sound: "s", word: "sun", color: "#FCD34D" },
  { l: "T", sound: "t", word: "tiger", color: "#A5F3FC" },
  { l: "U", sound: "uh", word: "umbrella", color: "#F9A8D4" },
  { l: "V", sound: "v", word: "violin", color: "#86EFAC" },
  { l: "W", sound: "w", word: "whale", color: "#C7D2FE" },
  { l: "X", sound: "ks", word: "xylophone", color: "#FDBA74" },
  { l: "Y", sound: "y", word: "yarn", color: "#FBCFE8" },
  { l: "Z", sound: "z", word: "zebra", color: "#A7F3D0" },
];

export default function AlphabetPlayer() {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [volume, setVolume] = useState(0.4);

  // Speech
  const utterRef = useRef(null);
  const speakLetter = useCallback((lObj) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance();
      u.text = `${lObj.l}. ${lObj.l} says '${lObj.sound}', as in ${lObj.word}.`;
      u.lang = "en-US";
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang?.startsWith("en") && /child|kid|female/i.test(v.name)) || voices.find(v => v.lang?.startsWith("en")) || null;
      if (voice) u.voice = voice;
      u.rate = 0.95;
      u.pitch = 1.1;
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    } catch {}
  }, []);

  // Music via WebAudio simple arpeggio
  const audioRef = useRef({ ctx: null, gain: null, isStarted: false, nextTime: 0, tempo: 92, seqIndex: 0 });
  const pattern = useMemo(() => {
    // C major arpeggio with a simple bass
    return [0, 4, 7, 12, 7, 4, 0, -5]; // semitone offsets
  }, []);

  const startMusic = useCallback(() => {
    if (audioRef.current.ctx) return; // already set up
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);
    audioRef.current = { ctx, gain, isStarted: true, nextTime: ctx.currentTime + 0.1, tempo: 92, seqIndex: 0 };
  }, [volume]);

  const stopMusic = useCallback(() => {
    const ref = audioRef.current;
    if (ref.ctx) {
      try { ref.ctx.close(); } catch {}
    }
    audioRef.current = { ctx: null, gain: null, isStarted: false, nextTime: 0, tempo: 92, seqIndex: 0 };
  }, []);

  useEffect(() => {
    const ref = audioRef.current;
    if (ref.gain) ref.gain.gain.value = volume;
  }, [volume]);

  // Simple scheduler
  useEffect(() => {
    let raf;
    function tick() {
      const ref = audioRef.current;
      if (!ref.ctx) { raf = requestAnimationFrame(tick); return; }
      const secPerBeat = 60 / ref.tempo;
      while (ref.nextTime < ref.ctx.currentTime + 0.1) {
        const semitone = pattern[ref.seqIndex % pattern.length];
        const f = 261.63 * Math.pow(2, semitone / 12); // C4 base
        const o = ref.ctx.createOscillator();
        const g = ref.ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(f, ref.nextTime);
        g.gain.setValueAtTime(0.0001, ref.nextTime);
        g.gain.linearRampToValueAtTime(0.15, ref.nextTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ref.nextTime + secPerBeat * 0.9);
        o.connect(g).connect(ref.gain);
        o.start(ref.nextTime);
        o.stop(ref.nextTime + secPerBeat);
        ref.nextTime += secPerBeat;
        ref.seqIndex++;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pattern]);

  // Manage autoplay progression
  useEffect(() => {
    if (!isPlaying || !autoplay) return;
    const u = LETTERS[index];
    speakLetter(u);
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % LETTERS.length);
    }, 3500);
    return () => clearTimeout(id);
  }, [index, isPlaying, autoplay, speakLetter]);

  // When play toggled, speak current
  useEffect(() => {
    if (isPlaying) speakLetter(LETTERS[index]);
    else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, [isPlaying, index, speakLetter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      stopMusic();
    };
  }, [stopMusic]);

  const onPlayPause = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const onPrev = useCallback(() => {
    setIndex((i) => (i - 1 + LETTERS.length) % LETTERS.length);
  }, []);

  const onNext = useCallback(() => {
    setIndex((i) => (i + 1) % LETTERS.length);
  }, []);

  const onToggleAutoplay = useCallback(() => setAutoplay((a) => !a), []);

  const onToggleMusic = useCallback(() => {
    setMusicOn((m) => {
      const next = !m;
      if (next) {
        startMusic();
      } else {
        stopMusic();
      }
      return next;
    });
  }, [startMusic, stopMusic]);

  const onVolumeChange = useCallback((v) => setVolume(v), []);

  const current = LETTERS[index];

  return (
    <section className="w-full mt-8">
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col items-center">
          <div className="text-center mb-4">
            <p className="text-sm uppercase tracking-wide text-slate-500">Animated Alphabet</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
              Tap, Listen, and Sing Along
            </h2>
          </div>

          <LetterCard
            letter={current.l}
            color={current.color}
            word={current.word}
            onClick={() => speakLetter(current)}
          />

          <Controls
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            onPrev={onPrev}
            onNext={onNext}
            autoplay={autoplay}
            onToggleAutoplay={onToggleAutoplay}
            musicOn={musicOn}
            onToggleMusic={onToggleMusic}
            volume={volume}
            onVolumeChange={onVolumeChange}
          />

          <ProgressBar
            current={index}
            total={LETTERS.length}
            onJump={(i) => setIndex(i)}
          />
        </div>
      </div>
    </section>
  );
}
