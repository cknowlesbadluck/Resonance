import Foundation
import ResonanceCore

/// Input validation shared by the Nexus App Intents.
///
/// There is deliberately no `"demo"` project default: the control plane rejects any
/// non-UUID project id, so a placeholder guaranteed a failure on every run.
enum NexusIntentValidation {
    enum ProjectResolution: Equatable {
        case resolved(String)
        /// Nothing was entered and nothing is configured — prompt for a value.
        case missing
        /// The user entered something that is not a project UUID — re-prompt.
        case invalid(String)
    }

    /// Explicit parameter → configured project (`RESONANCE_PROJECT_ID` env / UserDefaults).
    static func resolveProject(_ entered: String?) -> ProjectResolution {
        let trimmed = entered?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !trimmed.isEmpty {
            return NexusProjectID.isValid(trimmed) ? .resolved(trimmed) : .invalid(trimmed)
        }
        if let configured = NexusClientFactory.resolveProjectId(nil) {
            return .resolved(configured)
        }
        return .missing
    }

    /// A non-empty requirement list, or `nil` when no capability key is available.
    /// The API rejects an empty `requirements` array, so callers must prompt instead.
    static func requirements(for capability: NexusCapabilityEntity?) -> [NexusCapabilityRequirement]? {
        guard let key = capability?.key.trimmingCharacters(in: .whitespacesAndNewlines), !key.isEmpty else {
            return nil
        }
        return [NexusCapabilityRequirement(key: key)]
    }

    static func trimmedObjective(_ objective: String) -> String? {
        let trimmed = objective.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
