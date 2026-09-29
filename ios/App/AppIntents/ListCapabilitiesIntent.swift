import AppIntents
import ResonanceCore

struct ListCapabilitiesIntent: AppIntent {
    static var title: LocalizedStringResource = "List Capabilities"
    static var description = IntentDescription("Show capabilities exposed by the Resonance Nexus")
    static var openAppWhenRun: Bool = false

    /// Optional: falls back to the configured project; Siri prompts when neither exists.
    @Parameter(title: "Project ID", description: "Resonance project UUID")
    var projectId: String?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let resolvedProjectId: String
        switch NexusIntentValidation.resolveProject(projectId) {
        case .resolved(let value):
            resolvedProjectId = value
        case .missing:
            throw $projectId.needsValueError("Which Resonance project ID should this use?")
        case .invalid(let value):
            throw $projectId.needsValueError("\"\(value)\" is not a valid project ID. Enter the project UUID.")
        }

        do {
            let client = NexusClientFactory.makeClient(projectId: resolvedProjectId)
            let capabilities = try await client.capabilities()
            if capabilities.isEmpty {
                return .result(dialog: "No capabilities are currently available.")
            }
            let lines = capabilities.prefix(12).map { cap in
                "\(cap.name) (\(cap.key)) — \(cap.availability ?? "unknown")"
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
        IntentDialog(stringLiteral: error.userFacingMessage)
    }
}
