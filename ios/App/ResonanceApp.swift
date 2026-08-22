import SwiftUI
import ResonanceCore
import AppIntents

@main
struct ResonanceApp: App {
    @State private var store = NexusCockpitStore()

    init() {
        ResonanceShortcuts.updateAppShortcutParameters()
    }

    var body: some Scene {
        WindowGroup {
            CockpitRootView()
                .environment(store)
                .preferredColorScheme(.dark)
        }
    }
}

enum CockpitTab: Hashable {
    case home, compose, capabilities, history, settings
}

struct CockpitRootView: View {
    @Environment(NexusCockpitStore.self) private var store
    @State private var tab: CockpitTab = .home

    var body: some View {
        TabView(selection: $tab) {
            NavigationStack {
                HomeView(onCompose: { tab = .compose })
            }
            .tabItem { Label("Nexus", systemImage: "circle.grid.cross") }
            .tag(CockpitTab.home)

            NavigationStack {
                ComposeView()
            }
            .tabItem { Label("Intent", systemImage: "text.cursor") }
            .tag(CockpitTab.compose)

            NavigationStack {
                CapabilitiesView()
            }
            .tabItem { Label("Capabilities", systemImage: "square.stack.3d.up") }
            .tag(CockpitTab.capabilities)

            NavigationStack {
                HistoryView()
            }
            .tabItem { Label("Evidence", systemImage: "clock.arrow.circlepath") }
            .tag(CockpitTab.history)

            NavigationStack {
                SettingsView()
            }
            .tabItem { Label("Settings", systemImage: "gearshape") }
            .tag(CockpitTab.settings)
        }
        .task {
            await store.refreshCapabilities()
            await store.refreshHistory()
        }
    }
}

struct HomeView: View {
    @Environment(NexusCockpitStore.self) private var store
    var onCompose: () -> Void
    @State private var selected: NexusCapability?

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            SpatialNexusMap(capabilities: store.capabilities) { capability in
                selected = capability
                store.selectCapability(capability)
            }

            VStack {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("RESONANCE")
                            .font(.caption.weight(.semibold))
                            .tracking(3)
                            .foregroundStyle(.white.opacity(0.7))
                        Text(store.capabilities.isEmpty ? "No live capabilities" : "\(store.capabilities.count) capabilities")
                            .font(.footnote)
                            .foregroundStyle(.white.opacity(0.55))
                    }
                    Spacer()
                    Button {
                        Task { await store.refreshCapabilities() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(store.isLoadingCapabilities)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)

                Spacer()

                if let error = store.bannerError {
                    ErrorCard(error: error)
                        .padding()
                        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 14))
                        .padding(.horizontal)
                }

                HStack(spacing: 12) {
                    Button(action: onCompose) {
                        Label("Compose intent", systemImage: "plus.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)

                    if let execution = store.lastExecution {
                        Text(execution.status.uppercased())
                            .font(.caption.monospaced())
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .background(.white.opacity(0.08), in: Capsule())
                    }
                }
                .padding(20)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .navigationBar)
        .sheet(item: $selected) { capability in
            NavigationStack {
                CapabilityDetailView(capability: capability)
            }
            .presentationDetents([.medium, .large])
        }
        .overlay {
            if store.isLoadingCapabilities && store.capabilities.isEmpty {
                ProgressView("Connecting to Nexus…")
                    .padding()
                    .background(.black.opacity(0.8), in: RoundedRectangle(cornerRadius: 14))
            }
        }
    }
}

struct SpatialNexusMap: View {
    let capabilities: [NexusCapability]
    var onSelect: (NexusCapability) -> Void

