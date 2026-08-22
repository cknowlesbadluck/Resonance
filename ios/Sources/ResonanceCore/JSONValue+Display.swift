import Foundation

extension JSONValue: CustomStringConvertible {
    public var description: String {
        prettyPrinted()
    }

    public func prettyPrinted(indent: Int = 0) -> String {
        let pad = String(repeating: "  ", count: indent)
        switch self {
        case .null: return "null"
        case .bool(let value): return value ? "true" : "false"
        case .number(let value): return String(value)
        case .string(let value): return value
        case .array(let values):
            if values.isEmpty { return "[]" }
            let inner = values.map { pad + "  " + $0.prettyPrinted(indent: indent + 1) }.joined(separator: ",\n")
            return "[\n\(inner)\n\(pad)]"
        case .object(let object):
            if object.isEmpty { return "{}" }
            let inner = object.keys.sorted().compactMap { key -> String? in
                guard let value = object[key] else { return nil }
                return "\(pad)  \(key): \(value.prettyPrinted(indent: indent + 1))"
            }.joined(separator: "\n")
            return "{\n\(inner)\n\(pad)}"
        }
    }
}
