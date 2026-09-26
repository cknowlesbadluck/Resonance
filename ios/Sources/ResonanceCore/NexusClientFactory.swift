import Foundation

/// Shared factory for authenticated `NexusClient`.
/// Token resolution: override → Keychain → env only.
/// UserDefaults is never used for bearer tokens (IOS-01).
public enum NexusClientFactory {
    public static let defaultBaseURLString = "https://resonancenexus.netlify.app"
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

        // Auth material: override → Keychain → process environment only.
        // Do not fall back to UserDefaults for the bearer token.
        let resolvedToken = bearerToken
            ?? KeychainTokenStore.load()
            ?? ProcessInfo.processInfo.environment[bearerTokenKey]

        // No "demo" fallback: the control plane rejects any non-UUID projectId with a
        // 400 before doing work, so a placeholder guarantees failure on every call.
        // An unset project is surfaced as nil and caught by NexusClient, not the server.
        let resolvedProject = [
            projectId,
            ProcessInfo.processInfo.environment[projectIdKey],
            UserDefaults.standard.string(forKey: projectIdKey),
        ].compactMap { $0 }.first { NexusProjectID.isValid($0) }

        var headers = NexusRequestHeaders()
        headers.authorizationBearer = resolvedToken
        headers.projectId = resolvedProject

        let transport = URLSessionNexusTransport(baseURL: resolvedBase)
        return NexusClient(transport: transport, defaultHeaders: headers)
    }
}
