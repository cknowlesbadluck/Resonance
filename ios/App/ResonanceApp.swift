import AppIntents
import ResonanceCore
import SwiftUI

@main
struct ResonanceApp: App {
    init() { ResonanceShortcuts.updateAppShortcutParameters() }

    var body: some Scene {
        WindowGroup { RootView() }
    }
}

@MainActor
private final class NexusStore: ObservableObject {
    @Published var capabilities: [NexusCapability] = []
    @Published var executions: [NexusExecution] = []
    @Published var evidence: [NexusEvidence] = []
    @Published var readiness: NexusReadiness?
    @Published var selected: NexusCapability?
    @Published var isLoading = false
    @Published var isExecuting = false
    @Published var message: String?

    var canExecute: Bool { readiness?.isReady == true && !isExecuting }

    func refresh() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let client = NexusClientFactory.makeClient()
            readiness = try await client.readiness()
            guard readiness?.isReady == true else {
                capabilities = []
                executions = []
                evidence = []
                message = "Control plane is not ready. Review Connection settings."
                return
            }
            async let loadedCapabilities = client.capabilities()
            async let loadedExecutions = client.executions()
            capabilities = try await loadedCapabilities
            let activity = try await loadedExecutions
            executions = activity.executions
            evidence = activity.evidence
            message = nil
        } catch let error as NexusClientError {
            message = error.userFacingMessage
        } catch {
            message = error.localizedDescription
        }
    }

    func execute(_ capability: NexusCapability) async {
        guard canExecute else { return }
        isExecuting = true
        defer { isExecuting = false }
        let projectId = UserDefaults.standard.string(forKey: NexusClientFactory.projectIdKey)
            ?? NexusIntentRequest.unscopedProjectID
        do {
            let result = try await NexusClientFactory.makeClient().execute(
                NexusIntentRequest(
                    projectId: projectId,
                    objective: "Execute \(capability.name)",
                    requestedBy: "ios-user",
                    requirements: [NexusCapabilityRequirement(key: capability.key)]
                )
            )
            if result.status == "approval_required" {
                message = "Approval required before this plan can continue."
            } else if let execution = result.execution {
                message = "Execution \(execution.id.prefix(8)) · \(execution.status)"
            } else {
                message = result.status ?? "Request accepted"
            }
            let activity = try await NexusClientFactory.makeClient().executions()
            executions = activity.executions
            evidence = activity.evidence
        } catch let error as NexusClientError {
            message = error.userFacingMessage
        } catch {
            message = error.localizedDescription
        }
    }
}

private struct RootView: View {
    @StateObject private var store = NexusStore()

    var body: some View {
        TabView {
            CockpitView(store: store)
                .tabItem { Label("Nexus", systemImage: "point.3.connected.trianglepath.dotted") }
            ActivityView(store: store)
                .tabItem { Label("Activity", systemImage: "waveform.path.ecg") }
            ConnectionView(store: store)
                .tabItem { Label("Connection", systemImage: "lock.shield") }
        }
        .tint(.purple)
        .preferredColorScheme(.dark)
        .task { await store.refresh() }
    }
}

private struct CockpitView: View {
    @ObservedObject var store: NexusStore

    var body: some View {
        NavigationStack {
            ZStack {
                RadialGradient(colors: [.purple.opacity(0.24), .black], center: .center, startRadius: 8, endRadius: 420)
                    .ignoresSafeArea()
                if store.isLoading {
                    ProgressView("Connecting to Nexus…")
                } else if store.readiness?.isReady != true {
                    ContentUnavailableView(
                        "Nexus unavailable",
                        systemImage: "bolt.horizontal.circle",
                        description: Text(store.message ?? "Configure a ready Resonance deployment.")
                    )
                } else if store.capabilities.isEmpty {
                    ContentUnavailableView("No capabilities", systemImage: "square.stack.3d.up")
                } else {
                    ScrollView {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 14)], spacing: 14) {
                            ForEach(store.capabilities) { capability in
                                Button { store.selected = capability } label: {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Image(systemName: capability.availability == .available ? "sparkles" : "exclamationmark.triangle")
                                            .font(.title2).foregroundStyle(.purple)
                                        Text(capability.name).font(.headline).multilineTextAlignment(.leading)
                                        Text(capability.key).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                                        Spacer(minLength: 0)
                                        Text(capability.availability?.rawValue.uppercased() ?? "UNKNOWN")
                                            .font(.caption2.bold()).foregroundStyle(capability.availability == .available ? .green : .orange)
                                    }
                                    .frame(maxWidth: .infinity, minHeight: 125, alignment: .leading)
                                    .padding()
                                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18))
                                }.buttonStyle(.plain)
                            }
                        }.padding()
                    }
                }
            }
            .navigationTitle("Resonance")
            .toolbar { Button { Task { await store.refresh() } } label: { Image(systemName: "arrow.clockwise") }.disabled(store.isLoading) }
            .sheet(item: $store.selected) { capability in
                CapabilitySheet(capability: capability, store: store)
            }
        }
    }
}

