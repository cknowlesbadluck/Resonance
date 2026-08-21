import SwiftUI
import ResonanceCore
import AppIntents

@main
struct ResonanceApp: App {
    init() {
        // Ensure App Shortcut parameters are refreshed after install / update.
        ResonanceShortcuts.updateAppShortcutParameters()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @State private var capabilities: [NexusCapability] = []
    @State private var selected: NexusCapability?
    @State private var errorMessage: String?
    @State private var isLoading = true
    @State private var lastExecutionStatus: String?

    private var client: NexusClient {
        NexusClientFactory.makeClient()
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                GeometryReader { proxy in
                    ZStack {
                        Circle()
                            .stroke(.purple.opacity(0.22), lineWidth: 1)
                            .frame(width: min(proxy.size.width, proxy.size.height) * 0.72)
                            .rotation3DEffect(.degrees(64), axis: (x: 1, y: 0, z: 0))
                        Circle()
                            .stroke(.teal.opacity(0.16), lineWidth: 1)
                            .frame(width: min(proxy.size.width, proxy.size.height) * 0.48)
                            .rotation3DEffect(.degrees(64), axis: (x: 1, y: 0, z: 0))
                        Circle()
                            .fill(.black)
                            .overlay(Circle().stroke(.white.opacity(0.16), lineWidth: 1))
                            .frame(width: 92, height: 92)
                            .overlay {
                                VStack(spacing: 5) {
                                    Image(systemName: "point.3.connected.trianglepath.dotted")
                                        .foregroundStyle(.purple)
                                    Text("NEXUS").font(.caption2).tracking(2)
                                }
                            }

                        ForEach(Array(capabilities.enumerated()), id: \.element.id) { index, capability in
                            let angle = Double(index) / Double(max(capabilities.count, 1)) * Double.pi * 2
                            let radius = min(proxy.size.width, proxy.size.height) * 0.29
                            Button {
                                selected = capability
                            } label: {
                                VStack(spacing: 5) {
                                    Image(systemName: "sparkles")
                                        .frame(width: 34, height: 34)
                                        .background(.white.opacity(0.05), in: Circle())
                                    Text(capability.name)
                                        .font(.caption2)
                                        .lineLimit(2)
                                        .multilineTextAlignment(.center)
                                        .frame(width: 92)
                                }
                                .foregroundStyle(.white)
                            }
                            .buttonStyle(.plain)
                            .offset(x: cos(angle) * radius, y: sin(angle) * radius)
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .navigationTitle("Resonance")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await load() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(isLoading)
                }
            }
            .task { await load() }
            .sheet(item: $selected) { capability in
                CapabilityDetail(
                    capability: capability,
                    lastStatus: lastExecutionStatus,
                    onExecute: { await execute(capability) }
                )
                .presentationDetents([.medium, .large])
            }
            .overlay {
                if isLoading {
                    ProgressView("Connecting to Nexus…")
                        .padding()
                        .background(.black.opacity(0.8), in: RoundedRectangle(cornerRadius: 14))
                } else if let errorMessage {
                    ContentUnavailableView("Unable to load", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
                } else if capabilities.isEmpty {
                    ContentUnavailableView("No capabilities", systemImage: "square.stack.3d.up")
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            capabilities = try await client.capabilities()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func execute(_ capability: NexusCapability) async {
        lastExecutionStatus = "Running…"
        do {
            let response = try await client.execute(
                NexusIntentRequest(
                    objective: "Execute \(capability.name)",
                    requestedBy: "ios-user",
                    requirements: [NexusCapabilityRequirement(key: capability.key)]
                )
            )
            if let status = response.status, status == "approval_required" {
                lastExecutionStatus = "Approval required"
            } else if let execution = response.execution {
                lastExecutionStatus = "Execution \(execution.status)"
            } else {
                lastExecutionStatus = "Completed"
            }
        } catch let error as NexusClientError {
            switch error {
            case .httpStatus(let code, let message):
                lastExecutionStatus = "HTTP \(code): \(message ?? "error")"
            default:
                lastExecutionStatus = String(describing: error)
            }
        } catch {
            lastExecutionStatus = error.localizedDescription
        }
    }
}

private struct CapabilityDetail: View {
    let capability: NexusCapability
    var lastStatus: String?
    var onExecute: () async -> Void

    @State private var isExecuting = false

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text(capability.name).font(.title2.bold())
                Text(capability.key).font(.subheadline).foregroundStyle(.secondary)
                Label(capability.availability ?? "unknown", systemImage: "circle.fill")
                    .foregroundStyle(capability.availability == "available" ? .green : .orange)
                Text(capability.description ?? "Provider-neutral capability exposed through the Resonance Nexus.")
                    .foregroundStyle(.secondary)

                if let lastStatus {
                    Text(lastStatus)
                        .font(.footnote)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))
                }

                Button {
                    Task {
                        isExecuting = true
                        await onExecute()
                        isExecuting = false
                    }
                } label: {
                    HStack {
                        if isExecuting { ProgressView() }
                        Text(isExecuting ? "Executing…" : "Execute via Nexus")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(isExecuting || capability.availability == "planned" || capability.availability == "unavailable")

                Spacer()
            }
            .padding()
            .navigationTitle("Capability")
        }
    }
}
