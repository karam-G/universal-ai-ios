# ALLIN

**One place. Endless things to explore.**

ALLIN is a mobile-first, local-first Expo + React Native app for iPhone and Android. Version 0.1.0 is a functional prototype with an identity quiz, daily word puzzle, daily poll, local discussion posts, practical tools and a guest profile.

## Current prototype boundaries

- No domain, API key, subscription, paid service or external API is required.
- Quiz results, activity, votes, profile and posts are stored on the device with AsyncStorage.
- Community posts and poll votes are **local to this device**; they are not shared with other users yet.
- The identity quiz is for entertainment and self-reflection, not a clinical or validated psychological assessment.
- No account or cloud sync is required in this first release.

## Run on Windows

1. Install Node.js LTS and Git.
2. In this folder run `npm install`.
3. Start the Expo development server with `npm start`.
4. Scan the QR code using Expo Go on your iPhone (same Wi-Fi), or run `npm run web` for the web preview if web dependencies are installed.

## Build an iOS IPA without a Mac

This repository is configured for [MobAI iOS Builder](https://github.com/MobAI-App/ios-builder), which dispatches an Xcode build to a GitHub Actions macOS runner.

1. Install/update the `builder` CLI on Windows and authenticate with GitHub: `builder auth github`.
2. Ensure `.github/workflows/ios-build.yml` has been initialized and pushed to the default branch with `builder init`.
3. Run `builder ios build --unsigned` for a test artifact.
4. An unsigned IPA is **not directly installable** on iPhone. Installing on-device requires a valid signing/provisioning workflow or a supported free-Apple-ID re-signing flow such as SideStore. App Store distribution requires Apple's paid developer program.

## Build settings

- Bundle ID: `com.karamg.allin`
- iOS build: Expo managed workflow; native project generated on the macOS runner.
- Build configuration: Release
- CI provider: GitHub Actions

## Roadmap

1. Test the first release on the iPhone and fix usability/build issues.
2. Add optional account sync and a real moderated community backend only after validating demand and selecting a genuinely free tier.
3. Add more daily experiences and localization.
4. Evaluate signing/distribution and monetization only after the product has users.
