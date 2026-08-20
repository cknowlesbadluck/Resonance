import Foundation

@available(macOS 12.0, *)
public struct URLSessionNexusTransport: NexusTransport {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func get(_ path: String, headers: NexusRequestHeaders) async throws -> Data {
        try await request(path: path, method: "GET", body: nil, headers: headers)
    }

    public func post(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> Data {
        try await request(path: path, method: "POST", body: body, headers: headers)
    }

    private func request(path: String, method: String, body: Data?, headers: NexusRequestHeaders) async throws -> Data {
        guard let url = URL(string: path, relativeTo: baseURL)?.absoluteURL else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
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

        guard 200..<300 ~= http.statusCode else {
            let message = String(data: data, encoding: .utf8)
            throw NexusClientError.httpStatus(http.statusCode, message: message)
        }
        return data
    }
}
