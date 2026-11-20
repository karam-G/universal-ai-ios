import SwiftUI
import UniformTypeIdentifiers

@main
struct ClipStudioApp: App {
    var body: some Scene {
        WindowGroup { RootView().environmentObject(ClipStudioAPI()).preferredColorScheme(.dark) }
    }
}

enum StudioTheme {
    static let bg = Color(red: 0.035, green: 0.043, blue: 0.065)
    static let panel = Color(red: 0.075, green: 0.088, blue: 0.12)
    static let panel2 = Color(red: 0.105, green: 0.12, blue: 0.16)
    static let line = Color.white.opacity(0.085)
    static let muted = Color(red: 0.55, green: 0.59, blue: 0.67)
    static let mint = Color(red: 0.38, green: 0.94, blue: 0.78)
    static let blue = Color(red: 0.38, green: 0.67, blue: 1.0)
    static let violet = Color(red: 0.64, green: 0.48, blue: 1.0)
    static let orange = Color(red: 1.0, green: 0.63, blue: 0.37)
}

enum StudioTab: String, CaseIterable {
    case studio = "Studio", projects = "Projects", editor = "Editor", library = "Library", settings = "Settings"
    var icon: String {
        switch self {
        case .studio: "square.grid.2x2.fill"
        case .projects: "film.stack"
        case .editor: "scissors"
        case .library: "square.stack.3d.up"
        case .settings: "slider.horizontal.3"
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var api: ClipStudioAPI
    @State private var tab: StudioTab = .studio
    @State private var showFilePicker = false
    @State private var selectedMedia: URL?
    @State private var rightsConfirmed = false
    @State private var showNewProject = false
    @State private var sourceURL = ""
    @State private var selectedStyle = "Smart Auto"
    @State private var clipCount = "Best moments"
    @State private var isAnalysing = false
    @State private var toast: String?
    @State private var showSettings = false

    var body: some View {
        ZStack {
            StudioTheme.bg.ignoresSafeArea()
            VStack(spacing: 0) {
                topBar
                Group {
                    switch tab {
                    case .studio: dashboard
                    case .projects: projectsView
                    case .editor: ClipStudioEditorView()
                    case .library: libraryView
                    case .settings: SettingsView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                bottomBar
            }
            if let toast {
                VStack { Spacer(); Text(toast).font(.system(size: 13, weight: .semibold)).padding(.horizontal, 18).padding(.vertical, 12).background(.ultraThinMaterial, in: Capsule()).overlay(Capsule().stroke(StudioTheme.line)).padding(.bottom, 90) }
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .sheet(isPresented: $showNewProject) { NewProjectSheet(sourceURL: $sourceURL, selectedStyle: $selectedStyle, clipCount: $clipCount, rightsConfirmed: $rightsConfirmed, onChooseFile: { showFilePicker = true }, onStart: startAnalysis).presentationDetents([.large]).presentationDragIndicator(.visible) }
        .onAppear { Task { await api.loadProjects() } }
        .fileImporter(isPresented: $showFilePicker, allowedContentTypes: [.movie, .mpeg4Movie, .quickTimeMovie], allowsMultipleSelection: false) { result in
            switch result {
            case .success(let urls):
                selectedMedia = urls.first
                if let file = urls.first { sourceURL = file.lastPathComponent; toast = "Selected · \(file.lastPathComponent)" }
            case .failure(let error): toast = error.localizedDescription
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.86), value: tab)
        .animation(.spring(response: 0.35, dampingFraction: 0.86), value: toast)
    }

    private var topBar: some View {
        HStack(spacing: 11) {
            ZStack {
                RoundedRectangle(cornerRadius: 12).fill(LinearGradient(colors: [StudioTheme.mint.opacity(0.23), StudioTheme.blue.opacity(0.12)], startPoint: .topLeading, endPoint: .bottomTrailing))
                Image(systemName: "waveform.path").font(.system(size: 17, weight: .bold)).foregroundStyle(StudioTheme.mint)
            }.frame(width: 38, height: 38).overlay(RoundedRectangle(cornerRadius: 12).stroke(StudioTheme.mint.opacity(0.24)))
            VStack(alignment: .leading, spacing: 1) {
                Text("CLIPSTUDIO").font(.system(size: 14, weight: .black, design: .rounded)).tracking(2.1)
                Text("AI POST-PRODUCTION").font(.system(size: 8, weight: .bold)).tracking(1.8).foregroundStyle(StudioTheme.muted)
            }
            Spacer()
            Button { showSettings = true; tab = .settings } label: {
                Image(systemName: "slider.horizontal.3").font(.system(size: 16, weight: .semibold)).foregroundStyle(.white.opacity(0.8)).frame(width: 40, height: 40).background(.white.opacity(0.045), in: Circle()).overlay(Circle().stroke(StudioTheme.line))
            }
        }.padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 14)
    }

    private var dashboard: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 23) {
                HStack {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("YOUR CREATIVE").font(.system(size: 10, weight: .bold)).tracking(2.4).foregroundStyle(StudioTheme.mint)
                        Text("command center.").font(.system(size: 30, weight: .bold, design: .rounded)).tracking(-1.2)
                    }
                    Spacer()
                    ZStack {
                        Circle().stroke(StudioTheme.mint.opacity(0.12), lineWidth: 1).frame(width: 58, height: 58)
                        Circle().trim(from: 0, to: 0.78).stroke(StudioTheme.mint, style: StrokeStyle(lineWidth: 2, lineCap: .round)).rotationEffect(.degrees(-90)).frame(width: 58, height: 58)
                        Image(systemName: "sparkles").font(.system(size: 18, weight: .medium)).foregroundStyle(StudioTheme.mint)
                    }
                }.padding(.top, 13)

                newProjectHero
                if let job = api.currentJob { JobProgressCard(job: job) }

                HStack(spacing: 10) {
                    MetricCard(value: "\(api.projects.count)", label: "PROJECTS", icon: "square.stack.3d.up", tint: StudioTheme.blue)
                    MetricCard(value: "AI", label: "EDITOR", icon: "brain.head.profile", tint: StudioTheme.violet)
                    MetricCard(value: "1080", label: "EXPORT", icon: "4k.tv", tint: StudioTheme.orange)
                }

                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("WORKSPACE").font(.system(size: 10, weight: .bold)).tracking(2).foregroundStyle(StudioTheme.muted)
                        Text("Recent projects").font(.system(size: 20, weight: .bold, design: .rounded))
                    }
                    Spacer()
                    Button("View all") { tab = .projects }.font(.system(size: 12, weight: .semibold)).foregroundStyle(StudioTheme.mint)
                }
                if api.projects.isEmpty {
                    EmptyProjectCard()
                } else {
                    ForEach(api.projects) { project in ClipStudioProjectRow(project: project) }
                }

                HStack(spacing: 10) {
                    FeatureTile(icon: "waveform", title: "Audio polish", subtitle: "Clean, balanced sound", tint: StudioTheme.mint)
                    FeatureTile(icon: "captions.bubble", title: "Smart captions", subtitle: "Timed & styled", tint: StudioTheme.violet)
                }
                Text("PRIVATE WORKSPACE  ·  LOCAL-FIRST DESIGN").font(.system(size: 9, weight: .bold)).tracking(1.7).foregroundStyle(StudioTheme.muted.opacity(0.65)).frame(maxWidth: .infinity).padding(.top, 4).padding(.bottom, 20)
            }.padding(.horizontal, 20)
        }
    }

    private var newProjectHero: some View {
        VStack(alignment: .leading, spacing: 17) {
            HStack {
                Label("AUTONOMOUS EDITING", systemImage: "sparkles").font(.system(size: 9, weight: .bold)).tracking(1.4).foregroundStyle(StudioTheme.mint)
                Spacer()
                Text("01 / CREATE").font(.system(size: 9, weight: .bold, design: .monospaced)).foregroundStyle(.white.opacity(0.4))
            }
            VStack(alignment: .leading, spacing: 7) {
                Text("One video in.").font(.system(size: 27, weight: .bold, design: .rounded)).tracking(-0.8)
                Text("A library of moments out.").font(.system(size: 27, weight: .bold, design: .rounded)).tracking(-0.8).foregroundStyle(LinearGradient(colors: [StudioTheme.mint, StudioTheme.blue], startPoint: .leading, endPoint: .trailing))
                Text("AI finds the story, shapes the edit and prepares every clip for the feed.").font(.system(size: 13)).foregroundStyle(.white.opacity(0.62)).lineSpacing(4).padding(.top, 2)
            }
            Button { showNewProject = true } label: {
                HStack {
                    Image(systemName: "plus").font(.system(size: 14, weight: .bold))
                    Text("Create a new project").font(.system(size: 14, weight: .bold))
                    Spacer()
                    Image(systemName: "arrow.up.right").font(.system(size: 13, weight: .bold))
                }.foregroundStyle(StudioTheme.bg).padding(.horizontal, 17).frame(height: 51).background(LinearGradient(colors: [StudioTheme.mint, Color(red: 0.43, green: 0.78, blue: 0.96)], startPoint: .leading, endPoint: .trailing), in: RoundedRectangle(cornerRadius: 15))
            }
        }.padding(20).background {
            ZStack(alignment: .topTrailing) {
                RoundedRectangle(cornerRadius: 23).fill(LinearGradient(colors: [Color(red: 0.10, green: 0.18, blue: 0.21), Color(red: 0.075, green: 0.10, blue: 0.16), Color(red: 0.08, green: 0.08, blue: 0.14)], startPoint: .topLeading, endPoint: .bottomTrailing))
                Circle().fill(StudioTheme.mint.opacity(0.10)).frame(width: 190, height: 190).blur(radius: 35).offset(x: 75, y: -75)
                RoundedRectangle(cornerRadius: 23).stroke(LinearGradient(colors: [StudioTheme.mint.opacity(0.32), .white.opacity(0.04)], startPoint: .topLeading, endPoint: .bottomTrailing))
            }
        }
    }

    private var projectsView: some View {
        ScrollView { VStack(alignment: .leading, spacing: 18) {
            Text("Your projects").font(.system(size: 28, weight: .bold, design: .rounded)).padding(.top, 16)
            Text("Every analysis, edit and export in one place.").font(.system(size: 13)).foregroundStyle(StudioTheme.muted)
            if let job = api.currentJob { JobProgressCard(job: job) }
            if api.projects.isEmpty { EmptyProjectCard() } else { ForEach(api.projects) { ClipStudioProjectRow(project: $0) } }
        }.padding(.horizontal, 20) }
    }
    private var libraryView: some View {
        ScrollView { VStack(alignment: .leading, spacing: 18) {
            Text("Clip library").font(.system(size: 28, weight: .bold, design: .rounded)).padding(.top, 16)
            Text("Your selected moments, ready to refine and export.").font(.system(size: 13)).foregroundStyle(StudioTheme.muted)
            if let outputs = api.currentJob?.outputs, !outputs.isEmpty {
                ForEach(outputs) { output in
                    Button { tab = .editor } label: {
                        HStack(spacing: 12) {
                            RoundedRectangle(cornerRadius: 12).fill(StudioTheme.mint.opacity(0.10)).frame(width: 48, height: 48)
                                .overlay(Image(systemName: "play.rectangle.fill").foregroundStyle(StudioTheme.mint))
                            VStack(alignment: .leading, spacing: 4) {
                                Text(output.video).font(.system(size: 12, weight: .semibold)).lineLimit(1)
                                Text(String(format: "%.1fs · Candidate #%d", max(0, (output.end ?? 0) - (output.start ?? 0)), output.candidateId)).font(.system(size: 10)).foregroundStyle(StudioTheme.muted)
                            }
                            Spacer()
                            Image(systemName: output.qc?.passed == true ? "checkmark.seal.fill" : "chevron.right").foregroundStyle(output.qc?.passed == true ? StudioTheme.mint : StudioTheme.muted)
                        }.padding(12).background(StudioTheme.panel, in: RoundedRectangle(cornerRadius: 15)).overlay(RoundedRectangle(cornerRadius: 15).stroke(StudioTheme.line))
                    }.buttonStyle(.plain)
                }
            } else {
                EmptyProjectCard(title: "Your best moments live here", subtitle: "Start an analysis to build your first clip collection.", icon: "film.stack")
            }
        }.padding(.horizontal, 20) }
    }
    private var bottomBar: some View {
        HStack(spacing: 0) {
            ForEach(StudioTab.allCases, id: \.self) { item in
                Button { tab = item } label: {
                    VStack(spacing: 5) {
                        Image(systemName: item.icon).font(.system(size: 17, weight: tab == item ? .semibold : .regular))
                        Text(item.rawValue.uppercased()).font(.system(size: 8, weight: .bold)).tracking(1.1)
                    }.foregroundStyle(tab == item ? StudioTheme.mint : StudioTheme.muted).frame(maxWidth: .infinity).frame(height: 58).contentShape(Rectangle())
                }
            }
        }.padding(.horizontal, 8).padding(.top, 5).background(StudioTheme.bg.opacity(0.98)).overlay(alignment: .top) { Rectangle().fill(StudioTheme.line).frame(height: 1) }
    }
    private func startAnalysis() {
        guard let file = selectedMedia else {
            toast = "Choose a video file from Files. URL-only processing is not enabled yet."
            return
        }
        guard rightsConfirmed else { toast = "Confirm your rights to process this media."; return }
        showNewProject = false
        tab = .projects
        let mode: String = selectedStyle == "Podcast" ? "podcast" : selectedStyle == "High Energy" ? "gaming" : selectedStyle == "Cinematic" ? "universal" : "universal"
        let count = clipCount == "Top 5" ? 5 : clipCount == "Top 10" ? 10 : 8
        Task {
            await api.uploadAndStart(file: file, mode: mode, maxClips: count, aspectRatio: "9:16", captionStyle: mode == "podcast" ? "podcast" : "pro", rightsConfirmed: rightsConfirmed)
            toast = api.errorMessage ?? api.connectionState
            try? await Task.sleep(for: .seconds(3))
            toast = nil
        }
    }
}

