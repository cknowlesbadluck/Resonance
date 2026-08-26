import SwiftUI
import ResonanceCore
import AppIntents

@main
struct ResonanceApp: App {
    init() {
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
                        // Orbital rings to convey Nexus connectivity instead of a dashboard
                        Circle()
                            .stroke(.purple.opacity(0.3), lineWidth: 1.5)
                            .frame(width: min(proxy.size.width, proxy.size.height) * 0.8)
                            .rotation3DEffect(.degrees(70), axis: (x: 1, y: 0.2, z: 0))
                        Circle()
                            .stroke(.teal.opacity(0.2), lineWidth: 1.5)
                            .frame(width: min(proxy.size.width, proxy.size.height) * 0.5)
                            .rotation3DEffect(.degrees(70), axis: (x: 1, y: -0.2, z: 0))

                        // Central Nexus node
                        Circle()
                            .fill(LinearGradient(colors: [.black, .purple.opacity(0.2)], startPoint: .top, endPoint: .bottom))
                            .overlay(Circle().stroke(.white.opacity(0.2), lineWidth: 1))
                            .frame(width: 100, height: 100)
                            .shadow(color: .purple.opacity(0.5), radius: 20)
                            .overlay {
                                VStack(spacing: 6) {
                                    Image(systemName: "network")
                                        .foregroundStyle(.purple)
                                        .font(.title2)
                                    Text("NEXUS").font(.caption).tracking(3).fontWeight(.medium)
                                }
                            }

                        // Distributed capabilities along the outer ring
                        ForEach(Array(capabilities.enumerated()), id: \.element.id) { index, capability in
                            let angle = Double(index) / Double(max(capabilities.count, 1)) * Double.pi * 2
                            let radius = min(proxy.size.width, proxy.size.height) * 0.35
                            Button {
                                selected = capability
                            } label: {
                                VStack(spacing: 6) {
                                    Image(systemName: capabilityIcon(for: capability))
                                        .font(.system(size: 18))
                                        .frame(width: 44, height: 44)
                                        .background(.white.opacity(0.08), in: Circle())
                                        .overlay(Circle().stroke(.white.opacity(0.1), lineWidth: 1))
                                    Text(capability.name)
                                        .font(.caption2)
                                        .lineLimit(2)
                                        .multilineTextAlignment(.center)
                                        .frame(width: 90)
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
                        Image(systemName: "arrow.triangle.2.circlepath")
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
                        .padding(20)
                        .background(.black.opacity(0.85), in: RoundedRectangle(cornerRadius: 16))
                        .shadow(radius: 10)
                } else if let errorMessage {
                    ContentUnavailableView("Connection Failed", systemImage: "bolt.slash.fill", description: Text(errorMessage))
                } else if capabilities.isEmpty {
                    ContentUnavailableView("No Capabilities", systemImage: "sparkles.rectangle.stack")
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func capabilityIcon(for capability: NexusCapability) -> String {
        let key = capability.key.lowercased()
        if key.contains("github") { return "chevron.left.forwardslash.chevron.right" }
        if key.contains("read") { return "doc.text.magnifyingglass" }
        if key.contains("write") { return "square.and.pencil" }
        if key.contains("list") { return "list.bullet" }
        return "sparkle"
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
        lastExecutionStatus = "Orchestrating..."
        do {
            let response = try await client.execute(
                NexusIntentRequest(
                    objective: "Execute capability: \(capability.name)",
                    requestedBy: "ios-client",
                    requirements: [NexusCapabilityRequirement(key: capability.key)]
                )
            )
            if let status = response.status, status == "approval_required" {
                lastExecutionStatus = "Awaiting explicit approval"
            } else if let execution = response.execution {
                lastExecutionStatus = "Execution Status: \(execution.status.capitalized)"
            } else {
                lastExecutionStatus = "Execution Completed"
            }
        } catch let error as NexusClientError {
            switch error {
            case .httpStatus(let code, let message):
                lastExecutionStatus = "Nexus Error [\(code)]: \(message ?? "Unknown")"
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
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(capability.name).font(.title2.bold())
                    Text(capability.key).font(.subheadline).foregroundStyle(.secondary).monospaced()
                }

                HStack(spacing: 12) {
                    Label(capability.availability?.rawValue.capitalized ?? "Unknown", systemImage: availabilityIcon)
                        .foregroundStyle(availabilityColor)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(availabilityColor.opacity(0.15), in: Capsule())

                    if let risk = capability.risk {
                        Label(risk.capitalized, systemImage: "shield.fill")
                            .foregroundStyle(risk == "low" ? .green : (risk == "medium" ? .orange : .red))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.white.opacity(0.05), in: Capsule())
                    }
                }
                .font(.caption.bold())

                Text(capability.description ?? "A provider-neutral capability exposed and brokered through the Resonance Nexus.")
                    .foregroundStyle(.secondary)
                    .lineSpacing(4)

                if let lastStatus {
                    HStack(alignment: .top) {
                        Image(systemName: "terminal")
                            .foregroundStyle(.secondary)
                        Text(lastStatus)
                            .font(.system(.footnote, design: .monospaced))
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                }

                Spacer()

                Button {
                    Task {
                        isExecuting = true
                        await onExecute()
                        isExecuting = false
                    }
                } label: {
                    HStack {
                        if isExecuting { ProgressView().tint(.white).padding(.trailing, 4) }
                        Text(isExecuting ? "Executing..." : "Execute via Nexus")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                }
                .buttonStyle(.borderedProminent)
                .tint(.purple)
                .disabled(isExecuting || capability.availability == .planned || capability.availability == .unavailable)
            }
            .padding(24)
            .navigationTitle("Capability Details")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var availabilityColor: Color {
        capability.availability == .available ? .green : .orange
    }

    private var availabilityIcon: String {
        capability.availability == .available ? "checkmark.circle.fill" : "exclamationmark.circle.fill"
    }
}
