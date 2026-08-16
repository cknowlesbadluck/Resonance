import SwiftUI
import ResonanceCore

@main
struct ResonanceApp: App {
    var body: some Scene {
        WindowGroup {
            ResonanceRootView()
        }
    }
}

private enum ResonanceTab: Hashable {
    case nexus
    case executions
    case capabilities
    case evidence
}

struct ResonanceRootView: View {
    @State private var selectedTab: ResonanceTab = .nexus

    var body: some View {
        TabView(selection: $selectedTab) {
            NexusHomeView()
                .tabItem { Label("Nexus", systemImage: "circle.hexagongrid.fill") }
                .tag(ResonanceTab.nexus)

            ExecutionsView()
                .tabItem { Label("Executions", systemImage: "bolt.fill") }
                .tag(ResonanceTab.executions)

            CapabilitiesView()
                .tabItem { Label("Capabilities", systemImage: "square.stack.3d.up.fill") }
                .tag(ResonanceTab.capabilities)

            EvidenceView()
                .tabItem { Label("Evidence", systemImage: "checkmark.seal.fill") }
                .tag(ResonanceTab.evidence)
        }
        .tint(.primary)
    }
}

private struct NexusHomeView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Nexus")
                            .font(.largeTitle.bold())
                        Text("Your execution control plane")
                            .foregroundStyle(.secondary)
                    }

                    HStack(spacing: 12) {
                        StatusCard(title: "System", value: "Ready", symbol: "checkmark.circle.fill")
                        StatusCard(title: "Executions", value: "0 active", symbol: "bolt.fill")
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Quick actions")
                            .font(.headline)
                        ActionRow(title: "Start an execution", subtitle: "Create a new intent", symbol: "play.fill")
                        ActionRow(title: "Review approvals", subtitle: "Nothing requires attention", symbol: "checkmark.shield")
                    }
                }
                .padding()
            }
            .navigationTitle("Resonance")
        }
    }
}

private struct StatusCard: View {
    let title: String
    let value: String
    let symbol: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: symbol)
                .font(.title3)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18))
    }
}

private struct ActionRow: View {
    let title: String
    let subtitle: String
    let symbol: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: symbol)
                .frame(width: 32, height: 32)
                .background(.quaternary, in: Circle())
            VStack(alignment: .leading) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(subtitle).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

private struct ExecutionsView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView("No executions", systemImage: "bolt", description: Text("Completed and active work will appear here."))
                .navigationTitle("Executions")
        }
    }
}

private struct CapabilitiesView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView("No capabilities", systemImage: "square.stack.3d.up", description: Text("Available tools and providers will appear here."))
                .navigationTitle("Capabilities")
        }
    }
}

private struct EvidenceView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView("No evidence", systemImage: "checkmark.seal", description: Text("Execution evidence will appear here after work completes."))
                .navigationTitle("Evidence")
        }
    }
}
