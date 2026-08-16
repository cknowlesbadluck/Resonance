import SwiftUI
import ResonanceCore

@main
struct ResonanceApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @State private var capabilities: [NexusCapability] = []
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List(capabilities, id: \.id) { capability in
                VStack(alignment: .leading, spacing: 4) {
                    Text(capability.name).font(.headline)
                    Text(capability.key).font(.subheadline).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Resonance")
            .overlay {
                if let errorMessage {
                    ContentUnavailableView("Unable to load", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
                } else if capabilities.isEmpty {
                    ContentUnavailableView("No capabilities", systemImage: "square.stack.3d.up")
                }
            }
        }
    }
}
