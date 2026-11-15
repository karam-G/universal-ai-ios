# ALLIN

**One place. Endless things to explore.**

ALLIN 0.4.0 is a private, local-first daily companion for iPhone. It combines a short self-discovery experience, a daily five-letter puzzle, a private reflection journal, and practical offline tools in one polished native app.

## What is included

- **Home:** a personal dashboard with daily focus, activity and streak summaries, and shortcuts.
- **Discover:** an eight-question entertainment quiz with four personality-style results. It is not a clinical or validated psychological assessment.
- **Daily:** an offline five-letter word puzzle with a bundled 12,653-word dictionary, six attempts, letter-position feedback, and per-day progress.
- **Journal:** a rotating reflection prompt and private notes saved on this device. Entries can be deleted individually.
- **Tools:** offline text and word counter, percentage calculator, and decision picker.
- **Profile:** display name, identity result, activity summary, privacy information, and local-data reset.

## Privacy and operating model

- No account, server, API key, subscription, advertising SDK, analytics SDK, or cloud sync is required.
- Profile data, quiz results, puzzle progress, reflection choices, journal entries, and activity are stored locally using AsyncStorage.
- The Journal is private to this installation; it is not a public feed and entries are not shared with other users.
- The quiz is for entertainment and self-reflection only.
- The app only shares content when the user explicitly invokes the iOS share sheet.

The five-letter dictionary is bundled for offline validation; no word-checking API or network connection is used. Its MIT attribution is in THIRD_PARTY_NOTICES.md.

## Run on Windows

1. Install Node.js 24 and Git.
2. In this folder run npm ci.
3. Run npm start and scan the QR code with Expo Go on the same network, or use npm run ios from a Mac with Xcode.
4. Run npm run check to run TypeScript validation and generate the iOS JavaScript bundle.

## iOS build

The repository uses GitHub Actions on a macOS runner to generate the native Expo project, compile it with Xcode, and package an IPA. The build used for device testing is currently unsigned.

An unsigned IPA is **not directly installable** on a standard iPhone. Device installation requires signing with a valid Apple development provisioning profile or a compatible free-Apple-ID sideloading workflow. App Store / TestFlight distribution requires Apple's paid developer program and distribution signing.

## Release metadata

- App: ALLIN
- Version: 0.4.0
- Bundle ID: com.karamg.allin
- Minimum iOS: 16.4
- Current build number: 13
- Target: iPhone

## Release readiness

A successful CI build verifies compilation and packaging, not real-device behavior. Before calling the app fully production-ready, install a signed build on a physical iPhone and verify every screen, persistence, puzzle rollover, reset, safe areas, haptics, and share-sheet behavior. App Store publication additionally requires the Apple account and signing steps described above.
