import AppIntents
import ResonanceCore

struct ExecuteNexusPlanIntent: AppIntent {
    static var title: LocalizedStringResource = "Execute Nexus Plan"
    static var description = IntentDescription("Execute an objective through the Resonance Nexus")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Objective")
    var objective: String

    @Parameter(title: "Project ID", default: "demo")
    var projectId: String

    @Parameter(title: "Capability")
    var capability: NexusCapability?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        do {
            let client = NexusClientFactory.makeClient(projectId: projectId)
            var requirements: [NexusCapabilityRequirement] = []
            if let key = capability?.key, !key.isEmpty {
                requirements = [NexusCapabilityRequirement(key: key)]
            }
            let request = NexusIntentRequest(
                projectId: projectId,
                objective: objective,
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
        switch error {
        case .httpStatus(401, _): return "Authentication required. Open Resonance and sign in."
        case .httpStatus(429, _): return "Rate limited. Try again in a minute."
        case .httpStatus(let code, let message):
            return IntentDialog(stringLiteral: "HTTP \(code): \(message ?? "error")")
        default: return IntentDialog(stringLiteral: String(describing: error))
        }
    }
}
