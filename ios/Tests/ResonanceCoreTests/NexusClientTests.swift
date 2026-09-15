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
        let payload = #"{"intent":{"id":"intent-1","projectId":"00000000-0000-4000-8000-000000000001","objective":"Read status","requestedBy":"user-1","requirements":[{"key":"demo.read"}],"contextRefs":[]},"plan":{"id":"plan-1","intentId":"intent-1","projectId":"00000000-0000-4000-8000-000000000001","actorId":"user-1","mode":"direct","steps":[{"id":"step-1","capabilityId":"cap-1","adapterId":"adapter-1","input":{},"requiresApproval":false}],"contextRefs":[],"approvalRequired":false,"rationale":["matched"]}}"#.data(using: .utf8)!
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
        let payload = #"{"intent":{"id":"intent-1","projectId":"00000000-0000-4000-8000-000000000001","objective":"Run","requestedBy":"user-1","requirements":[{"key":"demo.read"}],"contextRefs":[]},"plan":{"id":"plan-1","intentId":"intent-1","projectId":"00000000-0000-4000-8000-000000000001","actorId":"user-1","mode":"direct","steps":[],"contextRefs":[],"approvalRequired":false,"rationale":[]},"execution":{"id":"exec-1","planId":"plan-1","status":"completed"}}"#.data(using: .utf8)!
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
        let payload = #"{"intent":{"id":"intent-1","projectId":"00000000-0000-4000-8000-000000000001","objective":"Run","requestedBy":"user-1","requirements":[{"key":"demo.read"}],"contextRefs":[]},"plan":{"id":"plan-1","intentId":"intent-1","projectId":"00000000-0000-4000-8000-000000000001","actorId":"user-1","mode":"direct","steps":[],"contextRefs":[],"approvalRequired":false,"rationale":[]},"execution":{"id":"exec-1","planId":"plan-1","status":"completed"}}"#.data(using: .utf8)!
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

    // MARK: - Explicit status mapping (mandate: 400 / 401 / 409 / 422)

    func testMapsContractFailureStatusesExplicitly() async throws {
        let cases: [(Int, NexusClientError)] = [
            (400, .badRequest(message: "objective is required")),
            (401, .unauthorized(message: "objective is required")),
            (409, .idempotencyConflict(message: "objective is required")),
            (422, .unprocessable(message: "objective is required")),
            (429, .rateLimited(retryAfter: nil, message: "objective is required")),
            (503, .httpStatus(503, message: "objective is required"))
        ]
        let body = #"{"error":"objective is required"}"#.data(using: .utf8)!

        for (status, expected) in cases {
            let client = NexusClient(transport: StubTransport(getData: body, status: status))
            do {
                _ = try await client.capabilities()
                XCTFail("expected \(status) to throw")
            } catch let error as NexusClientError {
                XCTAssertEqual(error, expected, "status \(status)")
            }
        }
    }

    /// A failed execution comes back as 422 carrying the full envelope. The client must
    /// return it so the caller can read the evidence, not throw the body away.
    func testPreservesFailedExecutionEnvelopeOn422() async throws {
        let payload = #"{"intent":{"id":"intent-1","projectId":"00000000-0000-4000-8000-000000000001","objective":"Run","requestedBy":"user-1","requirements":[{"key":"demo.write"}],"contextRefs":[]},"plan":{"id":"plan-1","intentId":"intent-1","projectId":"00000000-0000-4000-8000-000000000001","actorId":"user-1","mode":"direct","steps":[],"contextRefs":[],"approvalRequired":false,"rationale":[]},"execution":{"id":"exec-1","planId":"plan-1","status":"failed","error":"adapter exploded"},"evidence":[{"id":"ev-1","executionId":"exec-1","type":"audit","summary":"Capability demo.write failed.","payload":"adapter exploded","createdAt":"2026-09-14T00:00:00Z"}]}"#.data(using: .utf8)!

        let client = NexusClient(transport: StubTransport(postData: payload, status: 422))
        let response = try await client.execute(NexusIntentRequest(
            objective: "Run",
            requestedBy: "user-1",
            requirements: [NexusCapabilityRequirement(key: "demo.write")]
        ))

        XCTAssertEqual(response.execution?.status, "failed")
        XCTAssertEqual(response.execution?.error, "adapter exploded")
        XCTAssertEqual(response.evidence?.count, 1)
        XCTAssertEqual(response.evidence?.first?.type, .audit)
    }

    func testRejectsNonUuidProjectIdBeforeHittingTheNetwork() async throws {
        let transport = CapturingTransport()
        let client = NexusClient(transport: transport)
        do {
            _ = try await client.execute(NexusIntentRequest(
                projectId: "demo",
                objective: "Run",
                requestedBy: "user-1",
                requirements: [NexusCapabilityRequirement(key: "demo.read")]
            ))
            XCTFail("expected an invalid projectId to be rejected")
        } catch let error as NexusClientError {
            XCTAssertEqual(error, .invalidProjectId("demo"))
        }
        XCTAssertNil(transport.lastPostPath, "no request should have been sent")
    }

    func testProjectIdValidation() {
        XCTAssertTrue(NexusProjectID.isValid("00000000-0000-4000-8000-000000000001"))
        XCTAssertFalse(NexusProjectID.isValid("demo"))
        XCTAssertFalse(NexusProjectID.isValid(""))
    }

    func testRetryabilityReflectsTheContract() {
        XCTAssertTrue(NexusClientError.rateLimited(retryAfter: 60, message: nil).isRetryable)
        XCTAssertTrue(NexusClientError.httpStatus(503, message: nil).isRetryable)
        XCTAssertFalse(NexusClientError.idempotencyConflict(message: nil).isRetryable)
        XCTAssertFalse(NexusClientError.badRequest(message: nil).isRetryable)
    }
}


private struct StubTransport: NexusTransport {
    let getData: Data
    let postData: Data
    let status: Int

    init(getData: Data = Data(), postData: Data = Data(), status: Int = 200) {
        self.getData = getData
        self.postData = postData
        self.status = status
    }

    func get(_ path: String, headers: NexusRequestHeaders) async throws -> Data { getData }
    func post(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> Data { postData }

    func getResponse(_ path: String, headers: NexusRequestHeaders) async throws -> NexusHTTPResponse {
        NexusHTTPResponse(status: status, data: getData)
    }

    func postResponse(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> NexusHTTPResponse {
        NexusHTTPResponse(status: status, data: postData)
    }
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
