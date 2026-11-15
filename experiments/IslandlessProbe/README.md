# Islandless Probe

Native SwiftUI experiment for iPhone 15. It requests edge-to-edge drawing, hides the status bar, and compares that mode with a reference view. It uses public APIs only and does not modify SpringBoard, the compositor, or iOS.

## Build
The GitHub Actions workflow at `.github/workflows/islandless-unsigned-ipa.yml` builds an unsigned IPA on a macOS runner and uploads it as a 14-day artifact.

An unsigned IPA is not directly installable. Re-sign it with a valid provisioning profile or a supported free-Apple-ID sideloading workflow (for example, SideStore). The test determines whether iOS exposes the inter-cutout area to app rendering; it cannot remove a system-level mask if iOS draws that above the app.

## Manual build
Open `IslandlessProbe.xcodeproj` in Xcode, select a development team, and build for a connected iPhone.
