import Foundation

public enum CapabilityKind: String, Codable, Sendable {
    case skill
    case tool
    case integration
}

public enum CapabilityStatus: String, Codable, Sendable {
    case available
    case degraded
    case unavailable
    case planned
}

public struct CapabilityDependency: Codable, Hashable, Sendable {
    public let id: String
    public let kind: CapabilityKind
    public let optional: Bool

    public init(id: String, kind: CapabilityKind, optional: Bool = false) {
        self.id = id
        self.kind = kind
        self.optional = optional
    }
}

public struct Capability: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let description: String
    public let kind: CapabilityKind
    public let provider: String
    public let version: String
    public let status: CapabilityStatus
    public let permissions: [String]
    public let dependencies: [CapabilityDependency]
    public let tags: [String]

    public init(id: String, name: String, description: String, kind: CapabilityKind, provider: String, version: String, status: CapabilityStatus, permissions: [String] = [], dependencies: [CapabilityDependency] = [], tags: [String] = []) {
        self.id = id
        self.name = name
        self.description = description
        self.kind = kind
        self.provider = provider
        self.version = version
        self.status = status
        self.permissions = permissions
        self.dependencies = dependencies
        self.tags = tags
    }

    private enum CodingKeys: String, CodingKey {
        case id, name, description, kind, provider, version, status, permissions, dependencies, tags
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        description = try container.decode(String.self, forKey: .description)
        kind = try container.decode(CapabilityKind.self, forKey: .kind)
        provider = try container.decode(String.self, forKey: .provider)
        version = try container.decode(String.self, forKey: .version)
        status = try container.decode(CapabilityStatus.self, forKey: .status)
        permissions = try container.decodeIfPresent([String].self, forKey: .permissions) ?? []
        dependencies = try container.decodeIfPresent([CapabilityDependency].self, forKey: .dependencies) ?? []
        tags = try container.decodeIfPresent([String].self, forKey: .tags) ?? []
    }
}

public struct CapabilityResolution: Codable, Sendable {
    public let requested: [String]
    public let resolved: [Capability]
    public let missing: [String]
    public let unavailable: [String]
}
