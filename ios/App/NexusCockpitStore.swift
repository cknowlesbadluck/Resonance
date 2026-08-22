import Foundation
import Observation
import ResonanceCore

/// UI-owned cockpit state. Nexus remains the source of truth for capabilities, plans, and executions.
@MainActor
@Observable
final class NexusCockpitStore {
    var capabilities: [NexusCapability] = []
    var objective: String = ""
    var selectedCapabilityKey: String?
    var plan: NexusExecutionPlan?
    var lastExecution: NexusExecution?
    var lastEvidence: [NexusEvidence] = []
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

    private var client: NexusClient {
        NexusClientFactory.makeClient()
    }

    func refreshCapabilities() async {
        isLoadingCapabilities = true
        defer { isLoadingCapabilities = false }
        do {
            capabilities = try await client.capabilities()
            bannerError = nil
            if selectedCapabilityKey == nil {
                selectedCapabilityKey = capabilities.first(where: { $0.availability == .available })?.key
                    ?? capabilities.first?.key
            }
        } catch {
            bannerError = NexusUserFacingError.map(error)
        }
    }

    func compose() async {
        let trimmed = objective.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            bannerError = NexusUserFacingError(
                title: "Objective required",
                message: "Describe the outcome you want Nexus to accomplish.",
                isRetryable: false
            )
            return
        }

        isComposing = true
        defer { isComposing = false }
        do {
            var requirements: [NexusCapabilityRequirement] = []
            if let key = selectedCapabilityKey, !key.isEmpty {
                requirements = [NexusCapabilityRequirement(key: key)]
            }
            let request = NexusIntentRequest(
                projectId: projectId,
                objective: trimmed,
                requestedBy: "ios-cockpit",
                requirements: requirements
            )
            let response = try await client.compose(request)
            plan = response.plan
            lastExecution = nil
            lastEvidence = []
            bannerError = nil
        } catch {
            bannerError = NexusUserFacingError.map(error)
        }
    }

    func executePlan() async {
        let trimmed = objective.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        isExecuting = true
        defer { isExecuting = false }
        do {
            var requirements: [NexusCapabilityRequirement] = []
            if let key = selectedCapabilityKey, !key.isEmpty {
                requirements = [NexusCapabilityRequirement(key: key)]
            }
            let request = NexusIntentRequest(
                projectId: projectId,
                objective: trimmed,
                requestedBy: "ios-cockpit",
                requirements: requirements
            )
            let response = try await client.execute(request)
            plan = response.plan
            lastExecution = response.execution
            lastEvidence = response.evidence ?? []
            if let execution = response.execution {
                history.insert(execution, at: 0)
            }
            if response.status == "approval_required" {
                bannerError = NexusUserFacingError(
                    title: "Approval required",
                    message: "Nexus composed a plan that needs explicit approval before execution continues.",
                    isRetryable: false
                )
            } else {
                bannerError = nil
            }
        } catch {
            bannerError = NexusUserFacingError.map(error)
        }
    }

    func refreshHistory() async {
        isLoadingHistory = true
        defer { isLoadingHistory = false }
        do {
            let response = try await client.executions()
            history = response.executions
            historyEvidence = response.evidence
            bannerError = nil
        } catch {
            bannerError = NexusUserFacingError.map(error)
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
            bannerError = nil
        } catch {
            bannerError = NexusUserFacingError(
                title: "Could not save token",
                message: "Keychain refused the write. On sideloaded builds, confirm the app still has Keychain access for this bundle id.",
                isRetryable: true
            )
        }
    }
}
