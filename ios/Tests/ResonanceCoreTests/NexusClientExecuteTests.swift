import Testing
@testable import ResonanceCore

/// Tests for the compose→execute→evidence path through NexusClient.
/// NexusCockpitStore lives in ios/App/ (outside the Swift package) and is
/// not testable via `swift test` — these tests cover the same contracts
/// through the public NexusClient API.
struct NexusClientExecuteTests {

    // MARK: - Helpers

    private static func executePayload(status: String = "completed") -> Data {
        let json = """
        {
            "intent": {"id":"i1","projectId":"demo","objective":"Test","requestedBy":"ios-user","requirements":[],"contextRefs":[]},
            "plan": {"id":"p1","intentId":"i1","projectId":"demo","actorId":"ios-user","mode":"direct","steps":[],"contextRefs":[],"approvalRequired":false,"rationale":[]},
            "execution": {"id":"e1","planId":"p1","status":"\(status)"},
            "evidence": [{"id":"ev1","executionId":"e1","type":"event","summary":"Done","createdAt":"2026-08-30T00:00:00Z"}],
            "status": "\(status)"
        }
        """
        return json.data(using: .utf8)!
    }

    // MARK: - Tests

    @Test func executeReturnsCompletedResponse() async throws {
        let transport = StubTransport(postData: Self.executePayload())
        let client = NexusClient(transport: transport)
        let response = try await client.execute(
            NexusIntentRequest(objective: "Test", requestedBy: "ios-user", requirements: []),
            idempotencyKey: "test-key"
        )
        #expect(response.status == "completed")
        #expect(response.execution?.id == "e1")
    }

    @Test func executePopulatesEvidence() async throws {
        let transport = StubTransport(postData: Self.executePayload())
        let client = NexusClient(transport: transport)
        let response = try await client.execute(
            NexusIntentRequest(objective: "Test", requestedBy: "ios-user", requirements: []),
            idempotencyKey: "ev-key"
        )
        #expect(response.evidence?.count == 1)
        #expect(response.evidence?.first?.type == .event)
        #expect(response.evidence?.first?.summary == "Done")
    }

    @Test func executeApprovalRequiredStatusPassesThrough() async throws {
        let transport = StubTransport(postData: Self.executePayload(status: "approval_required"))
        let client = NexusClient(transport: transport)
        let response = try await client.execute(
            NexusIntentRequest(objective: "Needs approval", requestedBy: "ios-user", requirements: []),
            idempotencyKey: "approval-key"
        )
        #expect(response.status == "approval_required")
    }

    @Test func executeSendsSuppliedIdempotencyKey() async throws {
        let transport = CapturingTransport(postData: Self.executePayload())
        let client = NexusClient(transport: transport)
        _ = try await client.execute(
            NexusIntentRequest(objective: "Key test", requestedBy: "ios-user", requirements: []),
            idempotencyKey: "explicit-key-abc"
        )
        #expect(transport.lastPostHeaders?.idempotencyKey == "explicit-key-abc")
    }

    @Test func executeGeneratesFreshKeyWhenOmitted() async throws {
        let transport = CapturingTransport(postData: Self.executePayload())
        let client = NexusClient(transport: transport)
        _ = try await client.execute(
            NexusIntentRequest(objective: "Auto key", requestedBy: "ios-user", requirements: [])
        )
        let key = transport.lastPostHeaders?.idempotencyKey
        #expect(key != nil)
        #expect(!(key?.isEmpty ?? true))
    }
}

// MARK: - Transports

private struct StubTransport: NexusTransport {
    let getData: Data
    let postData: Data
    init(getData: Data = Data(), postData: Data = Data()) {
        self.getData = getData
        self.postData = postData
    }
    func get(_ path: String, headers: NexusRequestHeaders) async throws -> Data { getData }
    func post(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> Data { postData }
}

private final class CapturingTransport: NexusTransport, @unchecked Sendable {
    let postData: Data
    private(set) var lastPostHeaders: NexusRequestHeaders?
    init(postData: Data = Data()) { self.postData = postData }
    func get(_ path: String, headers: NexusRequestHeaders) async throws -> Data { Data() }
    func post(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> Data {
        lastPostHeaders = headers
        return postData
    }
}