private struct CapabilitySheet: View {
    let capability: NexusCapability
    @ObservedObject var store: NexusStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Capability") {
                    LabeledContent("Key", value: capability.key)
                    LabeledContent("Risk", value: String(describing: capability.risk))
                    LabeledContent("Availability", value: capability.availability?.rawValue ?? "unknown")
                    if let description = capability.description { Text(description).foregroundStyle(.secondary) }
                }
                if !capability.requiredPermissions.isEmpty {
                    Section("Required permissions") { ForEach(capability.requiredPermissions, id: \.self) { Text($0) } }
                }
                Section {
                    Button {
                        Task { await store.execute(capability) }
                    } label: {
                        HStack { if store.isExecuting { ProgressView() }; Text(store.isExecuting ? "Executing…" : "Execute via Nexus") }
                            .frame(maxWidth: .infinity)
                    }
                    .disabled(!store.canExecute || capability.availability != .available)
                }
                if let message = store.message { Section("Result") { Text(message) } }
            }
            .navigationTitle(capability.name)
            .toolbar { Button("Done") { dismiss() } }
        }
        .presentationDetents([.medium, .large])
    }
}

private struct ActivityView: View {
    @ObservedObject var store: NexusStore

    var body: some View {
        NavigationStack {
            List {
                if store.executions.isEmpty {
                    ContentUnavailableView("No executions", systemImage: "clock.arrow.circlepath", description: Text("Completed and failed runs will appear here."))
                }
                ForEach(store.executions) { execution in
                    Section {
                        LabeledContent("Status", value: execution.status)
                        if let started = execution.startedAt { LabeledContent("Started", value: started) }
                        if let error = execution.error { Text(error).foregroundStyle(.red) }
                        ForEach(store.evidence.filter { $0.executionId == execution.id }) { item in
                            Label(item.summary, systemImage: "doc.text.magnifyingglass").font(.footnote)
                        }
                    } header: { Text(String(execution.id.prefix(12))) }
                }
            }
            .navigationTitle("Evidence")
            .refreshable { await store.refresh() }
        }
    }
}

private struct ConnectionView: View {
    @ObservedObject var store: NexusStore
    @AppStorage(NexusClientFactory.baseURLKey) private var baseURL = NexusClientFactory.defaultBaseURLString
    @AppStorage(NexusClientFactory.projectIdKey) private var projectId = ""
    @State private var token = ""
    @State private var saveMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Control plane") {
                    TextField("HTTPS base URL", text: $baseURL).textInputAutocapitalization(.never).keyboardType(.URL)
                    TextField("Project UUID", text: $projectId).textInputAutocapitalization(.never)
                    SecureField("Bearer token", text: $token).textContentType(.password)
                    Button("Save and verify") { save() }
                }
                Section("Readiness") {
                    LabeledContent("Status", value: store.readiness?.status ?? "unchecked")
                    LabeledContent("Authentication", value: store.readiness?.authModeOk == true ? "configured" : "unavailable")
                    LabeledContent("Persistence", value: store.readiness?.persistenceConfigured == true ? "configured" : "unavailable")
                    if let missing = store.readiness?.missingRequired, !missing.isEmpty {
                        Text("Missing: \(missing.joined(separator: ", "))").foregroundStyle(.orange)
                    }
                    if let saveMessage { Text(saveMessage).font(.footnote) }
                }
                Section("Security") {
                    Text("Bearer credentials are stored in the iOS Keychain and never in UserDefaults. SideStore re-signing does not require embedded secrets.")
                        .font(.footnote).foregroundStyle(.secondary)
                    Button("Remove credential", role: .destructive) {
                        KeychainTokenStore.delete(); token = ""; saveMessage = "Credential removed"
                    }
                }
            }
            .navigationTitle("Connection")
        }
    }

    private func save() {
        let trimmedURL = baseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = URL(string: trimmedURL), url.scheme == "https" || url.host == "localhost" else {
            saveMessage = "Enter a valid HTTPS URL."
            return
        }
        guard NexusProjectID.isValid(projectId) else {
            saveMessage = "Project ID must be a UUID."
            return
        }
        do {
            if !token.isEmpty { try KeychainTokenStore.save(token) }
            baseURL = trimmedURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            saveMessage = "Saved. Verifying…"
            Task { await store.refresh(); saveMessage = store.readiness?.isReady == true ? "Ready" : "Deployment is not ready" }
        } catch {
            saveMessage = "Could not save credential: \(error.localizedDescription)"
        }
    }
}
