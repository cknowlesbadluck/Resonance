import Foundation

/// Shared factory for constructing an authenticated `NexusClient`.
///
/// Resolution order for bearer token:
/// 1. Explicit override
/// 2. Keychain (`KeychainTokenStore`)
/// 3. Process environment
/// 4. UserDefaults (demo / SideStore convenience only)
public enum NexusClientFactory {

    public static let defaultBaseURLString = "http://localhost:3000"
    public static let baseURLKey = "RESONANCE_BASE_URL"
    public static let projectIdKey = "RESONANCE_PROJECT_ID"
    public static let bearerTokenKey = "RESONANCE_BEARER_TOKEN"

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
            ?? KeychainTokenStore.load()
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
