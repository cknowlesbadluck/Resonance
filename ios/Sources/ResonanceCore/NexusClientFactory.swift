import Foundation

/// Shared factory for authenticated `NexusClient`.
/// Token resolution: override → Keychain → env only.
/// UserDefaults is never used for bearer tokens (IOS-01).
public enum NexusClientFactory {
    /// Local development default. Only used in DEBUG builds; release builds must be
    /// configured with an explicit base URL.
    public static let defaultBaseURLString = "http://localhost:3000"
    public static let baseURLKey = "RESONANCE_BASE_URL"
    public static let projectIdKey = "RESONANCE_PROJECT_ID"
    public static let bearerTokenKey = "RESONANCE_BEARER_TOKEN"

    #if DEBUG
    static let allowsLocalhostDefault = true
    #else
    static let allowsLocalhostDefault = false
    #endif

    public static func makeClient(
        baseURL: URL? = nil,
        bearerToken: String? = nil,
        projectId: String? = nil
    ) -> NexusClient {
        // Auth material: override → Keychain → process environment only.
        // Do not fall back to UserDefaults for the bearer token.
        let resolvedToken = bearerToken
            ?? KeychainTokenStore.load()
            ?? ProcessInfo.processInfo.environment[bearerTokenKey]

        // No "demo" fallback: the control plane rejects any non-UUID projectId with a
        // 400 before doing work, so a placeholder guarantees failure on every call.
        // An unset project is surfaced as nil and caught by NexusClient, not the server.
        let resolvedProject = resolveProjectId(projectId)

        var headers = NexusRequestHeaders()
        headers.authorizationBearer = resolvedToken
        headers.projectId = resolvedProject

        let transport: any NexusTransport
        do {
            let resolvedBase = try resolveBaseURL(
                explicit: baseURL,
                environmentValue: ProcessInfo.processInfo.environment[baseURLKey],
                storedValue: UserDefaults.standard.string(forKey: baseURLKey),
                allowLocalhostDefault: allowsLocalhostDefault
            )
            transport = URLSessionNexusTransport(baseURL: resolvedBase)
        } catch let error as NexusClientError {
            // Never silently fall back to an insecure or placeholder host: every call
            // fails with a typed, user-facing configuration error instead.
            transport = UnavailableNexusTransport(error: error)
        } catch {
            transport = UnavailableNexusTransport(error: .invalidBaseURL(nil))
        }
        return NexusClient(transport: transport, defaultHeaders: headers)
    }

    /// The first valid project id from: explicit value → environment → UserDefaults.
    public static func resolveProjectId(_ explicit: String?) -> String? {
        [
            explicit?.trimmingCharacters(in: .whitespacesAndNewlines),
            ProcessInfo.processInfo.environment[projectIdKey],
            UserDefaults.standard.string(forKey: projectIdKey),
        ].compactMap { $0 }.first { NexusProjectID.isValid($0) }
    }

    /// Resolves the control-plane base URL: explicit → environment → stored value →
    /// (DEBUG only) `http://localhost:3000`.
    ///
    /// The first non-empty configured value wins and must be valid; an invalid value is
    /// an error rather than a silent fall-through to the next source.
    /// Non-loopback hosts must use `https`.
    public static func resolveBaseURL(
        explicit: URL?,
        environmentValue: String?,
        storedValue: String?,
        allowLocalhostDefault: Bool
    ) throws -> URL {
        if let explicit {
            return try validateBaseURL(explicit)
        }
        for raw in [environmentValue, storedValue] {
            let trimmed = raw?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            guard !trimmed.isEmpty else { continue }
            guard let url = URL(string: trimmed) else { throw NexusClientError.invalidBaseURL(trimmed) }
            return try validateBaseURL(url)
        }
        guard allowLocalhostDefault, let fallback = URL(string: defaultBaseURLString) else {
            throw NexusClientError.invalidBaseURL(nil)
        }
        return fallback
    }

    /// `https` is required unless the host is loopback (`localhost`, `127.0.0.1`, `::1`).
    public static func validateBaseURL(_ url: URL) throws -> URL {
        guard let scheme = url.scheme?.lowercased(), let host = url.host?.lowercased(), !host.isEmpty else {
            throw NexusClientError.invalidBaseURL(url.absoluteString)
        }
        switch scheme {
        case "https":
            return url
        case "http" where isLoopback(host):
            return url
        default:
            throw NexusClientError.invalidBaseURL(url.absoluteString)
        }
    }

    static func isLoopback(_ host: String) -> Bool {
        let normalized = host.trimmingCharacters(in: CharacterSet(charactersIn: "[]"))
        return normalized == "localhost" || normalized == "127.0.0.1" || normalized == "::1"
    }
}

/// Transport used when the base URL is missing or insecure: every request fails with
/// the configuration error instead of reaching the network.
struct UnavailableNexusTransport: NexusTransport {
    let error: NexusClientError

    func get(_ path: String, headers: NexusRequestHeaders) async throws -> Data {
        throw error
    }

    func post(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> Data {
        throw error
    }

    func getResponse(_ path: String, headers: NexusRequestHeaders) async throws -> NexusHTTPResponse {
        throw error
    }

    func postResponse(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> NexusHTTPResponse {
        throw error
    }
}
