import Foundation

public protocol NexusTransport: Sendable {
    func get(_ path: String) async throws -> Data
    func post(_ path: String, body: Data) async throws -> Data
}

public actor NexusClient {
    private let transport: any NexusTransport
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    public init(transport: any NexusTransport) {
        self.transport = transport
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    public func capabilities() async throws -> [NexusCapability] {
        let data = try await transport.get("/api/nexus/capabilities")
        return try decoder.decode(NexusCapabilityResponse.self, from: data).capabilities
    }

    public func compose(_ request: NexusIntentRequest) async throws -> NexusIntentResponse {
        let body = try encoder.encode(request)
        let data = try await transport.post("/api/nexus/intents", body: body)
        return try decoder.decode(NexusIntentResponse.self, from: data)
    }

    public func execute(_ request: NexusIntentRequest) async throws -> NexusExecutionResponse {
        let body = try encoder.encode(request)
        let data = try await transport.post("/api/nexus/executions", body: body)
        return try decoder.decode(NexusExecutionResponse.self, from: data)
    }

    public func executions() async throws -> NexusExecutionsResponse {
        let data = try await transport.get("/api/nexus/executions")
        return try decoder.decode(NexusExecutionsResponse.self, from: data)
    }
}
