import Foundation
import ResonanceCore

/// Actor-isolated store for the P4 compose→execute→evidence vertical.
/// @MainActor: all published state drives SwiftUI directly.
@MainActor
@Observable
final class NexusCockpitStore {

    // MARK: - Compose state
    var objective: String = ""
    var selectedCapabilityKey: String = ""

    // MARK: - Capabilities
    var capabilities: [NexusCapability] = []
    var capabilitiesError: String?

    // MARK: - Execution state
    enum ExecutionState: Equatable {
        case idle
        case composing
        case executing
        case awaitingApproval(executionId: String, idempotencyKey: String)
        case completed(NexusExecutionResponse)
        case failed(String)
    }
    var executionState: ExecutionState = .idle

    // MARK: - Evidence
    var evidence: [NexusEvidence] = []

    // MARK: - Loading
    var isLoadingCapabilities = false

    // MARK: - Private
    private let client: NexusClient

    init(client: NexusClient) {
        self.client = client
    }

    // MARK: - Actions

    func loadCapabilities() async {
        isLoadingCapabilities = true
        capabilitiesError = nil
        defer { isLoadingCapabilities = false }
        do {
            capabilities = try await client.capabilities()
        } catch {
            capabilitiesError = Self.userFacingMessage(error)
        }
    }

    /// Compose then execute in a single user action.
    /// Always generates a fresh Idempotency-Key per CHR-45 contract.
    func composeAndExecute() async {
        guard !objective.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            executionState = .failed("Objective cannot be empty.")
            return
        }
        let idempotencyKey = UUID().uuidString
        let requirements: [NexusCapabilityRequirement] = selectedCapabilityKey.isEmpty
            ? []
            : [NexusCapabilityRequirement(key: selectedCapabilityKey)]

        executionState = .composing
        let request = NexusIntentRequest(
            objective: objective,
            requestedBy: "ios-user",
            requirements: requirements
        )

        do {
            executionState = .executing
            let response = try await client.execute(request, idempotencyKey: idempotencyKey)
            evidence = response.evidence ?? []

            if response.status == "approval_required",
               let execId = response.execution?.id {
                executionState = .awaitingApproval(
                    executionId: execId,
                    idempotencyKey: idempotencyKey
                )
            } else {
                executionState = .completed(response)
            }
        } catch {
            executionState = .failed(Self.userFacingMessage(error))
        }
    }

    func resetExecution() {
        executionState = .idle
        evidence = []
        objective = ""
        selectedCapabilityKey = ""
    }

    // MARK: - Helpers

    private static func userFacingMessage(_ error: Error) -> String {
        if let nexus = error as? NexusClientError {
            switch nexus {
            case .httpStatus(let code, let message):
                return "Server error \(code): \(message ?? \"no details\")"
            case .decodingFailed:
                return "Unexpected response format from Nexus."
            case .missingIdempotencyKey:
                return "Internal error: missing idempotency key."
            }
        }
        return error.localizedDescription
    }
}
