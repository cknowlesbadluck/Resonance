import Foundation

public enum NexusLayerRole: String, CaseIterable, Sendable {
    case intent
    case plan
    case execution
    case evidence
}

public enum NexusFocus: String, Sendable {
    case nexus
    case intent
    case plan
    case execution
    case evidence
}

public struct NexusAstrolabeLayer: Equatable, Sendable {
    public let role: NexusLayerRole
    public let title: String
    public let symbol: String

    public init(role: NexusLayerRole, title: String, symbol: String) {
        self.role = role
        self.title = title
        self.symbol = symbol
    }
}

public struct NexusAstrolabe: Sendable {
    public private(set) var rotation: Double = 0
    public private(set) var focus: NexusFocus = .nexus

    public let layers: [NexusAstrolabeLayer] = [
        .init(role: .intent, title: "Intent", symbol: "sparkles"),
        .init(role: .plan, title: "Plan", symbol: "point.3.connected.trianglepath.dotted"),
        .init(role: .execution, title: "Execution", symbol: "bolt.fill"),
        .init(role: .evidence, title: "Evidence", symbol: "checkmark.seal.fill")
    ]

    public init() {}

    public mutating func rotate(by degrees: Double) {
        rotation = (rotation + degrees).truncatingRemainder(dividingBy: 360)
        if rotation < 0 { rotation += 360 }
    }

    public mutating func focus(_ layer: NexusFocus) {
        focus = layer
    }
}
