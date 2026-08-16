import XCTest
@testable import ResonanceCore

final class NexusClientTests: XCTestCase {
    func testDecodesCapabilitiesFromNexusPayload() async throws {
        let payload = #"{"capabilities":[{"id":"cap-1","key":"demo.read","name":"Demo Read","risk":"low"}]}"#.data(using: .utf8)!
        let client = NexusClient(transport: StubTransport(data: payload))
        let capabilities = try await client.capabilities()
        XCTAssertEqual(capabilities.count, 1)
        XCTAssertEqual(capabilities[0].key, "demo.read")
    }
}

private struct StubTransport: NexusTransport {
    let data: Data
    func get(_ path: String) async throws -> Data { data }
}
