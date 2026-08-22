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
            .tabItem { Label("Home", systemImage: "circle.grid.cross") }
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
            .tabItem { Label("History", systemImage: "clock.arrow.circlepath") }
            .tag(CockpitTab.history)

            NavigationStack {
                SettingsView()
            }
            .tabItem { Label("Settings", systemImage: "gearshape") }
            .tag(CockpitTab.settings)
        }
        .task {
            await store.refreshCapabilities()
        }
    }
}

struct HomeView: View {
    @Environment(NexusCockpitStore.self) private var store
    var onCompose: () -> Void

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Resonance")
                        .font(.largeTitle.bold())
                    Text("Express an outcome. Review the plan. Execute under policy. Inspect evidence.")
                        .foregroundStyle(.secondary)
                    Button(action: onCompose) {
                        Label("Compose intent", systemImage: "plus.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding(.vertical, 4)
                .listRowBackground(Color.clear)
            }

            if let error = store.bannerError {
                Section("Status") {
                    ErrorCard(error: error)
                }
            }

            if let execution = store.lastExecution {
                Section("Latest execution") {
                    LabeledContent("ID", value: String(execution.id.prefix(8)) + "…")
                    LabeledContent("Status", value: execution.status)
                    if let error = execution.error {
                        Text(error).foregroundStyle(.red)
                    }
                }
            }

            Section("Pending / recent") {
                if store.history.isEmpty {
                    Text("No local history yet. Compose an intent to start.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(store.history.prefix(5)) { execution in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(execution.status.capitalized)
                                .font(.headline)
                            Text(String(execution.id))
                                .font(.caption.monospaced())
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            Section("SideStore") {
                Text("This build targets sideloaded distribution. Configure Base URL and token under Settings so a physical device can reach your Nexus host.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Nexus")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await store.refreshCapabilities() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
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
            }

            Section("Capability (optional)") {
                Picker("Capability", selection: $store.selectedCapabilityKey) {
                    Text("Auto / none").tag(String?.none)
                    ForEach(store.capabilities) { capability in
                        Text("\(capability.name) (\(capability.key))").tag(Optional(capability.key))
                    }
                }
            }

            if let error = store.bannerError {
                Section {
                    ErrorCard(error: error)
                }
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
                .disabled(store.isComposing || store.objective.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                Button {
                    Task { await store.executePlan() }
                } label: {
                    HStack {
                        if store.isExecuting { ProgressView() }
                        Text(store.isExecuting ? "Executing…" : "Execute via Nexus")
                    }
                }
                .disabled(store.isExecuting || store.objective.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
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
                            if step.requiresApproval {
                                Text("Requires approval")
                                    .font(.caption2)
                                    .foregroundStyle(.orange)
                            }
                        }
                    }
                }
            }

            if let execution = store.lastExecution {
                Section("Result") {
                    LabeledContent("Execution", value: execution.status)
                    if let completed = execution.completedAt {
                        LabeledContent("Completed", value: completed)
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
                List(store.capabilities) { capability in
                    Button {
                        selected = capability
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(capability.name).font(.headline)
                            Text(capability.key).font(.caption.monospaced()).foregroundStyle(.secondary)
                            HStack {
                                Text(capability.availability?.rawValue ?? "unknown")
                                    .font(.caption2)
                                if capability.risk != .unknown("unspecified") {
                                    Text("·")
                                    Text(String(describing: capability.risk))
                                        .font(.caption2)
                                }
                            }
                            .foregroundStyle(.secondary)
                        }
                    }
                    .buttonStyle(.plain)
                }
                .refreshable { await store.refreshCapabilities() }
            }
        }
        .navigationTitle("Capabilities")
        .sheet(item: $selected) { capability in
            NavigationStack {
                CapabilityDetailView(capability: capability)
            }
            .presentationDetents([.medium, .large])
        }
    }
}

struct CapabilityDetailView: View {
    @Environment(NexusCockpitStore.self) private var store
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
            Section {
                Button("Use in Intent") {
                    store.selectedCapabilityKey = capability.key
                    store.objective = store.objective.isEmpty ? "Execute \(capability.name)" : store.objective
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
                                Text(String(execution.id.prefix(8)) + "…")
                                    .font(.caption.monospaced())
                                    .foregroundStyle(.secondary)
                            }
                            if let started = execution.startedAt {
                                Text(started).font(.caption2).foregroundStyle(.secondary)
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
                            Text("\(item.type.rawValue) · exec \(item.executionId.prefix(8))…")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle("History")
        .refreshable { await store.refreshHistory() }
        .task { await store.refreshHistory() }
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

            Section("SideStore / sideload") {
                Text("No App Store–only services are required. Tokens stay in Keychain; Base URL must be reachable from the device (LAN HTTPS or tunnel), not only from a Mac simulator’s localhost.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                LabeledContent("Token stored", value: store.hasStoredToken ? "Yes" : "No")
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
