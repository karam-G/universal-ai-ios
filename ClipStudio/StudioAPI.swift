import Foundation
import SwiftUI
import UniformTypeIdentifiers

struct ClipStudioCandidate: Decodable, Identifiable {
    let id: Int
    let start: Double
    let end: Double
    let score: Double
    let combined_score: Double?
    let text: String?
    var duration: Double { max(0, end - start) }
}

struct ClipStudioOutput: Decodable, Identifiable {
    var id: String { video }
    let candidateId: Int
    let video: String
    let thumbnail: String?
    let start: Double?
    let end: Double?
    let score: Double?
    let qc: QC?
    struct QC: Decodable {
        let passed: Bool?
        let warnings: [String]?
        let errors: [String]?
        let width: Int?
        let height: Int?
        let fps: Double?
    }
}

struct ClipStudioJob: Decodable, Identifiable {
    let id: String
    let projectId: String?
    let status: String
    let stage: String?
    let progress: Double?
    let message: String?
    let candidates: [ClipStudioCandidate]?
    let outputs: [ClipStudioOutput]?
}

@MainActor
final class ClipStudioAPI: ObservableObject {
    @Published var backendURL: String {
        didSet { UserDefaults.standard.set(backendURL, forKey: "clipstudio_backend") }
    }
    @Published private(set) var token: String?
    @Published private(set) var connectionState = "Not connected"
    @Published private(set) var currentJob: ClipStudioJob?
    @Published private(set) var errorMessage: String?
    @Published private(set) var isBusy = false

    init() {
        backendURL = UserDefaults.standard.string(forKey: "clipstudio_backend") ?? "https://aion-core.tail54b9ad.ts.net:8446"
        token = UserDefaults.standard.string(forKey: "clipstudio_session")
    }

    private var base: URL {
        URL(string: backendURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/")))!
    }

    func pair(code: String) async {
        isBusy = true
        defer { isBusy = false }
        do {
            let url = base.appendingPathComponent("v1/pair")
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: ["code": code])
            let (data, response) = try await URLSession.shared.data(for: req)
            try validate(response, data)
            let result = try JSONDecoder().decode(PairResponse.self, from: data)
            token = result.token
            UserDefaults.standard.set(result.token, forKey: "clipstudio_session")
            connectionState = "Paired · private backend"
            errorMessage = nil
        } catch { errorMessage = error.localizedDescription; connectionState = "Connection failed" }
    }

    func checkConnection() async {
        do {
            let url = base.appendingPathComponent("health")
            let (_, response) = try await URLSession.shared.data(from: url)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw APIError.server("Backend health check failed") }
            connectionState = token == nil ? "Backend reachable · pair required" : "Backend reachable · paired"
            errorMessage = nil
        } catch { connectionState = "Offline"; errorMessage = error.localizedDescription }
    }

    func uploadAndStart(file: URL, mode: String, maxClips: Int, aspectRatio: String, captionStyle: String, rightsConfirmed: Bool) async {
        guard rightsConfirmed else { errorMessage = "Confirm you have permission to process this media."; return }
        guard let token else { errorMessage = "Pair this iPhone with your AION backend in Settings."; return }
        isBusy = true
        defer { isBusy = false }
        let access = file.startAccessingSecurityScopedResource()
        defer { if access { file.stopAccessingSecurityScopedResource() } }
        do {
            let uploadURL = base.appendingPathComponent("v1/uploads")
            var uploadRequest = URLRequest(url: uploadURL)
            uploadRequest.httpMethod = "POST"
            uploadRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            uploadRequest.setValue(file.lastPathComponent, forHTTPHeaderField: "X-Filename")
            uploadRequest.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
            let (uploadData, uploadResponse) = try await URLSession.shared.upload(for: uploadRequest, fromFile: file)
            try validate(uploadResponse, uploadData)
            let upload = try JSONDecoder().decode(UploadResponse.self, from: uploadData)

            let jobURL = base.appendingPathComponent("v1/jobs")
            var jobRequest = URLRequest(url: jobURL)
            jobRequest.httpMethod = "POST"
            jobRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            jobRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
            let body: [String: Any] = [
                "uploadId": upload.uploadId, "filename": upload.filename,
                "title": file.deletingPathExtension().lastPathComponent,
                "mode": mode, "maxClips": maxClips, "aspectRatio": aspectRatio,
                "captionStyle": captionStyle, "rightsConfirmed": true
            ]
            jobRequest.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (jobData, jobResponse) = try await URLSession.shared.data(for: jobRequest)
            try validate(jobResponse, jobData)
            let created = try JSONDecoder().decode(JobCreateResponse.self, from: jobData)
            currentJob = created.job
            connectionState = "Processing on HP"
            errorMessage = nil
            await poll(jobId: created.job.id)
        } catch { errorMessage = error.localizedDescription }
    }

    func poll(jobId: String) async {
        guard let token else { return }
        while !Task.isCancelled {
            do {
                var req = URLRequest(url: base.appendingPathComponent("v1/jobs/\(jobId)"))
                req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                let (data, response) = try await URLSession.shared.data(for: req)
                try validate(response, data)
                let job = try JSONDecoder().decode(ClipStudioJob.self, from: data)
                currentJob = job
                if ["completed", "failed", "cancelled"].contains(job.status) {
                    connectionState = job.status == "completed" ? "Ready · clips rendered" : "Job \(job.status)"
                    return
                }
            } catch { errorMessage = error.localizedDescription; connectionState = "Connection interrupted"; return }
            try? await Task.sleep(for: .seconds(2))
        }
    }

    func clearSession() {
        token = nil
        UserDefaults.standard.removeObject(forKey: "clipstudio_session")
        connectionState = "Not connected"
        currentJob = nil
    }

    private func validate(_ response: URLResponse, _ data: Data) throws {
        guard let http = response as? HTTPURLResponse else { throw APIError.server("Invalid server response") }
        guard (200..<300).contains(http.statusCode) else {
            let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["message"] as? String
            throw APIError.server(message ?? "Server returned HTTP \(http.statusCode)")
        }
    }

    private struct PairResponse: Decodable { let token: String }
    private struct UploadResponse: Decodable { let uploadId: String; let filename: String; let sizeBytes: Int }
    private struct JobCreateResponse: Decodable { let job: ClipStudioJob }
    enum APIError: LocalizedError {
        case server(String)
        var errorDescription: String? { if case .server(let message) = self { return message }; return nil }
    }
}

