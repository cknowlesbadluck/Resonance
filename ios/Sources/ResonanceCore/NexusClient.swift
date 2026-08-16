import Foundation

public struct NexusCapability: Codable, Sendable, Equatable {
    public let id: String
    public let key: String
    public let name: String
    public let risk: String

    public init(id: String, key: String, name: String, risk: String) {
        self.id = id
        self.key = key
        self.name = name
        self.risk = risk
    }
}

public struct NexusCapabilitiesResponse: Codable, Sendable {
    public let capabilities: [NexusCapability]
}

public protocol NexusTransport: Sendable {
    func get(_ path: String) async throws -> Data
}

public actor NexusClient {
    private let transport: any NexusTransport
    private let decoder = JSONDecoder()

    public init(transport: any NexusTransport) {
        self.transport = transport
    }

    public func capabilities() async throws -> [NexusCapability] {
        let data = try await transport.get("/api/nexus/capabilities")
        return try decoder.decode(NexusCapabilitiesResponse.self, from: data).capabilities
    }
}
