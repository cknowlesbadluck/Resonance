import Foundation
import Observation
import ResonanceCore

@MainActor
@Observable
final class NexusCockpitStore {
    var capabilities: [NexusCapability] = []
    var objective: String = ""
    var selectedCapabilityKey: String?
    var plan: NexusExecutionPlan?
    var lastExecution: NexusExecution?
    var lastEvidence: [NexusEvidence] = []
    var lastIdempotencyKey: String?
    var lastStatus: String?
    var history: [NexusExecution] = []
    var historyEvidence: [NexusEvidence] = []
    var isLoadingCapabilities = false
    var isComposing = false
    var isExecuting = false
    var isLoadingHistory = false
    var bannerError: NexusUserFacingError?
    var baseURLString: String = NexusClientFactory.resolvedBaseURLString()
    var projectId: String = NexusClientFactory.resolvedProjectId()
    var bearerTokenField: String = ""
    var hasStoredToken: Bool = NexusClientFactory.resolvedBearerToken() != nil

    var approvalPending: Bool {
        lastStatus == "approval_required" || (plan?.approvalRequired == true && lastExecution == nil)
    }

    private var client = NexusClientFactory.makeClient()

    func selectCapability(_ capability: NexusCapability) {
        selectedCapabilityKey = capability.key
        if objective.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            objective = "Execute \(capability.name)"
        }
    }

    func refreshCapabilities() async {
        guard !isLoadingCapabilities else { return }
        isLoadingCapabilities = true
        defer { isLoadingCapabilities = false }
        await run {
            capabilities = try await client.capabilities()
            bannerError = nil
            if selectedCapabilityKey == nil {
                selectedCapabilityKey = capabilities.first(where: { $0.availability == .available })?.key
                    ?? capabilities.first?.key
            }
        }
    }

    func compose() async {
        guard !isComposing, let request = makeIntentRequest() else { return }
        isComposing = true
        defer { isComposing = false }
        await run {
            let response = try await client.compose(request)
            plan = response.plan
            lastExecution = nil
            lastEvidence = []
            lastStatus = response.plan.approvalRequired ? "approval_required" : "composed"
            bannerError = nil
        }
    }

    func executePlan() async {
        guard !isExecuting, let request = makeIntentRequest() else { return }
        isExecuting = true
        defer { isExecuting = false }
        await run {
            let (response, key) = try await client.execute(request)
            applyExecution(response, idempotencyKey: key)
        }
    }

    func resumeApproval(approved: Bool) async {
        let id = lastExecution?.id ?? lastIdempotencyKey
        guard !isExecuting else { return }
        guard let id else {
            bannerError = NexusUserFacingError(
                title: "Nothing to resume",
                message: "Execute first so Nexus can persist an approval_required request.",
                isRetryable: false
            )
            return
        }
        isExecuting = true
        defer { isExecuting = false }
        await run {
            let response = try await client.resume(id: id, projectId: projectId, approved: approved)
            applyExecution(response, idempotencyKey: lastIdempotencyKey)
            if !approved { lastStatus = "cancelled" }
        }
    }

    func refreshHistory() async {
        guard !isLoadingHistory else { return }
        isLoadingHistory = true
        defer { isLoadingHistory = false }
        await run {
            let response = try await client.executions()
            history = response.executions
            historyEvidence = response.evidence
            bannerError = nil
        }
    }

    func saveConnectionSettings() {
        NexusClientFactory.persistBaseURL(baseURLString)
        NexusClientFactory.persistProjectId(projectId)
        do {
            let token = bearerTokenField.trimmingCharacters(in: .whitespacesAndNewlines)
            try NexusClientFactory.persistBearerToken(token.isEmpty ? nil : token)
            hasStoredToken = NexusClientFactory.resolvedBearerToken() != nil
            bearerTokenField = ""
            client = NexusClientFactory.makeClient()
            bannerError = nil
        } catch {
            bannerError = NexusUserFacingError(
                title: "Could not save token",
                message: "Keychain refused the write. On sideloaded builds, confirm the app still has Keychain access for this bundle id.",
                isRetryable: true
            )
        }
    }

    private func run(_ work: () async throws -> Void) async {
        do {
            try await work()
        } catch is CancellationError {
            return
        } catch {
            let mapped = NexusUserFacingError.map(error)
            if mapped.isCancellation { return }
            bannerError = mapped
        }
    }

    private func makeIntentRequest() -> NexusIntentRequest? {
        let trimmed = objective.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            bannerError = NexusUserFacingError(
                title: "Objective required",
                message: "Describe the outcome you want Nexus to accomplish.",
                isRetryable: false
            )
            return nil
        }
        var requirements: [NexusCapabilityRequirement] = []
        if let key = selectedCapabilityKey, !key.isEmpty {
            requirements = [NexusCapabilityRequirement(key: key)]
        }
        return NexusIntentRequest(
            projectId: projectId,
            objective: trimmed,
            requestedBy: "ios-cockpit",
            requirements: requirements
        )
    }

    private func applyExecution(_ response: NexusExecutionResponse, idempotencyKey: String?) {
        plan = response.plan
        lastExecution = response.execution
        lastEvidence = response.evidence ?? []
        lastIdempotencyKey = idempotencyKey
        lastStatus = response.status ?? response.execution?.status
        if let execution = response.execution {
            history.removeAll { $0.id == execution.id }
            history.insert(execution, at: 0)
        }
        if response.status == "approval_required" {
            bannerError = NexusUserFacingError(
                title: "Approval required",
                message: "Review the plan, then approve to resume or cancel. Policy stays on the server.",
                isRetryable: false
            )
        } else {
            bannerError = nil
        }
    }
}
