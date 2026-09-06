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
            CockpitView()
        }
    }
}
