import AppIntents
import ResonanceCore

struct ListCapabilitiesIntent: AppIntent {
    static var title: LocalizedStringResource = "List Capabilities"
    static var description = IntentDescription("Show capabilities exposed by the Resonance Nexus")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Project ID", default: "demo")
    var projectId: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        do {
            let client = NexusClientFactory.makeClient(projectId: projectId)
            let capabilities = try await client.capabilities()
            if capabilities.isEmpty {
                return .result(dialog: "No capabilities are currently available.")
            }
            let lines = capabilities.prefix(12).map { cap in
                "\(cap.name) (\(cap.key)) — \(cap.availability?.rawValue ?? "unknown")"
            }
            var message = lines.joined(separator: "\n")
            if capabilities.count > 12 {
                message += "\n… and \(capabilities.count - 12) more"
            }
            return .result(dialog: IntentDialog(stringLiteral: message))
        } catch {
            let mapped = NexusUserFacingError.map(error)
            return .result(dialog: IntentDialog(stringLiteral: "\(mapped.title). \(mapped.message)"))
        }
    }
}
