import SwiftUI
import AVKit
import AVFoundation

struct ClipStudioEditorView: View {
    @EnvironmentObject private var api: ClipStudioAPI
    @State private var selectedOutput: ClipStudioOutput?
    @State private var previewURL: URL?
    @State private var player: AVPlayer?
    @State private var duration = 35.0
    @State private var trimIn = 0.0
    @State private var trimOut = 35.0
    @State private var isLoading = false
    @State private var isExporting = false
    @State private var exportedURL: URL?
    @State private var errorText: String?

    private var outputs: [ClipStudioOutput] { api.currentJob?.outputs ?? [] }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("POST-PRODUCTION").font(.system(size: 10, weight: .bold)).tracking(2).foregroundStyle(StudioTheme.mint)
                    Text("Precision editor").font(.system(size: 27, weight: .bold, design: .rounded))
                    Text("Review your generated moments, refine the cut and export a clean master.").font(.system(size: 12)).foregroundStyle(StudioTheme.muted)
                }.padding(.top, 12)

                if let player {
                    VideoPlayer(player: player)
                        .frame(height: 280)
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                        .overlay(RoundedRectangle(cornerRadius: 18).stroke(StudioTheme.line))
                } else {
                    RoundedRectangle(cornerRadius: 18).fill(StudioTheme.panel)
                        .frame(height: 210)
                        .overlay(VStack(spacing: 9) {
                            Image(systemName: "play.rectangle").font(.system(size: 30, weight: .light)).foregroundStyle(StudioTheme.mint)
                            Text("Select a rendered clip").font(.system(size: 14, weight: .semibold))
                            Text("Preview is downloaded securely from your private HP.").font(.system(size: 11)).foregroundStyle(StudioTheme.muted)
                        })
                }

                if let selectedOutput {
                    VStack(alignment: .leading, spacing: 13) {
                        HStack {
                            Text("TIMELINE").font(.system(size: 10, weight: .bold)).tracking(1.8).foregroundStyle(StudioTheme.muted)
                            Spacer()
                            Text(String(format: "%.1fs selected", max(0, trimOut-trimIn))).font(.system(size: 11, weight: .semibold, design: .monospaced)).foregroundStyle(StudioTheme.mint)
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(.white.opacity(0.10)).frame(height: 9)
                                Capsule().fill(LinearGradient(colors: [StudioTheme.mint, StudioTheme.blue], startPoint: .leading, endPoint: .trailing))
                                    .frame(width: max(8, geo.size.width * (trimOut-trimIn)/max(1,duration)), height: 9)
                                    .offset(x: geo.size.width * trimIn/max(1,duration))
                            }
                        }.frame(height: 18)
                        VStack(spacing: 8) {
                            HStack { Text("IN").font(.system(size: 9, weight: .bold)).foregroundStyle(StudioTheme.muted); Slider(value: $trimIn, in: 0...max(0.1, trimOut-0.5)).tint(StudioTheme.mint); Text(String(format: "%.1fs",trimIn)).font(.system(size: 10,design: .monospaced)) }
                            HStack { Text("OUT").font(.system(size: 9, weight: .bold)).foregroundStyle(StudioTheme.muted); Slider(value: $trimOut, in: min(duration,trimIn+0.5)...max(duration,trimIn+0.5)).tint(StudioTheme.blue); Text(String(format: "%.1fs",trimOut)).font(.system(size: 10,design: .monospaced)) }
                        }
                        HStack(spacing: 10) {
                            Button { Task { await exportTrimmedClip() } } label: {
                                Label(isExporting ? "Rendering…" : "Export trimmed master", systemImage: "square.and.arrow.up")
                                    .font(.system(size: 12, weight: .bold)).foregroundStyle(StudioTheme.bg)
                                    .frame(maxWidth: .infinity).padding(14).background(StudioTheme.mint, in: RoundedRectangle(cornerRadius: 12))
                            }.disabled(isExporting || trimOut <= trimIn)
                            if let exportedURL {
                                ShareLink(item: exportedURL) {
                                    Image(systemName: "square.and.arrow.up.on.square").font(.system(size: 15,weight: .bold)).foregroundStyle(StudioTheme.mint).padding(14).background(StudioTheme.panel2,in:RoundedRectangle(cornerRadius:12))
                                }
                            }
                        }
                        Text("Current edit: trim in/out. Captions, framing and audio polish are baked into the generated master.").font(.system(size: 10)).foregroundStyle(StudioTheme.muted)
                    }.padding(16).background(StudioTheme.panel,in:RoundedRectangle(cornerRadius:18)).overlay(RoundedRectangle(cornerRadius:18).stroke(StudioTheme.line))
                }

                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("GENERATED HIGHLIGHTS").font(.system(size: 10, weight: .bold)).tracking(1.8).foregroundStyle(StudioTheme.muted)
                        Spacer()
                        Text("\(outputs.count) CLIPS").font(.system(size: 9, weight: .bold)).foregroundStyle(StudioTheme.mint)
                    }
                    if outputs.isEmpty {
                        EmptyProjectCard(title: "No rendered clips yet", subtitle: "Complete a local analysis job to populate your editor.", icon: "film.stack")
                    } else {
                        ForEach(outputs) { output in
                            Button { Task { await load(output) } } label: {
                                HStack(spacing: 12) {
                                    RoundedRectangle(cornerRadius: 11).fill(StudioTheme.blue.opacity(0.13)).frame(width: 44,height: 44)
                                        .overlay(Image(systemName: "play.fill").foregroundStyle(StudioTheme.blue))
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(output.video).font(.system(size: 12,weight:.semibold)).lineLimit(1)
                                        Text(String(format:"%.1fs · Candidate #%d", max(0,(output.end ?? 0)-(output.start ?? 0)),output.candidateId)).font(.system(size:10)).foregroundStyle(StudioTheme.muted)
                                    }
                                    Spacer()
                                    Image(systemName: output.qc?.passed == true ? "checkmark.seal.fill" : "chevron.right").foregroundStyle(output.qc?.passed == true ? StudioTheme.mint : StudioTheme.muted)
                                }.padding(12).background(selectedOutput?.video == output.video ? StudioTheme.mint.opacity(0.08) : StudioTheme.panel,in:RoundedRectangle(cornerRadius:14))
                            }.buttonStyle(.plain)
                        }
                    }
                }
                if isLoading { ProgressView("Loading clip…").tint(StudioTheme.mint) }
                if let errorText { Text(errorText).font(.system(size: 11)).foregroundStyle(StudioTheme.orange) }
            }.padding(.horizontal,20).padding(.bottom,28)
        }.background(StudioTheme.bg)
    }

    private func load(_ output: ClipStudioOutput) async {
        isLoading = true
        defer { isLoading = false }
        do {
            let url = try await api.downloadOutput(output.video)
            selectedOutput = output
            previewURL = url
            player = AVPlayer(url: url)
            let asset = AVURLAsset(url: url)
            let time = try await asset.load(.duration)
            duration = max(0.5, CMTimeGetSeconds(time))
            trimIn = 0
            trimOut = duration
            exportedURL = nil
            player?.play()
        } catch { errorText = error.localizedDescription }
    }

    private func exportTrimmedClip() async {
        guard let previewURL else { return }
        isExporting = true
        defer { isExporting = false }
        do {
            let asset = AVURLAsset(url: previewURL)
            guard let session = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetHighestQuality) else { throw EditorError.exportUnavailable }
            let destination = FileManager.default.temporaryDirectory.appendingPathComponent("ClipStudio-\(UUID().uuidString).mp4")
            session.outputURL = destination
            session.outputFileType = .mp4
            session.timeRange = CMTimeRange(start: CMTime(seconds: trimIn, preferredTimescale: 600), end: CMTime(seconds: trimOut, preferredTimescale: 600))
            await withCheckedContinuation { continuation in session.exportAsynchronously { continuation.resume() } }
            guard session.status == .completed else { throw session.error ?? EditorError.exportFailed }
            exportedURL = destination
            errorText = nil
        } catch { errorText = error.localizedDescription }
    }

    enum EditorError: LocalizedError {
        case exportUnavailable, exportFailed
        var errorDescription: String? {
            switch self { case .exportUnavailable: "The iPhone could not create an export session."; case .exportFailed: "The export did not complete." }
        }
    }
}
