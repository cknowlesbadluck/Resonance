import Foundation

public actor NexusAPI {
    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private let bearerToken: String

    public init(baseURL: URL, bearerToken: String, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.bearerToken = bearerToken
        self.session = session
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    public func capabilities(projectId: String) async throws -> [NexusCapability] {
        try await request(path: "api/nexus/capabilities?projectId=\(projectId)")
    }

    public func submitIntent(_ intent: IntentRequest, idempotencyKey: String) async throws -> NexusExecutionResponse {
        try await requestData(path: "api/nexus/executions", method: "POST", body: intent, idempotencyKey: idempotencyKey)
    }

    public func executions(projectId: String) async throws -> [NexusExecution] {
        let response: ExecutionListResponse = try await request(path: "api/nexus/executions?projectId=\(projectId)")
        return response.executions
    }

    private func request<T: Decodable>(path: String) async throws -> T {
        let data = try await requestData(path: path, method: "GET", body: Optional<EmptyBody>.none, idempotencyKey: nil)
        return try decoder.decode(T.self, from: data)
    }

    private func requestData<B: Encodable>(path: String, method: String, body: B?, idempotencyKey: String?) async throws -> Data {
        guard let url = URL(string: path, relativeTo: baseURL) else { throw NexusError(message: "Invalid Nexus endpoint") }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        if let idempotencyKey { request.setValue(idempotencyKey, forHTTPHeaderField: "Idempotency-Key") }
        if let body { request.httpBody = try encoder.encode(body); request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NexusError(message: "Invalid Nexus response") }
        guard (200..<300).contains(http.statusCode) else {
            if let serverError = try? decoder.decode(NexusError.self, from: data) { throw serverError }
            throw NexusError(message: "Nexus request failed with HTTP \(http.statusCode)")
        }
        return data
    }

    private struct EmptyBody: Encodable {}
    private struct ExecutionListResponse: Decodable { let executions: [NexusExecution]; let evidence: [NexusEvidence] }
}
