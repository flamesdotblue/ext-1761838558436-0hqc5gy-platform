# Animated Alphabet Pronunciation Video

This project renders a kid-friendly ABC video (A–Z) with:
- Animated, colorful backgrounds
- Big letters and captions (e.g., "A is for Apple")
- Pronunciations via TTS
- Gentle background melody

Output: `alphabet_kids.mp4`

## How to run

1. Install Python dependencies:

   ```bash
   python3 -m pip install -r requirements.txt
   ```

2. Render the video:

   ```bash
   python3 tools/generate_video.py
   ```

3. (Optional) Serve the file for download in your browser:

   ```bash
   python3 -m http.server 8000
   # Then open: http://localhost:8000/alphabet_kids.mp4
   ```

Notes:
- The script prefers Google TTS (gTTS). If gTTS is unavailable, it tries `espeak` as a fallback if installed.
- Rendering can take a few minutes (it generates all 26 letters at 1280x720, 30 FPS, ~4s/letter).
