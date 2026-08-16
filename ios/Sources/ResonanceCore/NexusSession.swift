import Foundation

public struct NexusConnection: Sendable, Equatable {
    public let baseURL: URL
    public let projectId: String
    public let bearerToken: String
    public init(baseURL: URL, projectId: String, bearerToken: String) { self.baseURL = baseURL; self.projectId = projectId; self.bearerToken = bearerToken }
}

public actor NexusSession {
    public enum State: Sendable, Equatable { case disconnected, connecting, connected, failed(String) }
    private let api: NexusAPI
    private(set) var state: State = .disconnected
    public init(connection: NexusConnection, session: URLSession = .shared) {
        self.api = NexusAPI(baseURL: connection.baseURL, bearerToken: connection.bearerToken, session: session)
    }
    public func connect(projectId: String) async {
        state = .connecting
        do { _ = try await api.capabilities(projectId: projectId); state = .connected }
        catch { state = .failed(error.localizedDescription) }
    }
    public func capabilities(projectId: String) async throws -> [NexusCapability] { try await api.capabilities(projectId: projectId) }
    public func executions(projectId: String) async throws -> [NexusExecution] { try await api.executions(projectId: projectId) }
    public func submit(projectId: String, objective: String, requirements: [String], idempotencyKey: String = UUID().uuidString) async throws -> NexusExecutionResponse {
        let request = IntentRequest(projectId: projectId, objective: objective, requirements: requirements.map(IntentRequirement.init(key:)))
        return try await api.submitIntent(request, idempotencyKey: idempotencyKey)
    }
}
