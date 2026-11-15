# ALLIN App Store Release Checklist

## App identity

- Product name: ALLIN Daily (store listing; ALLIN remains the in-app brand)
- Bundle ID: com.karamg.allin
- Release version prepared locally: 0.3.0
- Store name selected to distinguish the listing from existing ALLIN apps: ALLIN Daily
- iOS build number: 7
- Distribution target: iPhone first; iPad support disabled until its layout is tested

## Public support and privacy URLs

- Privacy policy: https://github.com/karam-G/universal-ai-ios/blob/allin/liquid-glass-0.3.0/PRIVACY.md
- Support: https://github.com/karam-G/universal-ai-ios/issues

## Completed in the current local release candidate

- Native iOS tab navigation through Expo Router NativeTabs; five primary tabs, using the system Liquid Glass tab-bar treatment on iOS 26+.
- Native Liquid Glass surfaces for selected high-level controls and visual accents via expo-glass-effect 58.0.5.
- Refined content hierarchy, spacing, card depth, ambient color fields, and interaction surfaces.
- Tools and Privacy presented as native modal routes.
- SF Symbols for native tab items.
- Native haptic feedback for key interactions.
- Updated 1024×1024 RGB app icon with no alpha channel.
- Custom splash artwork and dark splash background.
- In-app Privacy & Data screen.
- Local-only data disclosure and reset control.
- Privacy policy and support documents.
- Patched minimatch to 11.0.1; npm audit reports zero vulnerabilities after lockfile refresh.

## Still required before public App Store submission

1. Build and install the 0.2.3 IPA on a physical iPhone running iOS 26; verify tab glass, modal presentation, safe areas, haptics, all app sections, data reset, and cold launch.
2. Publish docs/privacy.html and docs/support.html on a public HTTPS URL. GitHub Pages is the zero-cost option.
3. Add the public privacy-policy URL inside the app and in App Store Connect metadata.
4. Prepare App Store screenshots from the tested iPhone build; do not use mock screens.
5. Finalize app name, subtitle, description, keywords, category, age rating, and review notes.
6. Complete App Privacy disclosures in App Store Connect.
7. Resolve the product decision for Connect: this release is local-only and has no public feed or cloud sync. Do not market it as a live social network until a backend, moderation, reporting, and blocking are implemented.
8. Enroll in the Apple Developer Program and sign the release. Apple currently lists the individual membership at USD 99 per year; local pricing may vary.
9. Upload the signed release through Apple's supported submission workflow and pass App Review.

## Distribution boundary

An unsigned IPA is useful for sideloading and device testing. It is not an App Store submission build. Public App Store distribution and TestFlight require an active Apple Developer Program membership and valid signing credentials.
