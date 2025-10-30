import os
import tempfile
from pathlib import Path
from typing import Tuple

import numpy as np
from moviepy.editor import (AudioFileClip, AudioClip, AudioArrayClip,
                            CompositeAudioClip, VideoClip, concatenate_videoclips)
from PIL import Image, ImageDraw, ImageFont

# Letters and words
ABC = [
    ("A", "Apple"), ("B", "Ball"), ("C", "Cat"), ("D", "Dog"), ("E", "Elephant"),
    ("F", "Fish"), ("G", "Grapes"), ("H", "Hat"), ("I", "Ice"), ("J", "Juice"),
    ("K", "Kite"), ("L", "Lion"), ("M", "Moon"), ("N", "Nest"), ("O", "Orange"),
    ("P", "Panda"), ("Q", "Queen"), ("R", "Robot"), ("S", "Sun"), ("T", "Tiger"),
    ("U", "Umbrella"), ("V", "Violin"), ("W", "Whale"), ("X", "Xylophone"), ("Y", "Yoyo"),
    ("Z", "Zebra")
]

# Friendly bright colors to rotate through
COLORS = [
    (255, 99, 132), (54, 162, 235), (255, 206, 86), (75, 192, 192), (153, 102, 255), (255, 159, 64),
    (255, 200, 87), (66, 165, 245), (129, 199, 132), (240, 98, 146), (255, 112, 67), (171, 71, 188)
]

W, H = 1280, 720
FPS = 30
LETTER_DUR = 4.0  # seconds per letter
MARGIN = 40

# Try to load a nice font; fall back to default

def load_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/liberation/LiberationSans-Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

FONT_BIG = load_font(220)
FONT_MED = load_font(90)
FONT_SMALL = load_font(54)


def tts_to_file(text: str, out_path: Path) -> Path:
    """Generate TTS for text into out_path. Prefer gTTS, fallback to espeak if needed."""
    out_path = Path(out_path)
    # Try gTTS
    try:
        from gtts import gTTS
        tts = gTTS(text)
        tts.save(str(out_path))
        return out_path
    except Exception:
        # Fallback to espeak via command-line if available (wav -> convert via moviepy)
        wav_path = out_path.with_suffix('.wav')
        try:
            # Use a slower, child-friendly rate
            os.system(f"espeak -s 120 -v en-us '{text.replace("'", r"\'")}' -w {wav_path}")
            # Convert wav to mp3 using moviepy (so we don't need ffmpeg CLI)
            af = AudioFileClip(str(wav_path))
            af.write_audiofile(str(out_path))
            af.close()
            try:
                os.remove(wav_path)
            except Exception:
                pass
            return out_path
        except Exception as e:
            raise RuntimeError(f"TTS failed for: {text}: {e}")


def make_bg_frame(t, base_color: Tuple[int, int, int]):
    """Create a soft, animated background with gentle pulsing circles."""
    img = Image.new("RGB", (W, H), base_color)
    draw = ImageDraw.Draw(img, "RGBA")

    # Pulsing overlay
    pulse = int(40 + 20 * np.sin(2 * np.pi * t / 2.5))  # 2.5s pulse cycle
    overlay = (255, 255, 255, pulse)
    draw.rectangle([(0, 0), (W, H)], fill=overlay)

    # Floating circles
    for i in range(6):
        phase = i * 0.8
        r = 120 + 20 * np.sin(2 * np.pi * (t + phase) / 5.0)
        cx = int((W/2) + 300 * np.sin(2 * np.pi * (t + phase) / 7.0))
        cy = int((H/2) + 200 * np.cos(2 * np.pi * (t + phase) / 6.0))
        color = (255, 255, 255, 60)
        draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=color)

    return np.array(img)


