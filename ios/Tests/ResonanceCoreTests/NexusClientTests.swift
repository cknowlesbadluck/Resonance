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

    func testCapabilityArraysAreOptionalInAPIPayloads() throws {
        let payload = #"{"id":"cap-1","name":"GitHub","description":"Source control","kind":"tool","provider":"GitHub","version":"1.0.0","status":"available"}"#.data(using: .utf8)!
        let capability = try JSONDecoder().decode(Capability.self, from: payload)

        XCTAssertEqual(capability.id, "cap-1")
        XCTAssertTrue(capability.permissions.isEmpty)
        XCTAssertTrue(capability.dependencies.isEmpty)
        XCTAssertTrue(capability.tags.isEmpty)
    }
}

private struct StubTransport: NexusTransport {
    let getData: Data
    let postData: Data

    init(getData: Data = Data(), postData: Data = Data()) {
        self.getData = getData
        self.postData = postData
    }

    func get(_ path: String) async throws -> Data { getData }
    func post(_ path: String, body: Data) async throws -> Data { postData }
}
