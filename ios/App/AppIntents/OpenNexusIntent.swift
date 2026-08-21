import AppIntents
import ResonanceCore

/// Opens the Resonance cockpit (foreground).
struct OpenNexusIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Nexus"
    static var description = IntentDescription("Open the Resonance Nexus cockpit")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        .result()
    }
}
