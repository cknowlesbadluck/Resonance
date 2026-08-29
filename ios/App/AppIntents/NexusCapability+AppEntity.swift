import AppIntents
import ResonanceCore

extension NexusCapability: AppEntity {
    public static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Capability")
    public static var defaultQuery = NexusCapabilityQuery()

    public var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(
            title: "\(name)",
            subtitle: "\(key) · \(availability?.rawValue ?? "unknown")"
        )
    }
}

public struct NexusCapabilityQuery: EntityQuery {
    public init() {}

    public func entities(for identifiers: [String]) async throws -> [NexusCapability] {
        let all = try await fetchAll()
        return all.filter { identifiers.contains($0.id) }
    }

    public func suggestedEntities() async throws -> [NexusCapability] {
        try await fetchAll()
    }

    private func fetchAll() async throws -> [NexusCapability] {
        // The Intent framework resolves global capabilities if we don't know the intent's projectId.
        // We pull the project ID from UserDefaults, falling back to 'demo'.
        let projectId = UserDefaults.standard.string(forKey: "RESONANCE_PROJECT_ID") ?? "demo"
        let client = NexusClientFactory.makeClient(projectId: projectId)
        return try await client.capabilities()
    }
}

extension NexusCapabilityQuery: EntityStringQuery {
    public func entities(matching string: String) async throws -> [NexusCapability] {
        let all = try await fetchAll()
        let q = string.lowercased()
        return all.filter {
            $0.name.lowercased().contains(q) || $0.key.lowercased().contains(q)
        }
    }
}
