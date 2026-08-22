import Foundation

/// Shared factory for authenticated `NexusClient`.
/// Token resolution: override → Keychain → env → UserDefaults (legacy read).
/// Base URL is user-configurable so SideStore builds can target any Nexus host.
public enum NexusClientFactory {
    public static let defaultBaseURLString = "http://localhost:3000"
    public static let baseURLKey = "RESONANCE_BASE_URL"
    public static let projectIdKey = "RESONANCE_PROJECT_ID"
    public static let bearerTokenKey = "RESONANCE_BEARER_TOKEN"

    public static func resolvedBaseURLString() -> String {
        if let env = ProcessInfo.processInfo.environment[baseURLKey]?.trimmingCharacters(in: .whitespacesAndNewlines),
           !env.isEmpty {
            return env
        }
        if let stored = UserDefaults.standard.string(forKey: baseURLKey)?.trimmingCharacters(in: .whitespacesAndNewlines),
           !stored.isEmpty {
            return stored
        }
        return defaultBaseURLString
    }

    public static func resolvedProjectId() -> String {
        ProcessInfo.processInfo.environment[projectIdKey]
            ?? UserDefaults.standard.string(forKey: projectIdKey)
            ?? "demo"
    }

    public static func resolvedBearerToken() -> String? {
        KeychainTokenStore.load()
            ?? ProcessInfo.processInfo.environment[bearerTokenKey]
            ?? UserDefaults.standard.string(forKey: bearerTokenKey)
    }

    public static func persistBaseURL(_ value: String) {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            UserDefaults.standard.removeObject(forKey: baseURLKey)
        } else {
            UserDefaults.standard.set(trimmed, forKey: baseURLKey)
        }
    }

    public static func persistProjectId(_ value: String) {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            UserDefaults.standard.removeObject(forKey: projectIdKey)
        } else {
            UserDefaults.standard.set(trimmed, forKey: projectIdKey)
        }
    }

    public static func persistBearerToken(_ value: String?) throws {
        if let value, !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            try KeychainTokenStore.save(value)
        } else {
            KeychainTokenStore.delete()
        }
        UserDefaults.standard.removeObject(forKey: bearerTokenKey)
    }

    public static func makeClient(
        baseURL: URL? = nil,
        bearerToken: String? = nil,
        projectId: String? = nil
    ) -> NexusClient {
        let resolvedBase = baseURL
            ?? URL(string: resolvedBaseURLString())
            ?? URL(string: defaultBaseURLString)!

        var headers = NexusRequestHeaders()
        headers.authorizationBearer = bearerToken ?? resolvedBearerToken()
        headers.projectId = projectId ?? resolvedProjectId()

        let transport = URLSessionNexusTransport(baseURL: resolvedBase)
        return NexusClient(transport: transport, defaultHeaders: headers)
    }
}
