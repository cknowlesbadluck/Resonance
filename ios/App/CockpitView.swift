import SwiftUI
import ResonanceCore

/// Root tab view for the P4 vertical: Compose → Execute → Evidence.
/// Approval-resume, History, and Settings are out of scope for this slice.
struct CockpitView: View {
    @State private var store = NexusCockpitStore(client: NexusClientFactory.makeClient())

    var body: some View {
        TabView {
            ComposeTab(store: store)
                .tabItem { Label("Compose", systemImage: "pencil.and.sparkles") }

            ExecutionStatusTab(store: store)
                .tabItem { Label("Execute", systemImage: "bolt.fill") }

            EvidenceTab(store: store)
                .tabItem { Label("Evidence", systemImage: "list.bullet.rectangle") }
        }
        .preferredColorScheme(.dark)
        .task { await store.loadCapabilities() }
    }
}

// MARK: - Compose Tab

struct ComposeTab: View {
    @Bindable var store: NexusCockpitStore

    var body: some View {
        NavigationStack {
            Form {
                Section("Objective") {
                    TextField("Describe what you want to accomplish", text: $store.objective, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Capability (optional)") {
                    if store.isLoadingCapabilities {
                        ProgressView("Loading capabilities…")
                    } else if let err = store.capabilitiesError {
                        Label(err, systemImage: "exclamationmark.triangle")
                            .foregroundStyle(.red)
                            .font(.footnote)
                    } else {
                        Picker("Capability", selection: $store.selectedCapabilityKey) {
                            Text("None (let Nexus decide)").tag("")
                            ForEach(store.capabilities) { cap in
                                Text(cap.name).tag(cap.key)
                            }
                        }
                    }
                }

                Section {
                    Button {
                        Task { await store.composeAndExecute() }
                    } label: {
                        HStack {
                            Spacer()
                            Label("Compose & Execute", systemImage: "bolt.fill")
                            Spacer()
                        }
                    }
                    .disabled(store.objective.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                              || store.executionState == .composing
                              || store.executionState == .executing)

                    if store.executionState != .idle {
                        Button("Reset", role: .destructive) {
                            store.resetExecution()
                        }
                    }
                }
            }
            .navigationTitle("Compose")
        }
    }
}

// MARK: - Execution Status Tab

struct ExecutionStatusTab: View {
    let store: NexusCockpitStore

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                executionContent
                Spacer()
            }
            .padding()
            .navigationTitle("Execute")
        }
    }

    @ViewBuilder
    private var executionContent: some View {
        switch store.executionState {
        case .idle:
            ContentUnavailableView(
                "No execution yet",
                systemImage: "bolt.slash",
                description: Text("Compose an objective to begin.")
            )

        case .composing:
            VStack(spacing: 12) {
                ProgressView()
                Text("Composing plan…").foregroundStyle(.secondary)
            }

        case .executing:
            VStack(spacing: 12) {
                ProgressView()
                Text("Executing…").foregroundStyle(.secondary)
            }

        case .awaitingApproval:
            VStack(spacing: 16) {
                Image(systemName: "hand.raised.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(.orange)
                Text("Approval Required")
                    .font(.title2.bold())
                Text("This execution requires explicit approval before it can proceed. Approval-resume is out of scope for this slice — see CHR-39.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

        case .completed(let response):
            VStack(alignment: .leading, spacing: 12) {
                Label("Execution complete", systemImage: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                    .font(.headline)
                if let execution = response.execution {
                    LabeledContent("Status", value: execution.status)
                    if let completedAt = execution.completedAt {
                        LabeledContent("Completed", value: completedAt)
                    }
                    if case .object(let dict) = execution.output,
                       let outputStr = try? JSONEncoder().encode(dict),
                       let pretty = String(data: outputStr, encoding: .utf8) {
                        ScrollView {
                            Text(pretty)
                                .font(.system(.footnote, design: .monospaced))
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .frame(maxHeight: 200)
                        .background(.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

        case .failed(let message):
            VStack(spacing: 12) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(.red)
                Text("Execution failed")
                    .font(.title3.bold())
                Text(message)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }
}

// MARK: - Evidence Tab

struct EvidenceTab: View {
    let store: NexusCockpitStore

    var body: some View {
        NavigationStack {
            Group {
                if store.evidence.isEmpty {
                    ContentUnavailableView(
                        "No evidence yet",
                        systemImage: "list.bullet.rectangle",
                        description: Text("Evidence will appear here after execution.")
                    )
                } else {
                    List(store.evidence) { item in
                        EvidenceRow(evidence: item)
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Evidence")
        }
    }
}

private struct EvidenceRow: View {
    let evidence: NexusEvidence

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Label(evidence.type.rawValue.capitalized, systemImage: iconName(for: evidence.type))
                    .font(.caption.bold())
                    .foregroundStyle(.secondary)
                Spacer()
                Text(evidence.createdAt.prefix(16))
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            Text(evidence.summary)
                .font(.subheadline)
            if let payload = evidence.payload, case .object = payload {
                Text(prettyPrint(payload))
                    .font(.system(.caption2, design: .monospaced))
                    .foregroundStyle(.secondary)
                    .lineLimit(4)
            }
        }
        .padding(.vertical, 4)
    }

    private func iconName(for kind: EvidenceKind) -> String {
        switch kind {
        case .event: return "bolt"
        case .artifact: return "doc"
        case .decision: return "checkmark.seal"
        case .audit: return "magnifyingglass"
        case .knowledge: return "brain"
        case .unknown: return "questionmark"
        }
    }

    private func prettyPrint(_ value: JSONValue) -> String {
        guard let data = try? JSONEncoder().encode(value),
              let obj = try? JSONSerialization.jsonObject(with: data),
              let pretty = try? JSONSerialization.data(withJSONObject: obj, options: .prettyPrinted),
              let str = String(data: pretty, encoding: .utf8) else {
            return ""
        }
        return str
    }
}
