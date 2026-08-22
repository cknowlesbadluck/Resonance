import Foundation

// MARK: - Capability kind / risk / availability
// Forward-compatible enums: unrecognized server values decode to `.unknown`
// rather than failing the whole payload (see Resonance mandate §12).

public enum CapabilityKind: Sendable, Equatable, Codable {
    case skill, tool, integration, resource, other
    case unknown(String)

    public init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        switch raw {
        case "skill": self = .skill
        case "tool": self = .tool
        case "integration": self = .integration
        case "resource": self = .resource
        case "other": self = .other
        default: self = .unknown(raw)
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .skill: try container.encode("skill")
        case .tool: try container.encode("tool")
        case .integration: try container.encode("integration")
        case .resource: try container.encode("resource")
        case .other: try container.encode("other")
        case .unknown(let raw): try container.encode(raw)
        }
    }
}

public enum CapabilityRisk: Sendable, Equatable, Codable {
    case low, medium, high, critical
    case unknown(String)

    public init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        switch raw {
        case "low": self = .low
        case "medium": self = .medium
        case "high": self = .high
        case "critical": self = .critical
        default: self = .unknown(raw)
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .low: try container.encode("low")
        case .medium: try container.encode("medium")
        case .high: try container.encode("high")
        case .critical: try container.encode("critical")
        case .unknown(let raw): try container.encode(raw)
        }
    }
}

public enum CapabilityAvailability: String, Sendable, Equatable, Codable {
    case available, degraded, unavailable, planned
    case unknown

    public init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = CapabilityAvailability(rawValue: raw) ?? .unknown
    }
}

public struct NexusCapabilityDependency: Codable, Sendable, Equatable {
    public let capabilityKey: String
    public let kind: CapabilityKind?
    public let optional: Bool?

    public init(capabilityKey: String, kind: CapabilityKind? = nil, optional: Bool? = nil) {
        self.capabilityKey = capabilityKey
        self.kind = kind
        self.optional = optional
    }
}

// MARK: - Capability

public struct NexusCapability: Codable, Sendable, Equatable, Identifiable {
    public let id: String
    public let key: String
    public let name: String
    public let description: String?
    public let providerId: String?
    public let adapterId: String?
    public let kind: CapabilityKind?
    public let requiredPermissions: [String]
    public let risk: CapabilityRisk
    public let tags: [String]?
    public let availability: CapabilityAvailability?
    public let dependencies: [NexusCapabilityDependency]?
    public let version: String?

    public init(
        id: String,
        key: String,
        name: String,
        description: String? = nil,
        providerId: String? = nil,
        adapterId: String? = nil,
        kind: CapabilityKind? = nil,
        requiredPermissions: [String] = [],
        risk: CapabilityRisk,
        tags: [String]? = nil,
        availability: CapabilityAvailability? = nil,
        dependencies: [NexusCapabilityDependency]? = nil,
        version: String? = nil
    ) {
        self.id = id
        self.key = key
        self.name = name
        self.description = description
        self.providerId = providerId
        self.adapterId = adapterId
        self.kind = kind
        self.requiredPermissions = requiredPermissions
        self.risk = risk
        self.tags = tags
        self.availability = availability
        self.dependencies = dependencies
        self.version = version
    }

    private enum CodingKeys: String, CodingKey {
        case id, key, name, description, providerId, adapterId, kind
        case requiredPermissions, risk, tags, availability, dependencies, version
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        key = try container.decode(String.self, forKey: .key)
        name = try container.decode(String.self, forKey: .name)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        providerId = try container.decodeIfPresent(String.self, forKey: .providerId)
        adapterId = try container.decodeIfPresent(String.self, forKey: .adapterId)
        kind = try container.decodeIfPresent(CapabilityKind.self, forKey: .kind)
        requiredPermissions = try container.decodeIfPresent([String].self, forKey: .requiredPermissions) ?? []
        risk = try container.decodeIfPresent(CapabilityRisk.self, forKey: .risk) ?? .unknown("unspecified")
        tags = try container.decodeIfPresent([String].self, forKey: .tags)
        availability = try container.decodeIfPresent(CapabilityAvailability.self, forKey: .availability)
        dependencies = try container.decodeIfPresent([NexusCapabilityDependency].self, forKey: .dependencies)
        version = try container.decodeIfPresent(String.self, forKey: .version)
    }
}

public struct NexusCapabilityResponse: Codable, Sendable, Equatable {
    public let capabilities: [NexusCapability]
}

/// Mirrors the server's capability-resolution contract (requested/resolved/missing/unavailable).
/// Not yet called by `NexusClient` — no client method surfaces it. Included for model parity;
/// wiring a client method is a legitimate follow-up, not part of this consolidation.
public struct NexusCapabilityResolution: Codable, Sendable, Equatable {
    public let requested: [String]
    public let resolved: [NexusCapability]
    public let missing: [String]
    public let unavailable: [String]
}

// MARK: - Intent / Plan / Execution

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

// MARK: - Evidence
// Properly typed to match `NexusEvidence` in src/nexus/types.ts, replacing the
// untyped JSONValue blob the client previously decoded evidence into.

public enum EvidenceKind: String, Codable, Sendable, Equatable {
    case event, artifact, decision, audit, knowledge
    case unknown

    public init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = EvidenceKind(rawValue: raw) ?? .unknown
    }
}

public struct NexusEvidence: Codable, Sendable, Equatable, Identifiable {
    public let id: String
    public let executionId: String
    public let type: EvidenceKind
    public let summary: String
    public let payload: JSONValue?
    public let createdAt: String
}

public struct NexusExecutionsResponse: Codable, Sendable, Equatable {
    public let executions: [NexusExecution]
    public let evidence: [NexusEvidence]
}

public struct NexusExecutionResponse: Codable, Sendable, Equatable {
    public let intent: NexusIntentRequest
    public let plan: NexusExecutionPlan
    public let execution: NexusExecution?
    public let evidence: [NexusEvidence]?
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
