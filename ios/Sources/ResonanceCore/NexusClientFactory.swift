import Foundation

/// Shared factory for constructing an authenticated `NexusClient`.
///
/// Token and project configuration are read from environment / UserDefaults
/// for demo and SideStore builds. Production clients should replace the
/// token source with Keychain (never store long-lived secrets in UserDefaults).
public enum NexusClientFactory {

    public static let defaultBaseURLString = "http://localhost:3000"
    public static let baseURLKey = "RESONANCE_BASE_URL"
    public static let projectIdKey = "RESONANCE_PROJECT_ID"
    public static let bearerTokenKey = "RESONANCE_BEARER_TOKEN"

    /// Builds a client using the best available configuration.
    /// - Parameter overrides: Optional one-off overrides (useful from App Intents).
    public static func makeClient(
        baseURL: URL? = nil,
        bearerToken: String? = nil,
        projectId: String? = nil
    ) -> NexusClient {
        let resolvedBase = baseURL
            ?? URL(string: ProcessInfo.processInfo.environment[baseURLKey] ?? "")
            ?? URL(string: UserDefaults.standard.string(forKey: baseURLKey) ?? "")
            ?? URL(string: defaultBaseURLString)!

        let resolvedToken = bearerToken
            ?? ProcessInfo.processInfo.environment[bearerTokenKey]
            ?? UserDefaults.standard.string(forKey: bearerTokenKey)

        let resolvedProject = projectId
            ?? ProcessInfo.processInfo.environment[projectIdKey]
            ?? UserDefaults.standard.string(forKey: projectIdKey)
            ?? "demo"

        var headers = NexusRequestHeaders()
        headers.authorizationBearer = resolvedToken
        headers.projectId = resolvedProject

        let transport = URLSessionNexusTransport(baseURL: resolvedBase)
        return NexusClient(transport: transport, defaultHeaders: headers)
    }
}
