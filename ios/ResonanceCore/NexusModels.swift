import Foundation

public struct NexusCapability: Codable, Identifiable, Sendable, Hashable {
    public let id: String
    public let name: String
    public let description: String?
    public let provider: String?
    public let version: String?
    public let available: Bool?

    public init(
        id: String,
        name: String,
        description: String? = nil,
        provider: String? = nil,
        version: String? = nil,
        available: Bool? = nil
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.provider = provider
        self.version = version
        self.available = available
    }
}

public struct NexusExecution: Codable, Identifiable, Sendable, Hashable {
    public let id: String
    public let status: String
    public let mode: String?

    public init(id: String, status: String, mode: String? = nil) {
        self.id = id
        self.status = status
        self.mode = mode
    }
}

public struct IntentRequest: Codable, Sendable, Hashable {
    public let intent: String

    public init(intent: String) {
        self.intent = intent
    }
}

public struct NexusError: Codable, Error, Sendable, Hashable {
    public let message: String

    public init(message: String) {
        self.message = message
    }
}
