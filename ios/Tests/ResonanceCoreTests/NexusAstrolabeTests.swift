import Testing
@testable import ResonanceCore

struct NexusAstrolabeTests {
    @Test func astrolabeStartsAtNexusAndExposesFourLayers() {
        let astrolabe = NexusAstrolabe()

        #expect(astrolabe.focus == .nexus)
        #expect(astrolabe.layers.map(\.role) == [.intent, .plan, .execution, .evidence])
    }

    @Test func rotationWrapsAroundAFullCircle() {
        var astrolabe = NexusAstrolabe()

        astrolabe.rotate(by: 450)

        #expect(astrolabe.rotation == 90)
    }

    @Test func focusingALayerChangesTheActiveLayer() {
        var astrolabe = NexusAstrolabe()

        astrolabe.focus(.execution)

        #expect(astrolabe.focus == .execution)
    }
}
