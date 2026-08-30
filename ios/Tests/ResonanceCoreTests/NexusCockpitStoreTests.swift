import Testing
@testable import ResonanceCore

// Tests for NexusCockpitStore — verifies state transitions without touching
// the network. Uses the existing StubTransport pattern from NexusClientTests.

@MainActor
struct NexusCockpitStoreTests {

    // MARK: - Helpers

    private static func makeStore(
        capabilitiesPayload: String? = nil,
        executePayload: String? = nil
    ) -> NexusCockpitStore {
        let capData = (capabilitiesPayload ?? #"{"capabilities":[]}"#).data(using: .utf8)!
        let execData = (executePayload ?? executionPayload()).data(using: .utf8)!
        let transport = StubTransport(getData: capData, postData: execData)
        let client = NexusClient(transport: transport)
        return NexusCockpitStore(client: client)
    }

    private static func executionPayload(status: String = "completed") -> String {
        #"{"intent":{"id":"i1","projectId":"demo","objective":"Test","requestedBy":"ios-user","requirements":[],"contextRefs":[]},"plan":{"id":"p1","intentId":"i1","projectId":"demo","actorId":"ios-user","mode":"direct","steps":[],"contextRefs":[],"approvalRequired":false,"rationale":[]},"execution":{"id":"e1","planId":"p1","status":"\#(status)"},"evidence":[{"id":"ev1","executionId":"e1","type":"event","summary":"Done","createdAt":"2026-08-30T00:00:00Z"}],"status":"\#(status)"}"#
    }

    // MARK: - Tests

    @Test func idleStateOnInit() {
        let store = Self.makeStore()
        #expect(store.executionState == .idle)
        #expect(store.evidence.isEmpty)
    }

    @Test func emptyObjectiveFailsImmediately() async {
        let store = Self.makeStore()
        store.objective = "   "
        await store.composeAndExecute()
        if case .failed(let msg) = store.executionState {
            #expect(msg.contains("empty"))
        } else {
            Issue.record("Expected .failed for blank objective")
        }
    }

    @Test func successfulExecutionPopulatesEvidence() async {
        let store = Self.makeStore()
        store.objective = "Test objective"
        await store.composeAndExecute()

        if case .completed = store.executionState {
            #expect(store.evidence.count == 1)
            #expect(store.evidence[0].summary == "Done")
        } else {
            Issue.record("Expected .completed, got \(store.executionState)")
        }
    }

    @Test func approvalRequiredTransitionsToAwaitingApproval() async {
        let store = Self.makeStore(executePayload: Self.executionPayload(status: "approval_required"))
        store.objective = "Needs approval"
        await store.composeAndExecute()

        if case .awaitingApproval = store.executionState {
            // correct
        } else {
            Issue.record("Expected .awaitingApproval, got \(store.executionState)")
        }
    }

    @Test func resetClearsAllState() async {
        let store = Self.makeStore()
        store.objective = "Will be reset"
        await store.composeAndExecute()
        store.resetExecution()

        #expect(store.executionState == .idle)
        #expect(store.evidence.isEmpty)
        #expect(store.objective.isEmpty)
        #expect(store.selectedCapabilityKey.isEmpty)
    }

    @Test func loadCapabilitiesPopulatesStore() async {
        let payload = #"{"capabilities":[{"id":"c1","key":"demo.read","name":"Demo Read","risk":"low"}]}"#
        let store = Self.makeStore(capabilitiesPayload: payload)
        await store.loadCapabilities()
        #expect(store.capabilities.count == 1)
        #expect(store.capabilities[0].key == "demo.read")
        #expect(store.capabilitiesError == nil)
    }
}

// MARK: - Stub Transport (mirrors NexusClientTests pattern)

private struct StubTransport: NexusTransport {
    let getData: Data
    let postData: Data

    func get(_ path: String, headers: NexusRequestHeaders) async throws -> Data { getData }
    func post(_ path: String, body: Data, headers: NexusRequestHeaders) async throws -> Data { postData }
}
