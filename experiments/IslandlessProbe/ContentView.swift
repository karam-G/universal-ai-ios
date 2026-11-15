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
        .overlay {
            WhiteIslandAura(animate: animate, enabled: whiteAura)
                .ignoresSafeArea()
                .allowsHitTesting(false)
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
                // White illuminated strip is drawn directly over the center bridge position.
                Capsule()
                    .fill(Color.white.opacity(animate ? 0.82 : 0.62))
                    .frame(width: 52, height: 17)
                    .blur(radius: 7)
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [.white, Color(red: 0.91, green: 0.96, blue: 1.0), .white],
                            startPoint: animate ? .leading : .top,
                            endPoint: animate ? .trailing : .bottom
                        )
                    )
                    .frame(width: 43, height: 11)
                    .shadow(color: .white.opacity(0.95), radius: animate ? 8 : 4)
                Capsule()
                    .fill(Color.white.opacity(animate ? 0.95 : 0.45))
                    .frame(width: 22, height: 1.5)
                    .offset(x: animate ? 9 : -9, y: -2)
            }
            .opacity(enabled ? 1 : 0)
            .position(x: geometry.size.width / 2, y: 31)
        }
        .accessibilityHidden(true)
    }
}

