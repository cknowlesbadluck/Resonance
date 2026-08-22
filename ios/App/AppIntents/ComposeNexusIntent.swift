import AppIntents
import ResonanceCore

struct ComposeNexusIntent: AppIntent {
    static var title: LocalizedStringResource = "Compose Intent"
    static var description = IntentDescription("Compose an objective into a Nexus execution plan")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Objective")
    var objective: String

    @Parameter(title: "Project ID", default: "demo")
    var projectId: String

    @Parameter(title: "Capability")
    var capability: NexusCapabilityEntity?

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
            let response = try await client.compose(request)
            let plan = response.plan
            let summary = """
            Plan \(plan.id.prefix(8))…
            Mode: \(plan.mode)
            Steps: \(plan.steps.count)
            Approval required: \(plan.approvalRequired ? "yes" : "no")
            """.trimmingCharacters(in: .whitespacesAndNewlines)
            return .result(dialog: IntentDialog(stringLiteral: summary))
        } catch {
            let mapped = NexusUserFacingError.map(error)
            return .result(dialog: IntentDialog(stringLiteral: "\(mapped.title). \(mapped.message)"))
        }
    }
}
