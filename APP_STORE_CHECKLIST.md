# ALLIN App Store Release Checklist

## Release candidate
- Product name: ALLIN Daily (ALLIN is the in-app brand)
- Bundle ID: com.karamg.allin
- Marketing version: 0.4.0 (redesign candidate; IPA pending)
- iOS build number: 7
- Minimum iOS version: 16.4
- Device target: iPhone only; iPad support disabled pending layout testing
- Source branch: allin/premium-redesign-0.4.0
- Latest source commit: 1e69e07
- Successful unsigned build: https://github.com/karam-G/universal-ai-ios/actions/runs/43724345900
- IPA artifact: allin-0.3.0-liquid-glass-7.ipa (11,079,065 bytes; unsigned)
- Artifact ZIP SHA-256: 5e8e5342ebf7d7ce0f370f14b3d6992bfedb5957b2cf93f76e68fbd1b43f8f21
- IPA inspection confirms bundle ID com.karamg.allin, version 0.3.0, build 7, minimum iOS 16.4, and bundled GlassView / glassEffectStyle references.
- Signing inspection: no embedded.mobileprovision and no app code signature. This is not install-ready or App Store-uploadable.

## Product and platform implementation
- Five native iOS primary tabs using Expo Router NativeTabs and SF Symbols.
- Native system tab-bar appearance on iOS 26+; native Liquid Glass controls/surfaces through expo-glass-effect 58.0.5.
- Refined visual hierarchy, spacing, depth, ambient lighting and interaction surfaces.
- Tools and Privacy are presented as modal routes.
- Haptic feedback for key interactions.
- Local-first profile, identity quiz, daily puzzle, poll, local-only posts and utility tools.
- In-app privacy/data disclosure and local-data reset.
- No account creation, cloud sync, analytics SDK or advertising SDK in this release.
- Connect content is local to this device. Do not describe it as a live public community.

## Public support and privacy
- Static site source: docs/index.html, docs/privacy.html and docs/support.html.
- Privacy policy source: PRIVACY.md.
- Support tracker: https://github.com/karam-G/universal-ai-ios/issues
- GitHub Pages deployment workflow is prepared, but repository Pages is not enabled. A repository admin must open Settings → Pages, select GitHub Actions as the publishing source, then run the manual “Publish ALLIN privacy and support pages” workflow. GitHub App automation lacks permission to enable this setting.
- App currently opens the branch-specific GitHub privacy document; replace it with the final public privacy URL after Pages deployment.

## Required validation before release
1. Rebuild after the privacy modal route change and verify the new artifact metadata and signing state.
2. Re-sign for device testing using an authorized Apple ID development profile / supported sideloading workflow, then install on the physical iPhone 15.
3. Test cold launch, all five tabs, modal presentation/dismissal, Liquid Glass on iOS 26, safe areas, haptics, quiz, puzzle, poll, local posts, tools, data persistence and reset.
4. Capture genuine screenshots from the tested iPhone; do not use mockups.
5. Finalize store listing: name, subtitle, description, keywords, category, age rating and review notes.
6. Complete App Privacy disclosures in App Store Connect.
7. Enroll in Apple Developer Program and configure App Store distribution signing. A free unsigned build is not a public distribution build.
8. Upload the signed Release build through App Store Connect and submit for review.

## Distribution boundary
An unsigned IPA is a build artifact but cannot be installed directly on a normal iPhone or submitted to App Store Connect. TestFlight and public App Store distribution require an active Apple Developer Program membership and valid distribution signing credentials.
