import Foundation

public struct URLSessionNexusTransport: NexusTransport {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func get(_ path: String) async throws -> Data {
        let url = URL(string: path, relativeTo: baseURL)?.absoluteURL ?? baseURL
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            throw URLError(.badServerResponse)
        }
        return data
    }
}