struct ClipJob: Identifiable {
    let id: UUID
    let title: String
    let source: String
    let status: String
    let created: Date
}
struct MetricCard: View {
    let value: String; let label: String; let icon: String; let tint: Color
    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            Image(systemName: icon).font(.system(size: 15, weight: .semibold)).foregroundStyle(tint)
            Text(value).font(.system(size: 21, weight: .bold, design: .rounded))
            Text(label).font(.system(size: 8, weight: .bold)).tracking(1.2).foregroundStyle(StudioTheme.muted)
        }.frame(maxWidth: .infinity, alignment: .leading).padding(13).background(StudioTheme.panel, in: RoundedRectangle(cornerRadius: 16)).overlay(RoundedRectangle(cornerRadius: 16).stroke(StudioTheme.line))
    }
}
struct EmptyProjectCard: View {
    var title = "Nothing in the timeline yet"
    var subtitle = "Your projects will appear here as soon as you create one."
    var icon = "film"
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon).font(.system(size: 25, weight: .light)).foregroundStyle(StudioTheme.mint.opacity(0.85)).frame(width: 58, height: 58).background(StudioTheme.mint.opacity(0.08), in: RoundedRectangle(cornerRadius: 18))
            Text(title).font(.system(size: 15, weight: .semibold))
            Text(subtitle).font(.system(size: 12)).foregroundStyle(StudioTheme.muted).multilineTextAlignment(.center).frame(maxWidth: 250)
        }.frame(maxWidth: .infinity).padding(.vertical, 28).background(StudioTheme.panel, in: RoundedRectangle(cornerRadius: 20)).overlay(RoundedRectangle(cornerRadius: 20).stroke(StudioTheme.line))
    }
}
struct ProjectRow: View {
    let job: ClipJob
    var body: some View {
        HStack(spacing: 13) {
            RoundedRectangle(cornerRadius: 13).fill(LinearGradient(colors: [StudioTheme.blue.opacity(0.25), StudioTheme.violet.opacity(0.18)], startPoint: .topLeading, endPoint: .bottomTrailing)).frame(width: 58, height: 58).overlay(Image(systemName: "play.rectangle.fill").font(.system(size: 19)).foregroundStyle(StudioTheme.blue))
            VStack(alignment: .leading, spacing: 5) {
                Text(job.title).font(.system(size: 14, weight: .semibold))
                Text(job.status.uppercased()).font(.system(size: 9, weight: .bold)).tracking(1.2).foregroundStyle(StudioTheme.mint)
                Text(job.source).font(.system(size: 10)).foregroundStyle(StudioTheme.muted).lineLimit(1)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 11, weight: .bold)).foregroundStyle(StudioTheme.muted)
        }.padding(12).background(StudioTheme.panel, in: RoundedRectangle(cornerRadius: 17)).overlay(RoundedRectangle(cornerRadius: 17).stroke(StudioTheme.line))
    }
}
struct FeatureTile: View {
    let icon: String; let title: String; let subtitle: String; let tint: Color
    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            Image(systemName: icon).font(.system(size: 19)).foregroundStyle(tint)
            Text(title).font(.system(size: 13, weight: .semibold))
            Text(subtitle).font(.system(size: 10)).foregroundStyle(StudioTheme.muted)
        }.frame(maxWidth: .infinity, alignment: .leading).padding(15).background(StudioTheme.panel, in: RoundedRectangle(cornerRadius: 17)).overlay(RoundedRectangle(cornerRadius: 17).stroke(StudioTheme.line))
    }
}
struct NewProjectSheet: View {
    @Binding var sourceURL: String
    @Binding var selectedStyle: String
    @Binding var clipCount: String
    @Binding var rightsConfirmed: Bool
    let onChooseFile: () -> Void
    let onStart: () -> Void
    @Environment(\.dismiss) private var dismiss
    private let styles = ["Smart Auto", "Cinematic", "High Energy", "Podcast"]
    var body: some View {
        ZStack {
            StudioTheme.bg.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    HStack { VStack(alignment: .leading, spacing: 5) { Text("NEW PROJECT").font(.system(size: 10, weight: .bold)).tracking(2).foregroundStyle(StudioTheme.mint); Text("Let AI find the moments.").font(.system(size: 25, weight: .bold, design: .rounded)) }; Spacer(); Button { dismiss() } label: { Image(systemName: "xmark").foregroundStyle(.white.opacity(0.7)).padding(10).background(.white.opacity(0.07), in: Circle()) } }
                    VStack(alignment: .leading, spacing: 10) {
                        Text("VIDEO SOURCE").font(.system(size: 10, weight: .bold)).tracking(1.7).foregroundStyle(StudioTheme.muted)
                        HStack(spacing: 10) { Image(systemName: "link").foregroundStyle(StudioTheme.mint); TextField("Paste a YouTube or video link", text: $sourceURL).keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled().font(.system(size: 14)) }.padding(15).background(StudioTheme.panel, in: RoundedRectangle(cornerRadius: 14)).overlay(RoundedRectangle(cornerRadius: 14).stroke(StudioTheme.line))
                        Text("A link alone cannot provide raw video access. Choose a permitted local media file for full audiovisual analysis.").font(.system(size: 11)).foregroundStyle(StudioTheme.muted)
                        Button(action: onChooseFile) { Label(sourceURL.isEmpty ? "Choose video from Files" : "Change selected video", systemImage: "folder.badge.plus").font(.system(size: 13, weight: .semibold)).foregroundStyle(StudioTheme.mint).frame(maxWidth: .infinity).padding(14).background(StudioTheme.mint.opacity(0.08), in: RoundedRectangle(cornerRadius: 12)) }
                    }
                    VStack(alignment: .leading, spacing: 11) {
                        Text("EDITING DIRECTION").font(.system(size: 10, weight: .bold)).tracking(1.7).foregroundStyle(StudioTheme.muted)
                        ForEach(styles, id: \.self) { style in
                            Button { selectedStyle = style } label: {
                                HStack { VStack(alignment: .leading, spacing: 3) { Text(style).font(.system(size: 14, weight: .semibold)); Text(styleDescription(style)).font(.system(size: 11)).foregroundStyle(StudioTheme.muted) }; Spacer(); Image(systemName: selectedStyle == style ? "largecircle.fill.circle" : "circle").foregroundStyle(selectedStyle == style ? StudioTheme.mint : StudioTheme.muted) }
                                    .padding(14).background(selectedStyle == style ? StudioTheme.mint.opacity(0.07) : StudioTheme.panel, in: RoundedRectangle(cornerRadius: 14)).overlay(RoundedRectangle(cornerRadius: 14).stroke(selectedStyle == style ? StudioTheme.mint.opacity(0.35) : StudioTheme.line))
                            }.buttonStyle(.plain)
                        }
                    }
                    VStack(alignment: .leading, spacing: 10) {
                        Text("CLIP SELECTION").font(.system(size: 10, weight: .bold)).tracking(1.7).foregroundStyle(StudioTheme.muted)
                        Picker("Clip selection", selection: $clipCount) { Text("Best moments").tag("Best moments"); Text("Top 5").tag("Top 5"); Text("Top 10").tag("Top 10") }.pickerStyle(.segmented)
                    }
                    Toggle(isOn: $rightsConfirmed) { Text("I own this media or have permission to process it.").font(.system(size: 12, weight: .medium)) }.tint(StudioTheme.mint)
                    Button(action: onStart) { HStack { Text("Start intelligent analysis"); Spacer(); Image(systemName: "arrow.right") }.font(.system(size: 14, weight: .bold)).foregroundStyle(StudioTheme.bg).padding(17).background(StudioTheme.mint, in: RoundedRectangle(cornerRadius: 15)) }
                }.padding(22)
            }
        }.preferredColorScheme(.dark)
    }
    private func styleDescription(_ style: String) -> String {
        switch style { case "Cinematic": "Story-led pacing · atmosphere · refined sound"; case "High Energy": "Fast hooks · punchy cuts · dynamic captions"; case "Podcast": "Conversation-aware cuts · readable subtitles"; default: "Detect content type and choose the right edit automatically" }
    }
}
struct SettingsView: View {
    @State private var showInfo = false
    var body: some View {
        Form {
            Section("CONNECTION") {
                ClipStudioConnectionPanel()
                Text("Private Tailscale connection. Keep the HP awake and connected. Pairing code is displayed by the backend service on the HP.").font(.system(size: 11)).foregroundStyle(StudioTheme.muted)
            }
            Section("WORKSPACE") {
                LabeledContent("Processing", value: "Private HP backend")
                LabeledContent("Editor", value: "ClipStudio AI")
                LabeledContent("Build", value: "0.2 · Backend integration")
            }
            Section("PRIVACY & SAFETY") {
                Text("Only submit media you own or are authorised to process. A YouTube link does not itself grant permission to extract media.")
                Button("About this build") { showInfo = true }
            }
        }.scrollContentBackground(.hidden).background(StudioTheme.bg).foregroundStyle(.white)
        .navigationTitle("Settings")
        .alert("ClipStudio", isPresented: $showInfo) { Button("OK", role: .cancel) {} } message: { Text("Native iPhone client connected to the private local media-analysis and rendering pipeline. Full URL-based ingestion remains subject to source permissions and platform access.") }
    }
}
