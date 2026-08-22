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
}

public extension NexusTransport {
    func get(_ path: String) async throws -> Data {
        try await get(path, headers: NexusRequestHeaders())
    }

    func post(_ path: String, body: Data) async throws -> Data {
        try await post(path, body: body, headers: NexusRequestHeaders())
    }
}

public enum NexusClientError: Error, Sendable, Equatable {
    case httpStatus(Int, message: String?)
    case decodingFailed
    case missingIdempotencyKey
}

public struct NexusResumeRequest: Codable, Sendable, Equatable {
    public let projectId: String
    public let approved: Bool

    public init(projectId: String, approved: Bool) {
        self.projectId = projectId
        self.approved = approved
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

    public func setProjectId(_ projectId: String?) {
        defaultHeaders.projectId = projectId
    }

    public func capabilities() async throws -> [NexusCapability] {
        var path = "/api/nexus/capabilities"
        if let projectId = defaultHeaders.projectId {
            path += "?projectId=\(projectId)"
        }
        let data = try await transport.get(path, headers: defaultHeaders)
        do {
            return try decoder.decode(NexusCapabilityResponse.self, from: data).capabilities
        } catch {
            throw NexusClientError.decodingFailed
        }
    }

    public func compose(_ request: NexusIntentRequest) async throws -> NexusIntentResponse {
        let body = try encoder.encode(request)
        let data = try await transport.post("/api/nexus/intents", body: body, headers: defaultHeaders)
        do {
            return try decoder.decode(NexusIntentResponse.self, from: data)
        } catch {
            throw NexusClientError.decodingFailed
        }
    }

    /// Creates an execution. Always sends a non-blank Idempotency-Key (generated if omitted).
    /// Returns the resolved key so the UI can resume an approval_required request.
    @discardableResult
    public func execute(
        _ request: NexusIntentRequest,
        idempotencyKey: String? = nil
    ) async throws -> (response: NexusExecutionResponse, idempotencyKey: String) {
        let key = (idempotencyKey ?? defaultHeaders.idempotencyKey)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedKey = (key?.isEmpty == false) ? key! : UUID().uuidString

        var headers = defaultHeaders
        headers.idempotencyKey = resolvedKey

        let body = try encoder.encode(request)
        let data = try await transport.post("/api/nexus/executions", body: body, headers: headers)
        do {
            let decoded = try decoder.decode(NexusExecutionResponse.self, from: data)
            return (decoded, resolvedKey)
        } catch {
            throw NexusClientError.decodingFailed
        }
    }

    public func resume(
        id: String,
        projectId: String,
        approved: Bool
    ) async throws -> NexusExecutionResponse {
        let body = try encoder.encode(NexusResumeRequest(projectId: projectId, approved: approved))
        let path = "/api/nexus/executions/\(id)/resume"
        let data = try await transport.post(path, body: body, headers: defaultHeaders)
        do {
            return try decoder.decode(NexusExecutionResponse.self, from: data)
        } catch {
            throw NexusClientError.decodingFailed
        }
    }

    public func executions() async throws -> NexusExecutionsResponse {
        var path = "/api/nexus/executions"
        if let projectId = defaultHeaders.projectId {
            path += "?projectId=\(projectId)"
        }
        let data = try await transport.get(path, headers: defaultHeaders)
        do {
            return try decoder.decode(NexusExecutionsResponse.self, from: data)
        } catch {
            throw NexusClientError.decodingFailed
        }
    }
}
