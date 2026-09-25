import Foundation

/// A raw Nexus HTTP response, preserving the status code alongside the body.
///
/// The transport previously collapsed every non-2xx response into a thrown error and
/// discarded the body. That silently destroyed information the control plane deliberately
/// returns: a failed execution comes back as `422` with a complete
/// `{intent, plan, execution, evidence}` envelope, so the old client could report *that*
/// an execution failed but never *why*, and never surfaced its evidence.
public struct NexusHTTPResponse: Sendable, Equatable {
    public let status: Int
    public let data: Data

    public init(status: Int, data: Data) {
        self.status = status
        self.data = data
    }

    public var isSuccess: Bool { (200..<300).contains(status) }
}

/// The `{ "error": "..." }` envelope every Nexus route returns on failure.
struct NexusServerErrorBody: Decodable {
    let error: String?
}

func nexusServerMessage(from data: Data) -> String? {
    guard !data.isEmpty else { return nil }
    if let decoded = try? JSONDecoder().decode(NexusServerErrorBody.self, from: data), let message = decoded.error {
        return message
    }
    return String(data: data, encoding: .utf8).flatMap { $0.isEmpty ? nil : $0 }
}
