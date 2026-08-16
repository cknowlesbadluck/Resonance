import Foundation

public struct NexusIntent: Codable, Identifiable, Sendable, Hashable {
    public let id: String
    public let text: String
    public let status: Status
    public let requiredCapabilityIDs: [String]
    public let requiresApproval: Bool

    public enum Status: String, Codable, Sendable, Hashable {
        case draft, ready, awaitingApproval, executing, completed, failed
    }

    public init(id: String, text: String, status: Status = .draft, requiredCapabilityIDs: [String] = [], requiresApproval: Bool = false) {
        self.id = id
        self.text = text
        self.status = status
        self.requiredCapabilityIDs = requiredCapabilityIDs
        self.requiresApproval = requiresApproval
    }
}

public struct NexusEvidence: Codable, Identifiable, Sendable, Hashable {
    public let id: String
    public let timestamp: Date
    public let kind: Kind
    public let summary: String

    public enum Kind: String, Codable, Sendable, Hashable {
        case event, artifact, approval, result, error
    }

    public init(id: String, timestamp: Date, kind: Kind, summary: String) {
        self.id = id
        self.timestamp = timestamp
        self.kind = kind
        self.summary = summary
    }
}
