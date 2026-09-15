import Foundation

public struct NexusRequestHeaders: Sendable, Equatable {
    public var authorizationBearer: String?
    public var idempotencyKey: String?
    public var projectId: String?

    public init(authorizationBearer: String? = nil, idempotencyKey: String? = nil, projectId: String? = nil) {
        self.authorizationBearer = authorizationBearer
        self.idempotencyKey = idempotencyKey
        self.projectId = projectId
    }

    public func merging(_ other: NexusRequestHeaders) -> NexusRequestHeaders {
        NexusRequestHeaders(
            authorizationBearer: other.authorizationBearer ?? authorizationBearer,
            idempotencyKey: other.idempotencyKey ?? idempotencyKey,
            projectId: other.projectId ?? projectId
        )
    }

    public var httpHeaders: [String: String] {
        var headers: [String: String] = [:]
        if let authorizationBearer, !authorizationBearer.isEmpty {
            headers["Authorization"] = "Bearer \(authorizationBearer)"
        }
        if let idempotencyKey, !idempotencyKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            headers["Idempotency-Key"] = idempotencyKey
        }
        return headers
    }
}

public protocol NexusTransport: Sendable {
    func get(_ path: String, headers: NexusRequestHeaders) async throws -> Data
    func post(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> Data

    /// Status-preserving variants. Default implementations wrap the `Data` methods so
    /// existing conformances keep working; `URLSessionNexusTransport` overrides them to
    /// report the real status instead of throwing on non-2xx.
    func getResponse(_ path: String, headers: NexusRequestHeaders) async throws -> NexusHTTPResponse
    func postResponse(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> NexusHTTPResponse
}

public extension NexusTransport {
    func get(_ path: String) async throws -> Data {
        try await get(path, headers: NexusRequestHeaders())
    }

    func post(_ path: String, body: Data) async throws -> Data {
        try await post(path, body: body, headers: NexusRequestHeaders())
    }

    func getResponse(_ path: String, headers: NexusRequestHeaders) async throws -> NexusHTTPResponse {
        NexusHTTPResponse(status: 200, data: try await get(path, headers: headers))
    }

    func postResponse(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> NexusHTTPResponse {
        NexusHTTPResponse(status: 200, data: try await post(path, body: body, headers: headers))
    }
}

public actor NexusClient {
    private let transport: any NexusTransport
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private var defaultHeaders: NexusRequestHeaders

    public init(transport: any NexusTransport, defaultHeaders: NexusRequestHeaders = NexusRequestHeaders()) {
        self.transport = transport
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
        self.defaultHeaders = defaultHeaders
    }

    public func setAuthorizationBearer(_ token: String?) {
        defaultHeaders.authorizationBearer = token
    }

    /// Sets the project scope. Rejects a non-UUID up front rather than letting the
    /// control plane return a 400 on every subsequent call.
    public func setProjectId(_ projectId: String?) throws {
        if let projectId, !NexusProjectID.isValid(projectId) {
            throw NexusClientError.invalidProjectId(projectId)
        }
        defaultHeaders.projectId = projectId
    }

    private func decode<T: Decodable>(_ type: T.Type, from response: NexusHTTPResponse) throws -> T {
        if let error = NexusClientError.from(status: response.status, data: response.data) { throw error }
        do { return try decoder.decode(type, from: response.data) }
        catch { throw NexusClientError.decodingFailed }
    }

    /// Builds a path with a percent-encoded query. Interpolating the project id directly
    /// produced a malformed URL for any value containing a reserved character.
    ///
    /// Deliberately not `URLComponents.queryItems`: that setter treats `&`, `=` and `+`
    /// as legal query characters and leaves them unescaped inside a *value*, so a value
    /// containing `&` silently becomes a second parameter. The allowed set is narrowed
    /// and the query assembled explicitly.
    private func path(_ base: String, query: [String: String?]) -> String {
        var allowed = CharacterSet.urlQueryAllowed
        allowed.remove(charactersIn: "&=+?#")

        let items = query
            .compactMap { name, value -> String? in
                guard let value, !value.isEmpty,
                      let encodedName = name.addingPercentEncoding(withAllowedCharacters: allowed),
                      let encodedValue = value.addingPercentEncoding(withAllowedCharacters: allowed)
                else { return nil }
                return "\(encodedName)=\(encodedValue)"
            }
            .sorted()

        return items.isEmpty ? base : "\(base)?\(items.joined(separator: "&"))"
    }

    public func capabilities() async throws -> [NexusCapability] {
        let path = self.path("/api/nexus/capabilities", query: ["projectId": defaultHeaders.projectId])
        let response = try await transport.getResponse(path, headers: defaultHeaders)
        return try decode(NexusCapabilityResponse.self, from: response).capabilities
    }

    public func compose(_ request: NexusIntentRequest) async throws -> NexusIntentResponse {
        let body = try encoder.encode(request)
        let response = try await transport.postResponse("/api/nexus/intents", body: body, headers: defaultHeaders)
        return try decode(NexusIntentResponse.self, from: response)
    }

    /// Creates an execution. Always sends a non-blank Idempotency-Key (generated if omitted).
    public func execute(
        _ request: NexusIntentRequest,
        idempotencyKey: String? = nil
    ) async throws -> NexusExecutionResponse {
        let key = (idempotencyKey ?? defaultHeaders.idempotencyKey)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedKey = (key?.isEmpty == false) ? key! : UUID().uuidString

        var headers = defaultHeaders
        headers.idempotencyKey = resolvedKey

        if !NexusProjectID.isValid(request.projectId) {
            throw NexusClientError.invalidProjectId(request.projectId)
        }

        let body = try encoder.encode(request)
        let response = try await transport.postResponse("/api/nexus/executions", body: body, headers: headers)

        // 422 means the plan composed but the execution did not complete. The control
        // plane returns the full envelope — including evidence for the failed step — so
        // the failure is returned to the caller, not thrown away. Only an undecodable
        // 422 becomes an error.
        if response.status == 422, let decoded = try? decoder.decode(NexusExecutionResponse.self, from: response.data) {
            return decoded
        }
        return try decode(NexusExecutionResponse.self, from: response)
    }

    public func executions() async throws -> NexusExecutionsResponse {
        let path = self.path("/api/nexus/executions", query: ["projectId": defaultHeaders.projectId])
        let response = try await transport.getResponse(path, headers: defaultHeaders)
        return try decode(NexusExecutionsResponse.self, from: response)
    }
}