    var body: some View {
        GeometryReader { proxy in
            let extent = min(proxy.size.width, proxy.size.height)
            ZStack {
                Circle()
                    .stroke(.purple.opacity(0.22), lineWidth: 1)
                    .frame(width: extent * 0.72)
                    .rotation3DEffect(.degrees(64), axis: (x: 1, y: 0, z: 0))
                Circle()
                    .stroke(.teal.opacity(0.16), lineWidth: 1)
                    .frame(width: extent * 0.48)
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
                    .accessibilityLabel("Nexus")

                ForEach(Array(capabilities.enumerated()), id: \.element.id) { index, capability in
                    let angle = Double(index) / Double(max(capabilities.count, 1)) * Double.pi * 2
                    let radius = extent * 0.29
                    Button {
                        onSelect(capability)
                    } label: {
                        VStack(spacing: 5) {
                            Image(systemName: symbol(for: capability))
                                .frame(width: 34, height: 34)
                                .background(availabilityColor(capability).opacity(0.22), in: Circle())
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
                    .accessibilityLabel(capability.name)
                    .accessibilityHint(capability.key)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private func availabilityColor(_ capability: NexusCapability) -> Color {
        switch capability.availability {
        case .available: return .green
        case .degraded: return .orange
        case .unavailable, .planned: return .red
        default: return .white
        }
    }

    private func symbol(for capability: NexusCapability) -> String {
        switch capability.kind {
        case .skill: return "brain.head.profile"
        case .tool: return "wrench.and.screwdriver"
        case .integration: return "link"
        case .resource: return "externaldrive"
        default: return "sparkles"
        }
    }
}

struct ComposeView: View {
    @Environment(NexusCockpitStore.self) private var store

    var body: some View {
        @Bindable var store = store
        Form {
            Section("Outcome") {
                TextField("What should Nexus accomplish?", text: $store.objective, axis: .vertical)
                    .lineLimit(3...8)
                    .accessibilityLabel("Objective")
            }

            Section("Capability") {
                Picker("Capability", selection: $store.selectedCapabilityKey) {
                    Text("Let Nexus compose"  ).tag(String?.none)
                    ForEach(store.capabilities) { capability in
                        Text("\(capability.name) (\(capability.key))").tag(Optional(capability.key))
                    }
                }
            }

            if let error = store.bannerError {
                Section { ErrorCard(error: error) }
            }

            Section {
                Button {
                    Task { await store.compose() }
                } label: {
                    HStack {
                        if store.isComposing { ProgressView() }
                        Text(store.isComposing ? "Composing…" : "Compose plan")
                    }
                }
                .disabled(store.isComposing)

                Button {
                    Task { await store.executePlan() }
                } label: {
                    HStack {
                        if store.isExecuting { ProgressView() }
                        Text(store.isExecuting ? "Executing…" : "Execute via Nexus")
                    }
                }
                .disabled(store.isExecuting)
            }

            if store.approvalPending {
                Section("Policy") {
                    Text("This plan requires explicit approval. The server remains authoritative.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    Button("Approve and resume") {
                        Task { await store.resumeApproval(approved: true) }
                    }
                    .disabled(store.isExecuting)
                    Button("Cancel", role: .destructive) {
                        Task { await store.resumeApproval(approved: false) }
                    }
                    .disabled(store.isExecuting)
                }
            }

            if let plan = store.plan {
                Section("Plan") {
                    LabeledContent("Mode", value: plan.mode)
                    LabeledContent("Steps", value: "\(plan.steps.count)")
                    LabeledContent("Approval", value: plan.approvalRequired ? "Required" : "Not required")
                    if !plan.rationale.isEmpty {
                        ForEach(plan.rationale, id: \.self) { line in
                            Text(line).font(.footnote).foregroundStyle(.secondary)
                        }
                    }
                    ForEach(plan.steps) { step in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(step.capabilityId).font(.subheadline.weight(.semibold))
                            Text("Adapter \(step.adapterId)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(step.input.prettyPrinted())
                                .font(.caption.monospaced())
                                .foregroundStyle(.secondary)
                            if step.requiresApproval {
                                Text("Requires approval")
                                    .font(.caption2)
                                    .foregroundStyle(.orange)
                            }
                        }
                        .accessibilityElement(children: .combine)
                    }
                }
            }

            if let execution = store.lastExecution {
                Section("Result") {
                    LabeledContent("Execution", value: execution.status)
                    LabeledContent("ID", value: execution.id)
                    if let completed = execution.completedAt {
                        LabeledContent("Completed", value: completed)
                    }
                    if let output = execution.output {
                        Text(output.prettyPrinted())
                            .font(.footnote.monospaced())
                            .textSelection(.enabled)
                    }
                    if let error = execution.error {
                        Text(error).foregroundStyle(.red)
                    }
                }
            }

            if !store.lastEvidence.isEmpty {
                Section("Evidence") {
                    ForEach(store.lastEvidence) { item in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.summary)
                            Text("\(item.type.rawValue) · \(item.createdAt)")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            if let payload = item.payload {
                                Text(payload.prettyPrinted())
                                    .font(.caption.monospaced())
                                    .foregroundStyle(.secondary)
                                    .textSelection(.enabled)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Intent")
    }
}

struct CapabilitiesView: View {
    @Environment(NexusCockpitStore.self) private var store
    @State private var selected: NexusCapability?
    @State private var query = ""

    var filtered: [NexusCapability] {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !q.isEmpty else { return store.capabilities }
        return store.capabilities.filter {
            $0.name.lowercased().contains(q) || $0.key.lowercased().contains(q)
        }
    }

    var body: some View {
        Group {
            if store.isLoadingCapabilities && store.capabilities.isEmpty {
                ProgressView("Loading capabilities…")
            } else if store.capabilities.isEmpty {
                ContentUnavailableView(
                    "No capabilities",
                    systemImage: "square.stack.3d.up.slash",
                    description: Text("Pull to refresh, or check Base URL and token in Settings.")
                )
            } else {
                List(filtered) { capability in
                    Button {
                        selected = capability
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(capability.name).font(.headline)
                            Text(capability.key).font(.caption.monospaced()).foregroundStyle(.secondary)
                            HStack {
                                Text(capability.availability?.rawValue ?? "unknown")
                                    .font(.caption2)
                                Text(riskLabel(capability.risk))
                                    .font(.caption2)
                            }
                            .foregroundStyle(.secondary)
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(capability.name), \(capability.availability?.rawValue ?? "unknown")")
                }
                .refreshable { await store.refreshCapabilities() }
            }
        }
        .searchable(text: $query)
        .navigationTitle("Capabilities")
        .sheet(item: $selected) { capability in
            NavigationStack {
                CapabilityDetailView(capability: capability)
            }
            .presentationDetents([.medium, .large])
        }
    }

    private func riskLabel(_ risk: CapabilityRisk) -> String {
        switch risk {
        case .low: return "low risk"
        case .medium: return "medium risk"
        case .high: return "high risk"
        case .critical: return "critical risk"
        case .unknown(let raw): return raw
        }
    }
}

struct CapabilityDetailView: View {
    @Environment(NexusCockpitStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let capability: NexusCapability

    var body: some View {
        List {
            Section {
                Text(capability.name).font(.title2.bold())
                Text(capability.key).font(.subheadline.monospaced()).foregroundStyle(.secondary)
                Text(capability.description ?? "Provider-neutral capability exposed through the Resonance Nexus.")
                    .foregroundStyle(.secondary)
            }
            Section("Metadata") {
                LabeledContent("Availability", value: capability.availability?.rawValue ?? "unknown")
                LabeledContent("Provider", value: capability.providerId ?? "—")
                LabeledContent("Adapter", value: capability.adapterId ?? "—")
                LabeledContent("Version", value: capability.version ?? "—")
            }
            if !capability.requiredPermissions.isEmpty {
                Section("Permissions") {
                    ForEach(capability.requiredPermissions, id: \.self) { Text($0) }
                }
            }
            if let dependencies = capability.dependencies, !dependencies.isEmpty {
                Section("Dependencies") {
                    ForEach(dependencies, id: \.capabilityKey) { dep in
                        Text(dep.capabilityKey)
                    }
                }
            }
            Section {
                Button("Use in Intent") {
                    store.selectCapability(capability)
                    dismiss()
                }
                Button("Execute now") {
                    store.selectCapability(capability)
                    Task {
                        await store.executePlan()
                        dismiss()
                    }
                }
            }
        }
        .navigationTitle("Capability")
    }
}

struct HistoryView: View {
    @Environment(NexusCockpitStore.self) private var store

    var body: some View {
        List {
            if let error = store.bannerError {
                Section { ErrorCard(error: error) }
            }
            Section("Executions") {
                if store.history.isEmpty {
                    Text("No executions loaded.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(store.history) { execution in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(execution.status.capitalized).font(.headline)
                                Spacer()
                                Text(execution.id)
                                    .font(.caption.monospaced())
                                    .foregroundStyle(.secondary)
                                    .textSelection(.enabled)
                            }
                            if let started = execution.startedAt {
                                Text(started).font(.caption2).foregroundStyle(.secondary)
                            }
                            if let output = execution.output {
                                Text(output.prettyPrinted())
                                    .font(.caption.monospaced())
                                    .foregroundStyle(.secondary)
                                    .textSelection(.enabled)
                            }
                            if let error = execution.error {
                                Text(error).font(.footnote).foregroundStyle(.red)
                            }
                        }
                    }
                }
            }
            if !store.historyEvidence.isEmpty {
                Section("Evidence") {
                    ForEach(store.historyEvidence) { item in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.summary)
                            Text("\(item.type.rawValue) · exec \(item.executionId)")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            if let payload = item.payload {
                                Text(payload.prettyPrinted())
                                    .font(.caption.monospaced())
                                    .textSelection(.enabled)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Evidence")
        .refreshable { await store.refreshHistory() }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await store.refreshHistory() }
                } label: {
                    if store.isLoadingHistory {
                        ProgressView()
                    } else {
                        Image(systemName: "arrow.clockwise")
                    }
                }
                .accessibilityLabel("Refresh evidence")
            }
        }
    }
}

struct SettingsView: View {
    @Environment(NexusCockpitStore.self) private var store

    var body: some View {
        @Bindable var store = store
        Form {
            Section("Nexus connection") {
                TextField("Base URL", text: $store.baseURLString)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.URL)
                TextField("Project ID", text: $store.projectId)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                SecureField(store.hasStoredToken ? "Replace bearer token" : "Bearer token", text: $store.bearerTokenField)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                Button("Save connection") {
                    store.saveConnectionSettings()
                }
            }

            Section("Distribution") {
                Text("SideStore / sideload is supported. That does not remove App Intents, plan review, approval resume, evidence, or authenticated Nexus calls. Avoid App Store–only services (StoreKit, CloudKit identity, required push). Point Base URL at a device-reachable Nexus host.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                LabeledContent("Token stored", value: store.hasStoredToken ? "Yes" : "No")
                LabeledContent("App Intents", value: "Compose, Execute, List, Open")
            }

            Section("About") {
                LabeledContent("Client", value: "Resonance iOS cockpit")
                LabeledContent("Role", value: "Control surface over Nexus")
            }
        }
        .navigationTitle("Settings")
    }
}

struct ErrorCard: View {
    let error: NexusUserFacingError

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(error.title).font(.headline)
            Text(error.message).font(.footnote).foregroundStyle(.secondary)
            if error.isRetryable {
                Text("Retryable")
                    .font(.caption2)
                    .foregroundStyle(.orange)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

#Preview("Home") {
    CockpitRootView()
        .environment(NexusCockpitStore())
}
