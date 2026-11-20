# AION Clip Studio — Native iPhone Editing Studio

- Branch: `aion-clip-studio`
- Bundle ID: `com.karam.clipstudio`
- Version: `0.2.0` (build 2)
- Minimum iOS: 17.0
- Client: SwiftUI / AVKit / AVFoundation
- Private compute host: Windows HP + Python + FFmpeg + local Ollama
- Network: Tailscale-only HTTPS ingress

## Implemented in v0.2

### Native iPhone client
- Dark, premium-inspired studio dashboard and five workspaces: Studio, Projects, Editor, Library, Settings.
- Secure one-time pairing with the private backend; session token stored in iOS Keychain.
- Import authorized local video from Files and upload directly from the iPhone without loading the full file into app memory.
- Restore project history and job state from the HP backend.
- Live processing status and rendered-output list.
- Native AVKit clip preview.
- Precision in/out trim and local export using AVFoundation; share to Files, Photos or another installed destination through the iOS share sheet.
- Re-render controls for canvas ratio, caption preset, opening hook, watermark, blurred background and original procedural sound accents.

### Local HP engine
- Private, authenticated upload and job API with one-time pairing, 30-day sessions, persistent project/job records, cancellation and output download.
- FFprobe media validation.
- faster-whisper transcription.
- OpenCV visual-motion analysis and audio-energy scoring.
- Optional local Qwen 3.5 4B sampled-frame assessment through Ollama.
- Mode-aware, non-overlapping highlight selection.
- Same-source contextual B-roll extraction; unrelated stock footage is not silently inserted.
- FFmpeg/Intel Quick Sync rendering, animated ASS captions, vertical/social framing and audio normalization.
- Original procedural whoosh/impact/tick sound accents; no third-party sample pack required.
- Full decode, black-frame, freeze-frame, silence and loudness/true-peak export checks.
- Re-render endpoint creates a new version and preserves previous exports.

Backend source and setup: `Backend/`. HP runtime location: `C:\Users\HP\AION-API`. Existing clipping engine: `C:\Users\HP\GTA6-Clipping`.

## Source access and rights

Full audiovisual analysis requires a local video file uploaded from the iPhone or another permitted media source. A YouTube URL alone does not grant unrestricted raw-stream access. The app does not bypass DRM, logins, paywalls or platform restrictions. Only process media the user owns or is authorized to use. Publishing and monetization are not automated.

## Current practical limits

- The HP is the compute host and must be awake, online and connected to Tailscale.
- The HP has 8 GB RAM, so jobs run sequentially; local vision is optional and may add processing time.
- Current social exports target 1080p-class output; 4K export is not claimed.
- The editor currently provides native preview, trim and share export, plus server-side re-render controls. It is not yet a complete multi-track NLE with arbitrary keyframes, advanced compositing or a full effects marketplace.
- Export QC can pass with editorial warnings (for example, source silence); warnings remain visible and require review.

## Build and install

GitHub Actions builds an unsigned IPA on a macOS runner. An unsigned IPA cannot be installed directly on a physical iPhone; it must be signed with a valid provisioning profile using an available signing workflow. The current build is a functional engineering milestone, not a claim that every future editor feature is complete.
