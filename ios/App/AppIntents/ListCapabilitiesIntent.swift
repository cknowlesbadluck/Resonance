import AppIntents
import ResonanceCore

/// Lists currently available Nexus capabilities.
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
                let status = cap.availability ?? "unknown"
                return "\(cap.name) (\(cap.key)) — \(status)"
            }

            var message = lines.joined(separator: "\n")
            if capabilities.count > 12 {
                message += "\n… and \(capabilities.count - 12) more"
            }

            return .result(dialog: IntentDialog(stringLiteral: message))
        } catch let error as NexusClientError {
            return .result(dialog: dialog(for: error))
        } catch {
            return .result(dialog: "Unable to list capabilities: \(error.localizedDescription)")
        }
    }

    private func dialog(for error: NexusClientError) -> IntentDialog {
        switch error {
        case .httpStatus(401, _):
            return "Authentication required. Open Resonance and sign in."
        case .httpStatus(let code, let message):
            return IntentDialog(stringLiteral: "HTTP \(code): \(message ?? "error")")
        default:
            return IntentDialog(stringLiteral: String(describing: error))
        }
    }
}
