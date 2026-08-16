import Foundation

public struct NexusCapability: Codable, Sendable, Equatable, Identifiable {
    public let id: String
    public let key: String
    public let name: String
    public let description: String?
    public let providerId: String?
    public let version: String?
    public let risk: String
    public let availability: String?

    public init(
        id: String,
        key: String,
        name: String,
        description: String? = nil,
        providerId: String? = nil,
        version: String? = nil,
        risk: String,
        availability: String? = nil
    ) {
        self.id = id
        self.key = key
        self.name = name
        self.description = description
        self.providerId = providerId
        self.version = version
        self.risk = risk
        self.availability = availability
    }
}

public struct NexusCapabilityResponse: Codable, Sendable, Equatable {
    public let capabilities: [NexusCapability]
}

public struct NexusIntentRequest: Codable, Sendable, Equatable {
    public let id: String?
    public let projectId: String
    public let objective: String
    public let requestedBy: String
    public let requirements: [NexusCapabilityRequirement]
    public let contextRefs: [String]

    public init(
        id: String? = nil,
        projectId: String = "demo",
        objective: String,
        requestedBy: String,
        requirements: [NexusCapabilityRequirement],
        contextRefs: [String] = []
    ) {
        self.id = id
        self.projectId = projectId
        self.objective = objective
        self.requestedBy = requestedBy
        self.requirements = requirements
        self.contextRefs = contextRefs
    }
}

public struct NexusCapabilityRequirement: Codable, Sendable, Equatable {
    public let key: String
    public let requiredPermissions: [String]?
    public let resourceType: String?
    public let preferredProviderIds: [String]?
    public let maxRisk: String?
    public let tags: [String]?

    public init(
        key: String,
        requiredPermissions: [String]? = nil,
        resourceType: String? = nil,
        preferredProviderIds: [String]? = nil,
        maxRisk: String? = nil,
        tags: [String]? = nil
    ) {
        self.key = key
        self.requiredPermissions = requiredPermissions
        self.resourceType = resourceType
        self.preferredProviderIds = preferredProviderIds
        self.maxRisk = maxRisk
        self.tags = tags
    }
}

public struct NexusIntentResponse: Codable, Sendable, Equatable {
    public let intent: NexusIntentRequest
    public let plan: NexusExecutionPlan
}

public struct NexusExecutionPlan: Codable, Sendable, Equatable, Identifiable {
    public let id: String
    public let intentId: String
    public let projectId: String
    public let actorId: String
    public let mode: String
    public let steps: [NexusExecutionStep]
    public let contextRefs: [String]
    public let approvalRequired: Bool
    public let rationale: [String]
}

public struct NexusExecutionStep: Codable, Sendable, Equatable, Identifiable {
    public let id: String
    public let capabilityId: String
    public let adapterId: String
    public let input: JSONValue
    public let requiresApproval: Bool
}

public struct NexusExecution: Codable, Sendable, Equatable, Identifiable {
    public let id: String
    public let planId: String
    public let status: String
    public let startedAt: String?
    public let completedAt: String?
    public let output: JSONValue?
    public let error: String?
}

public struct NexusExecutionsResponse: Codable, Sendable, Equatable {
    public let executions: [NexusExecution]
    public let evidence: [JSONValue]
}

public struct NexusExecutionResponse: Codable, Sendable, Equatable {
    public let intent: NexusIntentRequest
    public let plan: NexusExecutionPlan
    public let execution: NexusExecution?
    public let evidence: [JSONValue]?
    public let status: String?
}

public struct NexusError: Codable, Error, Sendable, Equatable {
    public let message: String

    public init(message: String) {
        self.message = message
    }
}

/// A small Sendable JSON representation used for provider-neutral payloads.
public enum JSONValue: Codable, Sendable, Equatable, Hashable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null; return }
        if let value = try? container.decode(Bool.self) { self = .bool(value); return }
        if let value = try? container.decode(Double.self) { self = .number(value); return }
        if let value = try? container.decode(String.self) { self = .string(value); return }
        if let value = try? container.decode([String: JSONValue].self) { self = .object(value); return }
        self = .array(try container.decode([JSONValue].self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}
