# ClipStudio — Native iPhone App

Branch: `aion-clip-studio`  
Bundle ID: `com.karam.clipstudio`  
Minimum iOS: 17.0  
Build: SwiftUI / Xcode / GitHub Actions macOS runner

## Current foundation
- Premium dark native SwiftUI interface
- Studio dashboard, projects, clip library and settings
- New project flow with source URL, editing direction and clip-count preference
- Backend endpoint setting preconfigured for the private AION host
- Unsigned IPA build workflow

## Important status
This is the native application foundation, not the finished autonomous editor. The first build records projects locally in app state and explicitly labels backend processing as pending. It does not claim to analyse or download a YouTube video yet.

## Build
Run the GitHub Actions workflow **Build ClipStudio iOS IPA** on branch `aion-clip-studio`. The workflow creates an unsigned IPA artifact. A signing/provisioning method is required before installation on a physical iPhone.

## Next engineering layers
1. Persist projects and job state.
2. Add authenticated AION API client and job polling.
3. Implement source capability checks and permitted media ingestion.
4. Connect universal transcript + visual analysis.
5. Add ranked highlight review and native preview.
6. Connect render/export, Files and Photos.
7. Test signing and sideload on the target iPhone.
