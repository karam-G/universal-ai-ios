import SwiftUI

struct ContentView: View {
    @State private var edgeToEdge = true
    @State private var animate = false
    @State private var showInfo = true

    var body: some View {
        ZStack {
            ProbeWallpaper(animate: animate).ignoresSafeArea()
            VStack(spacing: 0) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("ISLANDLESS").font(.system(size: 13, weight: .bold, design: .rounded)).tracking(3)
                        Text("DISPLAY RENDERING PROBE").font(.system(size: 10, weight: .medium)).tracking(1.5).foregroundStyle(.white.opacity(0.65))
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
                        Text(edgeToEdge ? "EDGE-TO-EDGE TEST" : "REFERENCE VIEW")
                            .font(.system(size: 12, weight: .bold)).tracking(2)
                        Text(edgeToEdge
                             ? "Inspect the top center. The wallpaper is drawn behind the status-bar safe area."
                             : "Reference mode leaves the status bar visible.")
                            .font(.system(size: 14, weight: .medium)).multilineTextAlignment(.center)
                        Text("If a black bridge remains between the hardware openings, iOS is likely compositing or masking that region above app content. This app does not modify iOS.")
                            .font(.system(size: 11)).foregroundStyle(.white.opacity(0.7)).multilineTextAlignment(.center)
                    }
                    .padding(18).frame(maxWidth: 340)
                    .background(.black.opacity(0.3), in: RoundedRectangle(cornerRadius: 22))
                    .overlay(RoundedRectangle(cornerRadius: 22).stroke(.white.opacity(0.16)))
                }
                Spacer()
                VStack(spacing: 10) {
                    Toggle("Hide status bar / request immersive view", isOn: $edgeToEdge)
                        .font(.system(size: 13, weight: .medium))
                    Text("Public SwiftUI APIs • No jailbreak • No private APIs")
                        .font(.system(size: 10, weight: .medium)).foregroundStyle(.white.opacity(0.65))
                }
                .padding(15).background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
            }
            .padding(.horizontal, 20).padding(.top, 12).padding(.bottom, 18)
        }
        .statusBarHidden(edgeToEdge)
        .persistentSystemOverlays(edgeToEdge ? .hidden : .visible)
        .onAppear {
            withAnimation(.linear(duration: 14).repeatForever(autoreverses: true)) { animate = true }
        }
    }
}

struct ProbeWallpaper: View {
    let animate: Bool
    var body: some View {
        GeometryReader { geo in
            ZStack {
                LinearGradient(
                    colors: [Color(red: 0.32, green: 0.04, blue: 0.68),
                             Color(red: 0.08, green: 0.08, blue: 0.36),
                             Color(red: 0.015, green: 0.02, blue: 0.10)],
                    startPoint: animate ? .topLeading : .bottomLeading,
                    endPoint: animate ? .bottomTrailing : .topTrailing)
                Circle().fill(.purple.opacity(0.72)).frame(width: geo.size.width * 0.9)
                    .blur(radius: 75).offset(x: animate ? -100 : 100, y: -geo.size.height * 0.34)
                Circle().fill(.cyan.opacity(0.28)).frame(width: geo.size.width * 0.75)
                    .blur(radius: 85).offset(x: animate ? 110 : -90, y: geo.size.height * 0.25)
                Canvas { context, size in
                    var path = Path()
                    stride(from: CGFloat(0), through: size.width, by: 24).forEach { x in
                        path.move(to: CGPoint(x: x, y: 0)); path.addLine(to: CGPoint(x: x, y: size.height))
                    }
                    stride(from: CGFloat(0), through: size.height, by: 24).forEach { y in
                        path.move(to: CGPoint(x: 0, y: y)); path.addLine(to: CGPoint(x: size.width, y: y))
                    }
                    context.stroke(path, with: .color(.white.opacity(0.08)), lineWidth: 0.5)
                }
            }
        }.accessibilityHidden(true)
    }
}
