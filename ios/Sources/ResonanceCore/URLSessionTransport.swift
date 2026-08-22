import Foundation

public enum NexusURLBuilder: Sendable {
    public static func url(base: URL, path: String) throws -> URL {
        let trimmed = path.hasPrefix("/") ? String(path.dropFirst()) : path
        let parts = trimmed.split(separator: "?", maxSplits: 1, omittingEmptySubsequences: false)
        let pathOnly = String(parts[0])
        guard var components = URLComponents(url: base, resolvingAgainstBaseURL: false) else {
            throw URLError(.badURL)
        }
        var basePath = components.path
        if basePath.isEmpty { basePath = "/" }
        if !basePath.hasSuffix("/") { basePath += "/" }
        components.path = basePath + pathOnly
        if parts.count == 2 {
            components.percentEncodedQuery = String(parts[1])
        }
        guard let url = components.url else {
            throw URLError(.badURL)
        }
        return url
    }
}

public struct URLSessionNexusTransport: NexusTransport {
    private let baseURL: URL
    private let session: URLSession

    public static func makeSession() -> URLSession {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        configuration.waitsForConnectivity = true
        configuration.httpCookieAcceptPolicy = .never
        configuration.httpShouldSetCookies = false
        return URLSession(configuration: configuration)
    }

    public init(baseURL: URL, session: URLSession = URLSessionNexusTransport.makeSession()) {
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
        let url = try NexusURLBuilder.url(base: baseURL, path: path)
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
        guard (200..<300).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8)
            throw NexusClientError.httpStatus(http.statusCode, message: message)
        }
        return data
    }
}
