import Foundation

@available(macOS 12.0, *)
public struct URLSessionNexusTransport: NexusTransport {
    private let baseURL: URL
    private let session: URLSession
    private let timeout: TimeInterval

    /// 30s matches the control plane's own execution ceiling. `URLSession.shared`
    /// defaults to 60s, which is long enough for a stalled request to look like a hung UI.
    public static let defaultTimeout: TimeInterval = 30

    public init(baseURL: URL, session: URLSession = .shared, timeout: TimeInterval = defaultTimeout) {
        self.baseURL = baseURL
        self.session = session
        self.timeout = timeout
    }

    public func get(_ path: String, headers: NexusRequestHeaders) async throws -> Data {
        try await request(path: path, method: "GET", body: nil, headers: headers)
    }

    public func post(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> Data {
        try await request(path: path, method: "POST", body: body, headers: headers)
    }

    public func getResponse(_ path: String, headers: NexusRequestHeaders) async throws -> NexusHTTPResponse {
        try await send(path: path, method: "GET", body: nil, headers: headers)
    }

    public func postResponse(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> NexusHTTPResponse {
        try await send(path: path, method: "POST", body: body, headers: headers)
    }

    private func request(path: String, method: String, body: Data?, headers: NexusRequestHeaders) async throws -> Data {
        let response = try await send(path: path, method: method, body: body, headers: headers)
        if let error = NexusClientError.from(status: response.status, data: response.data, retryAfter: nil) {
            throw error
        }
        return response.data
    }

    private func send(path: String, method: String, body: Data?, headers: NexusRequestHeaders) async throws -> NexusHTTPResponse {
        guard let url = URL(string: path, relativeTo: baseURL)?.absoluteURL else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url, timeoutInterval: timeout)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        for (name, value) in headers.httpHeaders {
            request.setValue(value, forHTTPHeaderField: name)
        }
        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        return NexusHTTPResponse(status: http.statusCode, data: data)
    }
}
