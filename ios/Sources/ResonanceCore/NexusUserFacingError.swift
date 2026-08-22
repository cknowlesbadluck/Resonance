import Foundation

/// Presentation-safe error copy. Server remains authoritative; this only maps transport/client failures.
public struct NexusUserFacingError: Error, Sendable, Equatable {
    public let title: String
    public let message: String
    public let isRetryable: Bool
    public let statusCode: Int?

    public init(title: String, message: String, isRetryable: Bool, statusCode: Int? = nil) {
        self.title = title
        self.message = message
        self.isRetryable = isRetryable
        self.statusCode = statusCode
    }

    public static func map(_ error: Error) -> NexusUserFacingError {
        if let client = error as? NexusClientError {
            return map(client)
        }
        if let url = error as? URLError {
            return map(url)
        }
        return NexusUserFacingError(
            title: "Something went wrong",
            message: error.localizedDescription,
            isRetryable: true
        )
    }

    public static func map(_ error: NexusClientError) -> NexusUserFacingError {
        switch error {
        case .httpStatus(401, _):
            return NexusUserFacingError(
                title: "Sign in required",
                message: "Nexus rejected this request. Save a bearer token in Settings (Keychain) and try again.",
                isRetryable: false,
                statusCode: 401
            )
        case .httpStatus(403, _):
            return NexusUserFacingError(
                title: "Not allowed",
                message: "Policy denied this action. Check project membership and capability permissions.",
                isRetryable: false,
                statusCode: 403
            )
        case .httpStatus(404, let message):
            return NexusUserFacingError(
                title: "Not found",
                message: message?.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty
                    ?? "The Nexus endpoint or resource was not found. Verify the base URL.",
                isRetryable: false,
                statusCode: 404
            )
        case .httpStatus(409, let message):
            return NexusUserFacingError(
                title: "Conflict",
                message: message?.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty
                    ?? "This request conflicted with an existing execution (idempotency or state).",
                isRetryable: false,
                statusCode: 409
            )
        case .httpStatus(429, _):
            return NexusUserFacingError(
                title: "Rate limited",
                message: "Too many executions for this project. Wait a moment and retry.",
                isRetryable: true,
                statusCode: 429
            )
        case .httpStatus(let code, let message) where (500...599).contains(code):
            return NexusUserFacingError(
                title: "Nexus unavailable",
                message: message?.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty
                    ?? "The server failed while handling this request. Your last successful state was preserved on the device.",
                isRetryable: true,
                statusCode: code
            )
        case .httpStatus(let code, let message):
            return NexusUserFacingError(
                title: "Request failed",
                message: message?.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty
                    ?? "HTTP \(code)",
                isRetryable: code >= 500,
                statusCode: code
            )
        case .decodingFailed:
            return NexusUserFacingError(
                title: "Unexpected response",
                message: "Nexus returned data this client could not read. Update the app or check server/client contract parity.",
                isRetryable: false
            )
        case .missingIdempotencyKey:
            return NexusUserFacingError(
                title: "Missing idempotency key",
                message: "Executions require an Idempotency-Key. Retry; the client will generate one.",
                isRetryable: true
            )
        }
    }

    public static func map(_ error: URLError) -> NexusUserFacingError {
        switch error.code {
        case .notConnectedToInternet, .networkConnectionLost:
            return NexusUserFacingError(
                title: "Offline",
                message: "No network path to Nexus. Sideloaded builds still need reachability to your Nexus base URL.",
                isRetryable: true
            )
        case .timedOut:
            return NexusUserFacingError(
                title: "Timed out",
                message: "Nexus did not respond in time. Check the base URL and try again.",
                isRetryable: true
            )
        case .cannotFindHost, .cannotConnectToHost, .dnsLookupFailed:
            return NexusUserFacingError(
                title: "Cannot reach Nexus",
                message: "Check Settings → Base URL. For SideStore installs, use a LAN or public HTTPS endpoint, not only simulator localhost.",
                isRetryable: true
            )
        case .cancelled:
            return NexusUserFacingError(
                title: "Cancelled",
                message: "The request was cancelled.",
                isRetryable: true
            )
        default:
            return NexusUserFacingError(
                title: "Network error",
                message: error.localizedDescription,
                isRetryable: true
            )
        }
    }
}

private extension String {
    var nonEmpty: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
