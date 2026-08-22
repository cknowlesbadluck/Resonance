import Foundation
import os

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

public enum NexusClientError: Error, Sendable, Equatable, LocalizedError {
    case httpStatus(Int, message: String?)
    case decodingFailed
    case missingIdempotencyKey

    public var errorDescription: String? {
        NexusUserFacingError.map(self).message
    }
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
    private let logger = Logger(subsystem: "com.resonance.nexus", category: "client")

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
        let data = try await getRetrying(queryPath("/api/nexus/capabilities"))
        return try decode(NexusCapabilityResponse.self, from: data).capabilities
    }

    public func compose(_ request: NexusIntentRequest) async throws -> NexusIntentResponse {
        let body = try encoder.encode(request)
        let data = try await transport.post("/api/nexus/intents", body: body, headers: defaultHeaders)
        return try decode(NexusIntentResponse.self, from: data)
    }

    @discardableResult
    public func execute(
        _ request: NexusIntentRequest,
        idempotencyKey: String? = nil
    ) async throws -> (response: NexusExecutionResponse, idempotencyKey: String) {
        let trimmed = (idempotencyKey ?? defaultHeaders.idempotencyKey)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedKey: String
        if let trimmed, !trimmed.isEmpty {
            resolvedKey = trimmed
        } else {
            resolvedKey = UUID().uuidString
        }

        var headers = defaultHeaders
        headers.idempotencyKey = resolvedKey

        let body = try encoder.encode(request)
        let data = try await transport.post("/api/nexus/executions", body: body, headers: headers)
        return (try decode(NexusExecutionResponse.self, from: data), resolvedKey)
    }

    public func resume(
        id: String,
        projectId: String,
        approved: Bool
    ) async throws -> NexusExecutionResponse {
        let body = try encoder.encode(NexusResumeRequest(projectId: projectId, approved: approved))
        let encodedID = Self.encodePath(id)
        let data = try await transport.post("/api/nexus/executions/\(encodedID)/resume", body: body, headers: defaultHeaders)
        return try decode(NexusExecutionResponse.self, from: data)
    }

    public func executions() async throws -> NexusExecutionsResponse {
        let data = try await getRetrying(queryPath("/api/nexus/executions"))
        return try decode(NexusExecutionsResponse.self, from: data)
    }

    private func queryPath(_ base: String) -> String {
        guard let projectId = defaultHeaders.projectId, !projectId.isEmpty else { return base }
        let encoded = projectId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? projectId
        return "\(base)?projectId=\(encoded)"
    }

    private static func encodePath(_ raw: String) -> String {
        var allowed = CharacterSet.urlPathAllowed
        allowed.remove(charactersIn: "/")
        return raw.addingPercentEncoding(withAllowedCharacters: allowed) ?? raw
    }

    private func getRetrying(_ path: String) async throws -> Data {
        do {
            return try await transport.get(path, headers: defaultHeaders)
        } catch let error as NexusClientError {
            if case .httpStatus(let code, _) = error, (500...599).contains(code) {
                logger.error("GET \(path, privacy: .public) failed with \(code); retrying once")
                try await Task.sleep(for: .milliseconds(200))
                return try await transport.get(path, headers: defaultHeaders)
            }
            throw error
        } catch let error as URLError {
            if error.code == .timedOut || error.code == .networkConnectionLost {
                logger.error("GET \(path, privacy: .public) transport failure; retrying once")
                try await Task.sleep(for: .milliseconds(200))
                return try await transport.get(path, headers: defaultHeaders)
            }
            throw error
        }
    }

    private func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try decoder.decode(type, from: data)
        } catch {
            logger.error("Decoding \(String(describing: type), privacy: .public) failed")
            throw NexusClientError.decodingFailed
        }
    }
}
