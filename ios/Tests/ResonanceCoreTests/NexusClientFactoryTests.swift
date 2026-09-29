import XCTest
@testable import ResonanceCore

final class NexusClientFactoryTests: XCTestCase {
    func testReleaseBuildHasNoLocalhostDefault() {
        XCTAssertThrowsError(
            try NexusClientFactory.resolveBaseURL(explicit: nil, environmentValue: nil, storedValue: nil, allowLocalhostDefault: false)
        ) { error in
            XCTAssertEqual(error as? NexusClientError, .invalidBaseURL(nil))
        }
    }

    func testDebugBuildFallsBackToLocalhost() throws {
        let url = try NexusClientFactory.resolveBaseURL(explicit: nil, environmentValue: "  ", storedValue: nil, allowLocalhostDefault: true)
        XCTAssertEqual(url.absoluteString, NexusClientFactory.defaultBaseURLString)
    }

    func testAcceptsHttpsRemoteHost() throws {
        let url = try NexusClientFactory.resolveBaseURL(explicit: nil, environmentValue: "https://resonance.example.com", storedValue: nil, allowLocalhostDefault: false)
        XCTAssertEqual(url.host, "resonance.example.com")
    }

    func testRejectsPlainHttpRemoteHost() {
        XCTAssertThrowsError(
            try NexusClientFactory.resolveBaseURL(explicit: nil, environmentValue: "http://resonance.example.com", storedValue: nil, allowLocalhostDefault: true)
        ) { error in
            XCTAssertEqual(error as? NexusClientError, .invalidBaseURL("http://resonance.example.com"))
        }
    }

    func testInvalidConfiguredValueDoesNotFallThrough() {
        XCTAssertThrowsError(
            try NexusClientFactory.resolveBaseURL(explicit: nil, environmentValue: "http://evil.example", storedValue: "https://ok.example", allowLocalhostDefault: true)
        )
    }

    func testAllowsHttpForLoopbackHosts() throws {
        for raw in ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"] {
            let url = try XCTUnwrap(URL(string: raw))
            XCTAssertNoThrow(try NexusClientFactory.validateBaseURL(url), raw)
        }
    }

    func testRejectsUrlWithoutSchemeOrHost() throws {
        let url = try XCTUnwrap(URL(string: "localhost:3000"))
        XCTAssertThrowsError(try NexusClientFactory.validateBaseURL(url))
    }

    func testExplicitUrlIsValidatedToo() throws {
        let url = try XCTUnwrap(URL(string: "http://example.com"))
        XCTAssertThrowsError(try NexusClientFactory.resolveBaseURL(explicit: url, environmentValue: nil, storedValue: nil, allowLocalhostDefault: true))
    }

    func testUnavailableTransportSurfacesConfigurationError() async throws {
        let client = NexusClient(transport: UnavailableNexusTransport(error: .invalidBaseURL(nil)))
        do {
            _ = try await client.capabilities()
            XCTFail("expected configuration error")
        } catch let error as NexusClientError {
            XCTAssertEqual(error, .invalidBaseURL(nil))
        }
    }
}
