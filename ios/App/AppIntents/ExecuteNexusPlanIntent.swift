import AppIntents
import ResonanceCore

struct ExecuteNexusPlanIntent: AppIntent {
    static var title: LocalizedStringResource = "Execute Nexus Plan"
    static var description = IntentDescription("Execute an objective through the Resonance Nexus")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Objective")
    var objective: String

    /// Optional: falls back to the configured project; Siri prompts when neither exists.
    @Parameter(title: "Project ID", description: "Resonance project UUID")
    var projectId: String?

    @Parameter(title: "Capability")
    var capability: NexusCapabilityEntity?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Validate before the do/catch below so the needsValue prompts reach Siri /
        // Shortcuts instead of being rendered as a generic failure dialog.
        guard let objectiveText = NexusIntentValidation.trimmedObjective(objective) else {
            throw $objective.needsValueError("What should Resonance do?")
        }
        let resolvedProjectId: String
        switch NexusIntentValidation.resolveProject(projectId) {
        case .resolved(let value):
            resolvedProjectId = value
        case .missing:
            throw $projectId.needsValueError("Which Resonance project ID should this use?")
        case .invalid(let value):
            throw $projectId.needsValueError("\"\(value)\" is not a valid project ID. Enter the project UUID.")
        }
        guard let requirements = NexusIntentValidation.requirements(for: capability) else {
            throw $capability.needsValueError("Which capability should Nexus use?")
        }

        do {
            let client = NexusClientFactory.makeClient(projectId: resolvedProjectId)
            let request = NexusIntentRequest(
                projectId: resolvedProjectId,
                objective: objectiveText,
                requestedBy: "ios-app-intent",
                requirements: requirements
            )
            let response = try await client.execute(request)
            if response.status == "approval_required" {
                return .result(dialog: "Approval required. Open Resonance to review the plan.")
            }
            if let execution = response.execution {
                if let error = execution.error, !error.isEmpty {
                    return .result(dialog: "Execution \(execution.status): \(error)")
                }
                return .result(dialog: "Execution \(execution.id.prefix(8))… — \(execution.status)")
            }
            return .result(dialog: "Result: \(response.status ?? "completed")")
        } catch let error as NexusClientError {
            return .result(dialog: dialog(for: error))
        } catch {
            return .result(dialog: "Execute failed: \(error.localizedDescription)")
        }
    }

    private func dialog(for error: NexusClientError) -> IntentDialog {
        IntentDialog(stringLiteral: error.userFacingMessage)
    }
}