struct ClipStudioConnectionPanel: View {
    @EnvironmentObject private var api: ClipStudioAPI
    @State private var pairingCode = ""
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Circle().fill(api.connectionState.contains("paired") || api.connectionState.contains("Paired") ? StudioTheme.mint : StudioTheme.orange).frame(width: 8, height: 8)
                Text(api.connectionState).font(.system(size: 12, weight: .semibold))
                Spacer()
                Button("Test") { Task { await api.checkConnection() } }.font(.system(size: 12, weight: .bold)).foregroundStyle(StudioTheme.mint)
            }
            TextField("https://aion-core.tail54b9ad.ts.net:8446", text: $api.backendURL)
                .textInputAutocapitalization(.never).autocorrectionDisabled().keyboardType(.URL)
                .font(.system(size: 13, design: .monospaced)).padding(12)
                .background(StudioTheme.panel2, in: RoundedRectangle(cornerRadius: 11))
            HStack {
                TextField("6-digit pairing code", text: $pairingCode).keyboardType(.numberPad).font(.system(size: 14, design: .monospaced)).padding(12).background(StudioTheme.panel2, in: RoundedRectangle(cornerRadius: 11))
                Button { Task { await api.pair(code: pairingCode) } } label: {
                    Text(api.isBusy ? "…" : "Pair").font(.system(size: 13, weight: .bold)).foregroundStyle(StudioTheme.bg).padding(.horizontal, 18).padding(.vertical, 13).background(StudioTheme.mint, in: RoundedRectangle(cornerRadius: 11))
                }.disabled(api.isBusy || pairingCode.count != 6)
            }
            if let error = api.errorMessage {
                Text(error).font(.system(size: 11)).foregroundStyle(StudioTheme.orange).fixedSize(horizontal: false, vertical: true)
            }
            if api.token != nil {
                Button("Disconnect this device", role: .destructive) { api.clearSession() }.font(.system(size: 12, weight: .semibold))
            }
        }
    }
}

struct JobProgressCard: View {
    let job: ClipStudioJob
    private var progress: Double { min(1, max(0, (job.progress ?? 0) / 100)) }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("AION ENGINE", systemImage: "cpu").font(.system(size: 9, weight: .bold)).tracking(1.5).foregroundStyle(StudioTheme.mint)
                Spacer()
                Text("\(Int(progress * 100))%").font(.system(size: 12, weight: .bold, design: .monospaced)).foregroundStyle(StudioTheme.mint)
            }
            Text(job.message ?? job.stage ?? job.status.capitalized).font(.system(size: 14, weight: .semibold))
            ProgressView(value: progress).tint(StudioTheme.mint)
            HStack {
                Text(job.status.uppercased()).font(.system(size: 9, weight: .bold)).tracking(1.2).foregroundStyle(StudioTheme.muted)
                Spacer()
                if let outputs = job.outputs { Text("\(outputs.count) CLIPS").font(.system(size: 9, weight: .bold)).foregroundStyle(StudioTheme.mint) }
            }
            if let outputs = job.outputs, !outputs.isEmpty {
                ForEach(outputs) { output in
                    HStack {
                        Image(systemName: output.qc?.passed == true ? "checkmark.seal.fill" : "film").foregroundStyle(output.qc?.passed == true ? StudioTheme.mint : StudioTheme.orange)
                        Text(output.video).font(.system(size: 11, weight: .medium)).lineLimit(1)
                        Spacer()
                        Text(output.qc?.passed == true ? "QC PASS" : "REVIEW").font(.system(size: 8, weight: .bold)).foregroundStyle(StudioTheme.muted)
                    }
                }
            }
        }
        .padding(16)
        .background(StudioTheme.panel, in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(StudioTheme.mint.opacity(0.18)))
    }
}
