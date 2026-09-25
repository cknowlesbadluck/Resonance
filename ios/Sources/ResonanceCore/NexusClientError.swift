import Foundation

/// Explicit mapping of the Nexus contract's failure statuses.
///
/// The mandate requires 400 / 401 / 409 / 422 to be mapped explicitly rather than
/// funnelled into a single opaque status error, because each one demands a different
/// response from the UI: fix the request, re-authenticate, regenerate the idempotency
/// key, or show the failed execution's evidence.
public enum NexusClientError: Error, Sendable, Equatable {
    /// 400 — the request was malformed or violated a contract constraint
    /// (missing `Idempotency-Key`, non-UUID `projectId`, oversized body).
    case badRequest(message: String?)

    /// 401 — missing/expired bearer token, or the caller is not a member of the project.
    case unauthorized(message: String?)

    /// 409 — the `Idempotency-Key` was already used for a *different* request payload.
    /// Retrying is futile; a new key is required.
    case idempotencyConflict(message: String?)

    /// 422 — the plan was composed but the execution did not complete.
    /// Carries the server's message; the full envelope is returned to the caller
    /// rather than thrown whenever the body is decodable.
    case unprocessable(message: String?)

    /// 429 — execution rate limit for the project. `retryAfter` is in seconds.
    case rateLimited(retryAfter: Int?, message: String?)

    /// Any other non-2xx status.
    case httpStatus(Int, message: String?)

    case decodingFailed
    case missingIdempotencyKey
    /// A `projectId` that the control plane will reject before doing any work.
    case invalidProjectId(String)

    /// Maps a status code onto the typed contract. Returns `nil` for success statuses.
    public static func from(status: Int, data: Data, retryAfter: Int? = nil) -> NexusClientError? {
        guard !(200..<300).contains(status) else { return nil }
        let message = nexusServerMessage(from: data)
        switch status {
        case 400: return .badRequest(message: message)
        case 401, 403: return .unauthorized(message: message)
        case 409: return .idempotencyConflict(message: message)
        case 422: return .unprocessable(message: message)
        case 429: return .rateLimited(retryAfter: retryAfter, message: message)
        default: return .httpStatus(status, message: message)
        }
    }

    /// Whether retrying the identical request with the same idempotency key can succeed.
    public var isRetryable: Bool {
        switch self {
        case .rateLimited: return true
        case .httpStatus(let code, _): return code >= 500
        default: return false
        }
    }

    /// A single, consistent, user-facing rendering of the failure.
    /// Every surface (SwiftUI, App Intents) routes through this rather than duplicating
    /// its own status switch — the duplicates had already drifted apart.
    public var userFacingMessage: String {
        switch self {
        case .badRequest(let m):
            return m ?? "The request was rejected as invalid."
        case .unauthorized:
            return "Authentication required. Open Resonance and sign in."
        case .idempotencyConflict:
            return "That idempotency key was already used for a different request. Start a new execution."
        case .unprocessable(let m):
            return m ?? "The plan composed but the execution did not complete."
        case .rateLimited(let retryAfter, _):
            if let retryAfter { return "Rate limited. Try again in \(retryAfter)s." }
            return "Rate limited. Try again in a minute."
        case .httpStatus(let code, let m):
            return "HTTP \(code): \(m ?? "error")"
        case .decodingFailed:
            return "The control plane returned a response this client could not read."
        case .missingIdempotencyKey:
            return "An idempotency key is required to create an execution."
        case .invalidProjectId(let value):
            return "Project \"\(value)\" is not a valid project id."
        }
    }

    public var serverMessage: String? {
        switch self {
        case .badRequest(let m), .unauthorized(let m), .idempotencyConflict(let m),
             .unprocessable(let m), .httpStatus(_, let m):
            return m
        case .rateLimited(_, let m):
            return m
        case .decodingFailed, .missingIdempotencyKey:
            return nil
        case .invalidProjectId(let value):
            return "projectId \"\(value)\" is not a UUID."
        }
    }
}

/// The control plane rejects any non-UUID `projectId` with a 400 before doing work.
public enum NexusProjectID {
    private static let pattern = try? NSRegularExpression(
        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        options: [.caseInsensitive]
    )

    public static func isValid(_ value: String) -> Bool {
        guard let pattern else { return false }
        let range = NSRange(value.startIndex..<value.endIndex, in: value)
        return pattern.firstMatch(in: value, options: [], range: range) != nil
    }
}
