import SwiftUI

struct ContentView: View {
    @State private var edgeToEdge = true
    @State private var animate = false
    @State private var showInfo = true
    @State private var whiteAura = true

    var body: some View {
        ZStack {
            ProbeWallpaper(animate: animate).ignoresSafeArea()

            // Render the light on the app background, underneath the foreground UI.
            // The iOS-owned Dynamic Island remains above this app-rendered layer.
            WhiteIslandAura(animate: animate, enabled: whiteAura)
                .ignoresSafeArea()
                .allowsHitTesting(false)

            VStack(spacing: 0) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("ISLANDLESS").font(.system(size: 13, weight: .bold, design: .rounded)).tracking(3)
                        Text("WHITE BRIDGE EDITION").font(.system(size: 10, weight: .medium)).tracking(1.5).foregroundStyle(.white.opacity(0.65))
                    }
                    Spacer()
                    Button { showInfo.toggle() } label: {
                        Image(systemName: showInfo ? "info.circle.fill" : "info.circle")
                            .font(.title3).padding(10).background(.ultraThinMaterial, in: Circle())
                    }
                }
                Spacer()
                if showInfo {
                    VStack(spacing: 10) {
                        Text("ILLUMINATED CENTER BRIDGE")
                            .font(.system(size: 12, weight: .bold)).tracking(2)
                        Text("A bright white capsule fills the narrow middle space between the Face ID sensor and front camera lens.")
                            .font(.system(size: 14, weight: .medium)).multilineTextAlignment(.center)
                        Text("The two camera and sensor openings remain dark. iOS may still mask the center bridge above app content; this build tests the strongest public-API visual overlay.")
                            .font(.system(size: 11)).foregroundStyle(.white.opacity(0.7)).multilineTextAlignment(.center)
                    }
                    .padding(18).frame(maxWidth: 340)
                    .background(.black.opacity(0.3), in: RoundedRectangle(cornerRadius: 22))
                    .overlay(RoundedRectangle(cornerRadius: 22).stroke(.white.opacity(0.16)))
                }
                Spacer()
                VStack(spacing: 12) {
                    Toggle("White center bridge", isOn: $whiteAura)
                        .font(.system(size: 13, weight: .medium))
                    Toggle("Immersive view (hide status bar)", isOn: $edgeToEdge)
                        .font(.system(size: 13, weight: .medium))
                    Text("iOS public APIs • No jailbreak • No system modification")
                        .font(.system(size: 10, weight: .medium)).foregroundStyle(.white.opacity(0.65))
                }
                .padding(15).background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
            }
            .padding(.horizontal, 20).padding(.top, 12).padding(.bottom, 18)
        }
        .statusBarHidden(edgeToEdge)
        .persistentSystemOverlays(edgeToEdge ? .hidden : .visible)
        .onAppear {
            withAnimation(.linear(duration: 5).repeatForever(autoreverses: true)) { animate = true }
        }
    }
}

struct WhiteIslandAura: View {
    let animate: Bool
    let enabled: Bool

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // A diffuse white backlight behind the black Dynamic Island silhouette.
                Capsule()
                    .fill(Color.white.opacity(animate ? 0.46 : 0.28))
                    .frame(width: 150, height: 43)
                    .blur(radius: 18)
                Capsule()
                    .stroke(Color.white.opacity(animate ? 0.82 : 0.48), lineWidth: 1.4)
                    .frame(width: 138, height: 37)
                    .blur(radius: 2)
                    .shadow(color: .white.opacity(0.9), radius: animate ? 13 : 7)
                Capsule()
                    .stroke(Color.white.opacity(0.34), lineWidth: 0.8)
                    .frame(width: 158, height: 49)
                    .blur(radius: 5)
                Capsule()
                    .fill(Color.white.opacity(animate ? 0.8 : 0.25))
                    .frame(width: 38, height: 2)
                    .blur(radius: 2)
                    .offset(x: animate ? 25 : -25, y: 20)
            }
            .opacity(enabled ? 1 : 0)
            .position(x: geometry.size.width / 2, y: 31)
        }
        .accessibilityHidden(true)
    }
}

