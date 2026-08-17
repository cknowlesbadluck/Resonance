import Foundation

public actor NexusAPI {
    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    public func capabilities(ids: [String] = []) async throws -> [Capability] {
        var path = "api/nexus/capabilities"
        if !ids.isEmpty {
            let query = ids.joined(separator: ",").addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
            path += "?ids=\(query)"
        }
        let response: CapabilityResponse = try await request(path: path)
        return response.capabilities ?? response.resolved ?? []
    }

    public func resolveCapabilities(_ ids: [String]) async throws -> CapabilityResolution {
        let path = "api/nexus/capabilities?ids=\((ids.joined(separator: ",")).addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
        return try await request(path: path)
    }

    public func submitIntent(_ request: IntentRequest) async throws -> Data {
        try await requestData(path: "api/nexus/intents", method: "POST", body: request)
    }

    public func executions() async throws -> [NexusExecution] {
        try await request(path: "api/nexus/executions")
    }

    private func request<T: Decodable>(path: String) async throws -> T {
        let data = try await requestData(path: path, method: "GET", body: Optional<EmptyBody>.none)
        return try decoder.decode(T.self, from: data)
    }

    private func requestData<B: Encodable>(path: String, method: String, body: B?) async throws -> Data {
        guard let url = URL(string: path, relativeTo: baseURL) else { throw NexusError(message: "Invalid Nexus endpoint") }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.httpBody = try encoder.encode(body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NexusError(message: "Invalid Nexus response") }
        guard (200..<300).contains(http.statusCode) else {
            if let serverError = try? decoder.decode(NexusError.self, from: data) { throw serverError }
            throw NexusError(message: "Nexus request failed with HTTP \(http.statusCode)")
        }
        return data
    }

    private struct EmptyBody: Encodable {}

    private struct CapabilityResponse: Decodable {
        let capabilities: [Capability]?
        let resolved: [Capability]?
    }
}
