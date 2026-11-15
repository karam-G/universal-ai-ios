# ALLIN Release Checklist

## Current candidate
- Product: ALLIN
- Version: 0.4.0
- Build: 11 (next build; build 10 is the last verified IPA)
- Bundle ID: com.karamg.allin
- Minimum iOS: 16.4
- Device target: iPhone
- Source branch: allin/premium-redesign-0.4.0
- Last verified build 10: https://github.com/karam-G/universal-ai-ios/actions/runs/43727795357
- Build 10 artifact: allin-0.4.0-premium-10.ipa (unsigned; bundle ID com.karamg.allin; version 0.4.0; build 10)
- Build 10 SHA-256: d4348bfcb409821465f416cce6a3a6180a6db7f8650c10bb90cbbe662d2ccff8
- Build 10 signing check: no embedded provisioning profile or app code signature; re-sign before installing.

## Product scope in this release
- Home dashboard and five native tabs.
- Eight-question entertainment quiz and four archetypes.
- Daily offline five-letter puzzle, six attempts, saved progress and streaks.
- Private on-device Journal with daily reflection and individual entry deletion.
- Offline text counter, percentage calculator and decision picker.
- Profile, local-data reset, privacy information and support link.
- No login, online community, cloud sync, generative AI, analytics or advertising. Do not advertise these as available.

## Automated validation
- TypeScript: passed on build 10 source.
- Expo iOS bundle export: passed on build 10 source.
- GitHub Actions iOS archive/IPA build: passed for build 10.
- Physical iPhone installation and interactive QA: still required; build 10 is unsigned.
- iOS Simulator smoke test workflow is being corrected to select the actual generated app scheme and run against the current release branch.

## Before public distribution
1. Sign the IPA using a valid Apple development profile and install it on the physical iPhone 15.
2. Test cold launch, all tabs, modal routes, safe areas, haptics, quiz completion/retake, daily puzzle win/loss/rollover, journal create/delete, tools, persistence, and reset.
3. Capture real screenshots from the tested iPhone.
4. Publish the privacy/support pages and use their stable public URLs.
5. Complete App Store listing and privacy disclosures accurately.
6. App Store / TestFlight publication requires Apple Developer Program membership and distribution signing.

## Important boundary
Build success proves compilation and IPA packaging only. It does not prove real-device behavior or make an unsigned IPA installable. Do not mark public release complete until signed physical-device QA and Apples distribution requirements are satisfied.
