import XCTest
@testable import ResonanceCore

final class NexusClientTests: XCTestCase {
    func testDecodesCapabilitiesFromNexusPayload() async throws {
        let payload = #"{"capabilities":[{"id":"cap-1","key":"demo.read","name":"Demo Read","risk":"low","availability":"available"}]}"#.data(using: .utf8)!
        let client = NexusClient(transport: StubTransport(getData: payload))
        let capabilities = try await client.capabilities()
        XCTAssertEqual(capabilities.count, 1)
        XCTAssertEqual(capabilities[0].key, "demo.read")
        XCTAssertEqual(capabilities[0].availability, .available)
        XCTAssertEqual(capabilities[0].risk, .low)
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
        XCTAssertEqual(response.executions[0].output, .object(["ok": .bool(true)]))
    }

    func testExecuteAlwaysSendsIdempotencyKeyHeader() async throws {
        let payload = #"{"intent":{"id":"intent-1","projectId":"demo","objective":"Run","requestedBy":"user-1","requirements":[{"key":"demo.read"}],"contextRefs":[]},"plan":{"id":"plan-1","intentId":"intent-1","projectId":"demo","actorId":"user-1","mode":"direct","steps":[],"contextRefs":[],"approvalRequired":false,"rationale":[]},"execution":{"id":"exec-1","planId":"plan-1","status":"completed"}}"#.data(using: .utf8)!
        let transport = CapturingTransport(postData: payload)
        let client = NexusClient(transport: transport)

        let result = try await client.execute(
            NexusIntentRequest(
                objective: "Run",
                requestedBy: "user-1",
                requirements: [NexusCapabilityRequirement(key: "demo.read")]
            ),
            idempotencyKey: "test-key-123"
        )

        let headers = await transport.lastPostHeaders
        let path = await transport.lastPostPath
        XCTAssertEqual(result.idempotencyKey, "test-key-123")
        XCTAssertEqual(headers?.idempotencyKey, "test-key-123")
        XCTAssertEqual(path, "/api/nexus/executions")
    }

    func testExecuteGeneratesIdempotencyKeyWhenOmitted() async throws {
        let payload = #"{"intent":{"id":"intent-1","projectId":"demo","objective":"Run","requestedBy":"user-1","requirements":[{"key":"demo.read"}],"contextRefs":[]},"plan":{"id":"plan-1","intentId":"intent-1","projectId":"demo","actorId":"user-1","mode":"direct","steps":[],"contextRefs":[],"approvalRequired":false,"rationale":[]},"execution":{"id":"exec-1","planId":"plan-1","status":"completed"}}"#.data(using: .utf8)!
        let transport = CapturingTransport(postData: payload)
        let client = NexusClient(transport: transport)

        let result = try await client.execute(
            NexusIntentRequest(
                objective: "Run",
                requestedBy: "user-1",
                requirements: [NexusCapabilityRequirement(key: "demo.read")]
            )
        )

        let headers = await transport.lastPostHeaders
        XCTAssertFalse(result.idempotencyKey.isEmpty)
        XCTAssertEqual(headers?.idempotencyKey, result.idempotencyKey)
    }

    func testResumePostsToExecutionResumePath() async throws {
        let payload = #"{"intent":{"id":"intent-1","projectId":"demo","objective":"Run","requestedBy":"user-1","requirements":[{"key":"demo.read"}],"contextRefs":[]},"plan":{"id":"plan-1","intentId":"intent-1","projectId":"demo","actorId":"user-1","mode":"direct","steps":[],"contextRefs":[],"approvalRequired":false,"rationale":[]},"execution":{"id":"exec-1","planId":"plan-1","status":"completed"}}"#.data(using: .utf8)!
        let transport = CapturingTransport(postData: payload)
        let client = NexusClient(transport: transport)
        let response = try await client.resume(id: "test-key-123", projectId: "demo", approved: true)
        let path = await transport.lastPostPath
        XCTAssertEqual(path, "/api/nexus/executions/test-key-123/resume")
        XCTAssertEqual(response.execution?.status, "completed")
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
