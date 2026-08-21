import AppIntents
import ResonanceCore

/// Executes an objective (or targeted capability) via the Nexus.
/// Always sends a non-blank Idempotency-Key through `NexusClient`.
/// Surfaces approval-required states without silent high-risk execution.
struct ExecuteNexusPlanIntent: AppIntent {
    static var title: LocalizedStringResource = "Execute Nexus Plan"
    static var description = IntentDescription("Execute an objective through the Resonance Nexus")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Objective")
    var objective: String

    @Parameter(title: "Project ID", default: "demo")
    var projectId: String

    @Parameter(title: "Capability Key")
    var capabilityKey: String?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let client = NexusClientFactory.makeClient(projectId: projectId)

        var requirements: [NexusCapabilityRequirement] = []
        if let key = capabilityKey?.trimmingCharacters(in: .whitespacesAndNewlines), !key.isEmpty {
            requirements = [NexusCapabilityRequirement(key: key)]
        }

        let request = NexusIntentRequest(
            projectId: projectId,
            objective: objective,
            requestedBy: "ios-app-intent",
            requirements: requirements
        )

        // NexusClient guarantees a non-blank Idempotency-Key
        let response = try await client.execute(request)

        if response.status == "approval_required" {
            return .result(dialog: "Approval required. Open Resonance to review the plan.")
        }

        if let execution = response.execution {
            let status = execution.status
            if let error = execution.error, !error.isEmpty {
                return .result(dialog: "Execution \(status): \(error)")
            }
            return .result(dialog: "Execution \(execution.id) — \(status)")
        }

        let fallback = response.status ?? "completed"
        return .result(dialog: "Result: \(fallback)")
    }
}
