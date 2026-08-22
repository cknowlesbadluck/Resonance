import Testing
import Foundation
@testable import ResonanceCore

struct NexusAuditTests {
    @Test func urlBuilderEncodesPathRelativeToBase() throws {
        let url = try NexusURLBuilder.url(
            base: URL(string: "https://nexus.example/app")!,
            path: "/api/nexus/capabilities?projectId=demo%20x"
        )
        #expect(url.absoluteString.contains("/api/nexus/capabilities"))
        #expect(url.absoluteString.contains("projectId=demo%20x"))
    }

    @Test func mapsUnprocessableEntity() {
        let mapped = NexusUserFacingError.map(NexusClientError.httpStatus(422, message: "policy"))
        #expect(mapped.statusCode == 422)
        #expect(mapped.isRetryable == false)
        #expect(mapped.message == "policy")
    }

    @Test func mapsCancellationWithoutAlertCopyBeingRetryPolicyOnly() {
        let mapped = NexusUserFacingError.map(URLError(.cancelled))
        #expect(mapped.isCancellation)
    }

    @Test func prettyPrintsObjectsWithoutForceUnwrap() {
        let value: JSONValue = .object(["ok": .bool(true), "n": .number(1)])
        let printed = value.prettyPrinted()
        #expect(printed.contains("ok: true"))
        #expect(printed.contains("n: 1.0") || printed.contains("n: 1"))
    }

    @Test func resumeEncodesPathAndDecodes() async throws {
        let payload = #"{"intent":{"id":"intent-1","projectId":"demo","objective":"Run","requestedBy":"user-1","requirements":[{"key":"demo.read"}],"contextRefs":[]},"plan":{"id":"plan-1","intentId":"intent-1","projectId":"demo","actorId":"user-1","mode":"direct","steps":[],"contextRefs":[],"approvalRequired":false,"rationale":[]},"execution":{"id":"exec-1","planId":"plan-1","status":"completed"}}"#.data(using: .utf8)!
        let transport = CapturingTransport(postData: payload)
        let client = NexusClient(transport: transport)
        _ = try await client.resume(id: "key with space", projectId: "demo", approved: true)
        let path = await transport.lastPostPath
        #expect(path?.contains("/api/nexus/executions/") == true)
        #expect(path?.contains("/resume") == true)
        #expect(path?.contains(" ") == false)
    }

    @Test func getRetriesOnceOnServerError() async throws {
        let payload = #"{"capabilities":[]}"#.data(using: .utf8)!
        let transport = FlakyGetTransport(failTimes: 1, success: payload)
        let client = NexusClient(transport: transport)
        let caps = try await client.capabilities()
        #expect(caps.isEmpty)
        let gets = await transport.getCount
        #expect(gets == 2)
    }
}

actor CapturingTransport: NexusTransport {
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

actor FlakyGetTransport: NexusTransport {
    private var remainingFailures: Int
    private let success: Data
    private(set) var getCount = 0

    init(failTimes: Int, success: Data) {
        self.remainingFailures = failTimes
        self.success = success
    }

    func get(_ path: String, headers: NexusRequestHeaders) async throws -> Data {
        getCount += 1
        if remainingFailures > 0 {
            remainingFailures -= 1
            throw NexusClientError.httpStatus(503, message: "unavailable")
        }
        return success
    }

    func post(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> Data {
        Data()
    }
}
