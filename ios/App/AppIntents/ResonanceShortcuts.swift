import AppIntents

struct ResonanceShortcuts: AppShortcutsProvider {
    @AppShortcutsBuilder
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: ComposeNexusIntent(),
            phrases: [
                "Compose an intent in \(.applicationName)",
                "Plan \(\.$objective) with \(.applicationName)",
                "Compose \(\.$objective) in \(.applicationName)"
            ],
            shortTitle: "Compose",
            systemImageName: "point.3.connected.trianglepath.dotted"
        )
        AppShortcut(
            intent: ExecuteNexusPlanIntent(),
            phrases: [
                "Execute \(\.$objective) in \(.applicationName)",
                "Run \(\.$objective) with \(.applicationName)"
            ],
            shortTitle: "Execute",
            systemImageName: "play.fill"
        )
        AppShortcut(
            intent: ListCapabilitiesIntent(),
            phrases: [
                "Show capabilities in \(.applicationName)",
                "List Nexus capabilities in \(.applicationName)",
                "What can \(.applicationName) do"
            ],
            shortTitle: "Capabilities",
            systemImageName: "square.stack.3d.up"
        )
        AppShortcut(
            intent: OpenNexusIntent(),
            phrases: [
                "Open \(.applicationName)",
                "Open Nexus in \(.applicationName)"
            ],
            shortTitle: "Open",
            systemImageName: "circle.hexagongrid.fill"
        )
    }
}
