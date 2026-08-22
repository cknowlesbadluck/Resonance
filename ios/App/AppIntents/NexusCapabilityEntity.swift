import AppIntents
import ResonanceCore

struct NexusCapabilityEntity: AppEntity {
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Capability")
    static var defaultQuery = NexusCapabilityEntityQuery()

    var id: String
    var key: String
    var name: String
    var availability: String?

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(
            title: "\(name)",
            subtitle: "\(key) · \(availability ?? "unknown")"
        )
    }

    init(from capability: NexusCapability) {
        self.id = capability.id
        self.key = capability.key
        self.name = capability.name
        self.availability = capability.availability?.rawValue
    }
}

struct NexusCapabilityEntityQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [NexusCapabilityEntity] {
        let all = await fetchAll()
        return all.filter { identifiers.contains($0.id) }
    }

    func suggestedEntities() async throws -> [NexusCapabilityEntity] {
        await fetchAll()
    }

    private func fetchAll() async -> [NexusCapabilityEntity] {
        do {
            let capabilities = try await NexusClientFactory.makeClient().capabilities()
            return capabilities.map(NexusCapabilityEntity.init(from:))
        } catch {
            return []
        }
    }
}

extension NexusCapabilityEntityQuery: EntityStringQuery {
    func entities(matching string: String) async throws -> [NexusCapabilityEntity] {
        let all = await fetchAll()
        let q = string.lowercased()
        return all.filter {
            $0.name.lowercased().contains(q) || $0.key.lowercased().contains(q)
        }
    }
}