def letter_frame_factory(letter: str, word: str, base_color: Tuple[int, int, int]):
    # Precompute text sizes
    def draw_frame(t):
        bg = Image.fromarray(make_bg_frame(t, base_color))
        draw = ImageDraw.Draw(bg)

        # Bouncy scale for the big letter
        # Scale oscillates slightly and pops at the start
        pop = 1.0 + 0.12 * np.exp(-3 * t) * np.cos(10 * t)
        wobble = 1.0 + 0.03 * np.sin(2 * np.pi * t)
        scale = pop * wobble

        # Draw big letter using scaling by re-rendering font at runtime
        base_size = 220
        size = int(base_size * scale)
        font_dyn = load_font(size)
        letter_w, letter_h = draw.textbbox((0,0), letter, font=font_dyn)[2:4]
        x = (W - letter_w) // 2
        y = (H - letter_h) // 2 - 60
        # Outline shadow
        draw.text((x+4, y+4), letter, font=font_dyn, fill=(0,0,0))
        draw.text((x, y), letter, font=font_dyn, fill=(255, 255, 255))

        # Word caption with gentle left-right tween
        word_text = f"{letter} is for {word}"
        sway = 20 * np.sin(2 * np.pi * t / 3.0)
        wt_w, wt_h = draw.textbbox((0,0), word_text, font=FONT_MED)[2:4]
        wx = int((W - wt_w)//2 + sway)
        wy = y + letter_h + 40
        draw.rounded_rectangle([(wx-20, wy-10), (wx+wt_w+20, wy+wt_h+10)], radius=16, fill=(0,0,0,90))
        draw.text((wx, wy), word_text, font=FONT_MED, fill=(255,255,255))

        # Footer prompt
        footer = "Learn the ABCs!"
        ft_w, ft_h = draw.textbbox((0,0), footer, font=FONT_SMALL)[2:4]
        draw.text(((W-ft_w)//2, H - ft_h - MARGIN), footer, font=FONT_SMALL, fill=(0,0,0))

        return np.array(bg)

    return draw_frame


def make_music_clip(duration: float, bpm: float = 96.0, sr: int = 44100) -> AudioClip:
    """Create a friendly sine-wave melody bed for the specified duration."""
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    # Simple chord progression in C major: C -> F -> G -> C, quarter notes arpeggio
    freqs_seq = [
        [261.63, 329.63, 392.00],  # C major
        [349.23, 440.00, 523.25],  # F/A/C
        [392.00, 493.88, 587.33],  # G/B/D
        [261.63, 329.63, 392.00],  # back to C
    ]
    beat = 60.0 / bpm
    samples = np.zeros_like(t)
    for i in range(len(t)):
        seg = int((t[i] // (beat * 4)) % 4)  # change chord every bar
        freqs = freqs_seq[seg]
        # Soft attack/decay per bar
        bar_pos = (t[i] % (beat * 4)) / (beat * 4)
        env = 0.3 * (1 - abs(2*bar_pos - 1)) + 0.05
        val = sum(np.sin(2 * np.pi * f * t[i]) for f in freqs) / 3.0
        samples[i] = env * val
    stereo = np.stack([samples, samples], axis=1).astype(np.float32)
    return AudioArrayClip(stereo, fps=sr)


def build_letter_clip(letter: str, word: str, color: Tuple[int, int, int], tts_dir: Path) -> VideoClip:
    # Prepare text for TTS
    phrase = f"{letter}. {letter.lower()}. {letter} is for {word}."
    tts_path = tts_dir / f"{letter}.mp3"
    if not tts_path.exists():
        tts_to_file(phrase, tts_path)

    # Visual part
    frame_fn = letter_frame_factory(letter, word, color)
    vclip = VideoClip(make_frame=frame_fn, duration=LETTER_DUR).set_fps(FPS)

    # Audio: background + voice
    voice = AudioFileClip(str(tts_path))
    voice = voice.audio_fadein(0.05).audio_fadeout(0.05).set_start(0.30)
    music = make_music_clip(LETTER_DUR).volumex(0.18)
    aclip = CompositeAudioClip([music, voice])
    vclip = vclip.set_audio(aclip)
    return vclip


def main():
    out_path = Path("alphabet_kids.mp4")
    tts_dir = Path("tts_cache")
    tts_dir.mkdir(exist_ok=True)

    clips = []
    for i, (letter, word) in enumerate(ABC):
        color = COLORS[i % len(COLORS)]
        print(f"Building clip for {letter} - {word}...")
        clip = build_letter_clip(letter, word, color, tts_dir)
        clips.append(clip)

    final = concatenate_videoclips(clips, method="compose")
    total_dur = final.duration

    # Optional: global gentle music under everything (commented out to avoid doubling)
    # bg_music = make_music_clip(total_dur).volumex(0.12)
    # final = final.set_audio(CompositeAudioClip([final.audio, bg_music]))

    print("Rendering video... This can take a few minutes.")
    final.write_videofile(
        str(out_path),
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        bitrate="3500k",
        threads=2,
        preset="medium",
    )

    print(f"Done! Saved to {out_path.resolve()}")


if __name__ == "__main__":
    main()
