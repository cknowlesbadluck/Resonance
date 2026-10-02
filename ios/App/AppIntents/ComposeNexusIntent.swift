import AppIntents
import ResonanceCore

struct ComposeNexusIntent: AppIntent {
    static var title: LocalizedStringResource = "Compose Intent"
    static var description = IntentDescription("Compose an objective into a Nexus execution plan")
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
            let response = try await client.compose(request)
            let plan = response.plan
            let summary = """
            Plan \(plan.id.prefix(8))…
            Mode: \(plan.mode)
            Steps: \(plan.steps.count)
            Approval required: \(plan.approvalRequired ? "yes" : "no")
            """.trimmingCharacters(in: .whitespacesAndNewlines)
            return .result(dialog: IntentDialog(stringLiteral: summary))
        } catch let error as NexusClientError {
            return .result(dialog: dialog(for: error))
        } catch {
            return .result(dialog: "Compose failed: \(error.localizedDescription)")
        }
    }

    private func dialog(for error: NexusClientError) -> IntentDialog {
        IntentDialog(stringLiteral: error.userFacingMessage)
    }
}
