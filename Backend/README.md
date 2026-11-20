# AION Clip Studio private backend

This service runs on the user's Windows HP host and is reachable only through the Tailscale tailnet.

## Start

```powershell
$env:CLIPSTUDIO_HOST='127.0.0.1'
$env:CLIPSTUDIO_PORT='8792'
node .\clipstudio-server.js
```

The service prints a one-time six-digit pairing code at startup. Enter that code in ClipStudio on the iPhone. Pairing creates a random bearer session held by the server and stored in the iOS Keychain. Sessions expire after 30 days. The server stores only SHA-256 session-token hashes, so pairing survives backend restarts.

## Private HTTPS ingress

Use Tailscale Serve to proxy a tailnet-only HTTPS endpoint to localhost:

```powershell
tailscale serve --bg --https=8446 http://127.0.0.1:8792
```

Configure the app endpoint as `https://<machine-tailnet-name>:8446`. Do not expose port 8792 to the public internet.

## Pipeline

The API accepts authorized local video uploads, then orchestrates the existing local Python pipeline:
- FFprobe stream validation
- faster-whisper transcription
- OpenCV motion and audio-energy analysis
- mode-aware highlight ranking
- ASS captions and FFmpeg vertical rendering
- technical export QC

Supported inputs: MP4, MOV, MKV, WebM, M4V. Maximum upload: 8 GB. Full audiovisual processing requires an uploaded media file. A URL alone does not grant permission or unrestricted raw-stream access.

## Routes

- `GET /health`
- `POST /v1/pair`
- `GET /v1/capabilities`
- `GET /v1/projects`
- `POST /v1/uploads`
- `POST /v1/jobs`
- `GET /v1/jobs/:id`
- `POST /v1/jobs/:id/render`
- `POST /v1/jobs/:id/cancel`
- `GET /v1/jobs/:id/files/:filename`

The API is intentionally dependency-free. Job and project metadata and uploaded/rendered files are stored under `clipstudio-data`.
