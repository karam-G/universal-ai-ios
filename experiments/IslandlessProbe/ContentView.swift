import SwiftUI

struct ContentView: View {
    @State private var edgeToEdge = true
    @State private var animate = false
    @State private var showInfo = true
    @State private var whiteAura = true

    var body: some View {
        ZStack {
            ProbeWallpaper(animate: animate).ignoresSafeArea()

            VStack(spacing: 0) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("ISLANDLESS").font(.system(size: 13, weight: .bold, design: .rounded)).tracking(3)
                        Text("WHITE AURA EDITION").font(.system(size: 10, weight: .medium)).tracking(1.5).foregroundStyle(.white.opacity(0.65))
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
                        Text("WHITE ISLAND AURA")
                            .font(.system(size: 12, weight: .bold)).tracking(2)
                        Text("A soft white halo, luminous outline and animated light sweep frame the Dynamic Island.")
                            .font(.system(size: 14, weight: .medium)).multilineTextAlignment(.center)
                        Text("The black hardware/system area stays intact. The effect is drawn by this app around it using public SwiftUI APIs.")
                            .font(.system(size: 11)).foregroundStyle(.white.opacity(0.7)).multilineTextAlignment(.center)
                    }
                    .padding(18).frame(maxWidth: 340)
                    .background(.black.opacity(0.3), in: RoundedRectangle(cornerRadius: 22))
                    .overlay(RoundedRectangle(cornerRadius: 22).stroke(.white.opacity(0.16)))
                }
                Spacer()
                VStack(spacing: 12) {
                    Toggle("White aura effect", isOn: $whiteAura)
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
            let width = geometry.size.width
            ZStack {
                Ellipse()
                    .fill(Color.white.opacity(animate ? 0.17 : 0.07))
                    .frame(width: 205, height: 78)
                    .blur(radius: 23)
                Ellipse()
                    .stroke(Color.white.opacity(animate ? 0.95 : 0.58), lineWidth: 1.35)
                    .frame(width: 174, height: 64)
                    .shadow(color: .white.opacity(0.9), radius: animate ? 10 : 4)
                    .shadow(color: .white.opacity(0.5), radius: 19)
                Ellipse()
                    .stroke(Color.white.opacity(0.24), lineWidth: 0.8)
                    .frame(width: 194, height: 76)
                Capsule()
                    .fill(Color.white.opacity(animate ? 0.9 : 0.2))
                    .frame(width: 42, height: 1.5)
                    .blur(radius: 1)
                    .offset(x: animate ? 46 : -46, y: 36)
                Circle().fill(.white.opacity(0.95)).frame(width: 3, height: 3)
                    .shadow(color: .white, radius: 5).offset(x: -101, y: 1)
                Circle().fill(.white.opacity(0.95)).frame(width: 3, height: 3)
                    .shadow(color: .white, radius: 5).offset(x: 101, y: 1)
            }
            .opacity(enabled ? 1 : 0)
            .position(x: width / 2, y: 31)
        }
        .accessibilityHidden(true)
    }
}

struct ProbeWallpaper: View {
    let animate: Bool
    var body: some View {
        GeometryReader { geo in
            ZStack {
                LinearGradient(
                    colors: [Color(red: 0.19, green: 0.20, blue: 0.25),
                             Color(red: 0.07, green: 0.08, blue: 0.12),
                             Color(red: 0.015, green: 0.02, blue: 0.05)],
                    startPoint: animate ? .topLeading : .bottomLeading,
                    endPoint: animate ? .bottomTrailing : .topTrailing)
                Circle().fill(.white.opacity(0.17)).frame(width: geo.size.width * 0.9)
                    .blur(radius: 90).offset(x: animate ? -100 : 100, y: -geo.size.height * 0.34)
                Circle().fill(.cyan.opacity(0.10)).frame(width: geo.size.width * 0.75)
                    .blur(radius: 85).offset(x: animate ? 110 : -90, y: geo.size.height * 0.25)
                Canvas { context, size in
                    var path = Path()
                    stride(from: CGFloat(0), through: size.width, by: 24).forEach { x in
                        path.move(to: CGPoint(x: x, y: 0)); path.addLine(to: CGPoint(x: x, y: size.height))
                    }
                    stride(from: CGFloat(0), through: size.height, by: 24).forEach { y in
                        path.move(to: CGPoint(x: 0, y: y)); path.addLine(to: CGPoint(x: size.width, y: y))
                    }
                    context.stroke(path, with: .color(.white.opacity(0.055)), lineWidth: 0.5)
                }
            }
        }.accessibilityHidden(true)
    }
}
