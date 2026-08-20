import XCTest
@testable import ResonanceCore

final class NexusClientTests: XCTestCase {
    func testDecodesCapabilitiesFromNexusPayload() async throws {
        let payload = #"{"capabilities":[{"id":"cap-1","key":"demo.read","name":"Demo Read","risk":"low","availability":"available"}]}"#.data(using: .utf8)!
        let client = NexusClient(transport: StubTransport(getData: payload))
        let capabilities = try await client.capabilities()
        XCTAssertEqual(capabilities.count, 1)
        XCTAssertEqual(capabilities[0].key, "demo.read")
        XCTAssertEqual(capabilities[0].availability, "available")
    }

    func testComposesIntentThroughPostEndpoint() async throws {
        let payload = #"{"intent":{"id":"intent-1","projectId":"demo","objective":"Read status","requestedBy":"user-1","requirements":[{"key":"demo.read"}],"contextRefs":[]},"plan":{"id":"plan-1","intentId":"intent-1","projectId":"demo","actorId":"user-1","mode":"direct","steps":[{"id":"step-1","capabilityId":"cap-1","adapterId":"adapter-1","input":{},"requiresApproval":false}],"contextRefs":[],"approvalRequired":false,"rationale":["matched"]}}"#.data(using: .utf8)!
        let client = NexusClient(transport: StubTransport(postData: payload))
        let response = try await client.compose(NexusIntentRequest(
            objective: "Read status",
            requestedBy: "user-1",
            requirements: [NexusCapabilityRequirement(key: "demo.read")]
        ))

        XCTAssertEqual(response.intent.objective, "Read status")
        XCTAssertEqual(response.plan.mode, "direct")
        XCTAssertEqual(response.plan.steps.first?.capabilityId, "cap-1")
    }

    func testDecodesExecutionEnvelopeInsteadOfAssumingAnArray() async throws {
        let payload = #"{"executions":[{"id":"exec-1","planId":"plan-1","status":"completed","startedAt":"2026-08-16T00:00:00Z","completedAt":"2026-08-16T00:00:01Z","output":{"ok":true}}],"evidence":[]}"#.data(using: .utf8)!
        let client = NexusClient(transport: StubTransport(getData: payload))
        let response = try await client.executions()

        XCTAssertEqual(response.executions.count, 1)
        XCTAssertEqual(response.executions[0].status, "completed")
    }

    func testExecuteAlwaysSendsIdempotencyKeyHeader() async throws {
        let payload = #"{"intent":{"id":"intent-1","projectId":"demo","objective":"Run","requestedBy":"user-1","requirements":[{"key":"demo.read"}],"contextRefs":[]},"plan":{"id":"plan-1","intentId":"intent-1","projectId":"demo","actorId":"user-1","mode":"direct","steps":[],"contextRefs":[],"approvalRequired":false,"rationale":[]},"execution":{"id":"exec-1","planId":"plan-1","status":"completed"}}"#.data(using: .utf8)!
        let transport = CapturingTransport(postData: payload)
        let client = NexusClient(transport: transport)

        _ = try await client.execute(
            NexusIntentRequest(
                objective: "Run",
                requestedBy: "user-1",
                requirements: [NexusCapabilityRequirement(key: "demo.read")]
            ),
            idempotencyKey: "test-key-123"
        )

        XCTAssertEqual(transport.lastPostHeaders?.idempotencyKey, "test-key-123")
        XCTAssertEqual(transport.lastPostPath, "/api/nexus/executions")
    }

    func testExecuteGeneratesIdempotencyKeyWhenOmitted() async throws {
        let payload = #"{"intent":{"id":"intent-1","projectId":"demo","objective":"Run","requestedBy":"user-1","requirements":[{"key":"demo.read"}],"contextRefs":[]},"plan":{"id":"plan-1","intentId":"intent-1","projectId":"demo","actorId":"user-1","mode":"direct","steps":[],"contextRefs":[],"approvalRequired":false,"rationale":[]},"execution":{"id":"exec-1","planId":"plan-1","status":"completed"}}"#.data(using: .utf8)!
        let transport = CapturingTransport(postData: payload)
        let client = NexusClient(transport: transport)

        _ = try await client.execute(
            NexusIntentRequest(
                objective: "Run",
                requestedBy: "user-1",
                requirements: [NexusCapabilityRequirement(key: "demo.read")]
            )
        )

        let key = transport.lastPostHeaders?.idempotencyKey
        XCTAssertNotNil(key)
        XCTAssertFalse(key?.isEmpty ?? true)
    }
}

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
    let getData: Data
    let postData: Data
    private(set) var lastPostPath: String?
    private(set) var lastPostHeaders: NexusRequestHeaders?

    init(getData: Data = Data(), postData: Data = Data()) {
        self.getData = getData
        self.postData = postData
    }

    func get(_ path: String, headers: NexusRequestHeaders) async throws -> Data { getData }

    func post(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> Data {
        lastPostPath = path
        lastPostHeaders = headers
        return postData
    }
}
