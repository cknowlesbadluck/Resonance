import XCTest
@testable import ResonanceCore

final class NexusUserFacingErrorTests: XCTestCase {
    func testMapsUnauthorized() {
        let mapped = NexusUserFacingError.map(NexusClientError.httpStatus(401, message: nil))
        XCTAssertEqual(mapped.title, "Sign in required")
        XCTAssertEqual(mapped.statusCode, 401)
        XCTAssertFalse(mapped.isRetryable)
    }

    func testMapsRateLimitAsRetryable() {
        let mapped = NexusUserFacingError.map(NexusClientError.httpStatus(429, message: nil))
        XCTAssertTrue(mapped.isRetryable)
        XCTAssertEqual(mapped.statusCode, 429)
    }

    func testMapsHostFailureForSideStoreGuidance() {
        let mapped = NexusUserFacingError.map(URLError(.cannotConnectToHost))
        XCTAssertEqual(mapped.title, "Cannot reach Nexus")
        XCTAssertTrue(mapped.message.contains("SideStore"))
        XCTAssertTrue(mapped.isRetryable)
    }
}
