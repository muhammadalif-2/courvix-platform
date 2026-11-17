# Courvix narrated media kit — rc.8

Concept: **The system behind every session. Built for sport. Designed for management.**

The script opens with the operational problem, separates Club Management from Personal Training, demonstrates each workflow, and ends with the interactive demo. The teaser has a separate short-form script and a native 4:5 composition; it is not a crop of the product film.

| Deliverable                                                | Specifications                                   | Purpose                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| `public/media/courvix-product-demo.mp4`                    | 1920×1080, 16:9, 30 fps, approximately 3:23      | Narrated detail tour on the landing, Products and How it works pages        |
| `public/media/courvix-teaser-4x5.mp4`                      | 1080×1350, 4:5, 30 fps, approximately 28 seconds | Social feed teaser                                                          |
| `courvix-demo-captions.vtt`, `courvix-teaser-captions.vtt` | English WebVTT, timed to narration               | Optional native captions; English captions are also burned into both videos |
| `courvix-video-scripts.txt`                                | Complete English narration for both films        | Copywriting and future editing                                              |
| `media-manifest.json`                                      | Actual duration, dimensions and chapter starts   | Website player metadata                                                     |

Both MP4s use H.264 video, AAC stereo audio and fast-start metadata. High-quality masters are also exported into `/workspace/outputs/courvix/` for reuse. The hosted derivative is bounded below the static asset limit; the master is retained separately when compression is needed. No master is silently substituted by the old green film.

## Creative treatment

Courvix orange (`#ff641a`), charcoal and warm white establish the primary palette. Inter typography, original Courvix icon geometry, moving sports photography, scorecard-style numbering, a connected court trajectory, panel reveals, animated credit states and orange match-cut seams connect sport to the management story. Illustrative product panels summarize real workflows; they are not screenshots or a recording of customer activity.

English synthetic neural narration uses Kokoro's `af_heart` preset. It does not clone a person or imply a human spokesperson. The script guides pronunciation of Courvix as “Core vix”; captions retain the brand spelling. Original synthesized percussion/bass, short stereo transition sweeps, a sport-inspired ball impact and subtle UI confirmation sounds support the voice. Music is ducked under narration and the export is loudness normalized toward −16 LUFS / −1.5 dBTP.

The payment chapters explicitly describe manual receipt verification. Reminders are described as configured functionality; this production session does not activate the paused real schedule, send messages, approve subscriptions or perform transfers.

## Product tour chapters

The exact chapter starts are generated from the spoken clip durations into `media-manifest.json`. Chapters cover: the operational problem; two products; workspace setup and subscription review; Club control room; Member 360 and source edits; invitations and role access; dues, review and reminders; PT visits and 4/8/16-session offers; payment, reservation and credit consumption; appointments/classes and booking terms; Client 360 and progress; multi-workspace oversight; interactive demo.

## Website behavior

The player keeps native playback, volume, seeking, fullscreen and captions controls. It never starts audio automatically. Chapter buttons use the generated timestamps. The allowlisted `/api/media` route supports MP4 byte ranges; direct static URLs provide downloads. Revision parameters refresh cached media/posters. The earlier `courvix-teaser-vertical.mp4` URL is an alias of the new 4:5 export so existing download links show the revised film. The teaser player and its metadata use 4:5. Desktop chapter navigation scrolls, and smaller screens use a compact grid.

## Reproduce

These are build-time media tools, not application runtime dependencies. Run from the checkout:

```bash
python3 -m venv work/media-venv
work/media-venv/bin/pip install kokoro-onnx==0.6.1 pillow fonttools
# Download the two model files below into work/media-models/.
work/media-venv/bin/python scripts/narrate-media.py
work/media-venv/bin/python scripts/render-media.py --stills
work/media-venv/bin/python scripts/render-media.py
```

Host ffmpeg must be available. The renderer uses the bundled Inter font and requires numpy (installed by kokoro-onnx). `scripts/media-storyboard.json` holds copy and creative direction. Narration clips cache by text, voice and speed in ignored `work/media-v2/`. Models, virtual environments and temporary narration are excluded from Git and the deployment archive.

Model downloads:

- [Kokoro v1.0 int8](https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.int8.onnx)
- [Voice presets v1.0](https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin)

Kokoro model: Apache 2.0; kokoro-onnx wrapper: MIT. See the [upstream project](https://github.com/thewh1teagle/kokoro-onnx) for licenses and model documentation. No model or dependency binaries are shipped as app assets.

## Photography

Sports photos are still photographs animated in the composition, not claimed as live-action footage. Source files are included for reproduction:

- Basketball: [Unsplash image source](https://images.unsplash.com/photo-1546519638-68e109498ffc), `public/media/source/basketball.jpg`.
- Strength training: [Unsplash image source](https://images.unsplash.com/photo-1517836357463-d25dfeac3438), `public/media/source/training.jpg`.
- Track: existing `public/courvix-track.webp` from the website.

The two added photographs are used under the [Unsplash License](https://unsplash.com/license). Neither athletes nor equipment brands are presented as endorsing Courvix. Music, effects, UI animation and trajectory graphics are created by the renderer; no commercial song or third-party sound effect is used.

## Verification

Validate streams, dimensions, aspect ratio, duration, full decode, loudness, narration/caption coverage, representative frames, byte-range delivery and rendered public routes. Speech-to-text spot checks help catch missing or unintelligible speech; they do not replace human listening. Browser playback, actual mobile display and subjective voice review remain device acceptance checks because browser/audio monitoring is unavailable in this environment. No social post is published automatically.
