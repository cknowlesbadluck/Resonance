import AppIntents
import ResonanceCore

extension NexusCapability: AppEntity {
    public static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Capability")
    public static var defaultQuery = NexusCapabilityQuery()

    public var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(
            title: "\(name)",
            subtitle: "\(key) · \(availability?.rawValue ?? "unknown")"
        )
    }
}

struct NexusCapabilityQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [NexusCapability] {
        let all = try await fetchAll()
        return all.filter { identifiers.contains($0.id) }
    }

    func suggestedEntities() async throws -> [NexusCapability] {
        try await fetchAll()
    }

    private func fetchAll() async throws -> [NexusCapability] {
        let client = NexusClientFactory.makeClient()
        return try await client.capabilities()
    }
}

extension NexusCapabilityQuery: EntityStringQuery {
    func entities(matching string: String) async throws -> [NexusCapability] {
        let all = try await fetchAll()
        let q = string.lowercased()
        return all.filter {
            $0.name.lowercased().contains(q) || $0.key.lowercased().contains(q)
        }
    }
}
