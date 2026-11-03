# Universal AI for iPhone

A Capacitor iOS app that connects to Universal AI running on your Windows laptop.

## Build

GitHub Actions builds an unsigned iOS IPA on a macOS 26 runner. Open Actions → Build Universal AI IPA → Run workflow. Download the UniversalAI-unsigned-IPA artifact and import the IPA into SideStore for personal installation.

## Connect

1. Start Universal AI on the laptop and its Cloudflare Quick Tunnel.
2. Open the iPhone app and paste the HTTPS .trycloudflare.com URL.
3. Tap Connect, then complete the existing Universal AI pairing step.

The laptop must remain online while the assistant is in use. This app wrapper does not contain provider API keys or laptop private data.