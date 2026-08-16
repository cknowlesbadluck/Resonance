import Foundation

public struct NexusCapability: Codable, Identifiable, Sendable, Hashable {
    public let id: String
    public let name: String
    public let description: String?
    public let provider: String?
    public let version: String?
    public let available: Bool?
    public init(id: String, name: String, description: String? = nil, provider: String? = nil, version: String? = nil, available: Bool? = nil) { self.id = id; self.name = name; self.description = description; self.provider = provider; self.version = version; self.available = available }
}
public struct NexusExecution: Codable, Identifiable, Sendable, Hashable { public let id: String; public let status: String; public let mode: String?; public init(id: String, status: String, mode: String? = nil) { self.id=id; self.status=status; self.mode=mode } }
public struct NexusEvidence: Codable, Identifiable, Sendable, Hashable { public let id: String; public let executionId: String?; public let capabilityId: String?; public let eventType: String?; public let payload: [String:String]?; public init(id:String, executionId:String?=nil, capabilityId:String?=nil, eventType:String?=nil, payload:[String:String]?=nil){self.id=id;self.executionId=executionId;self.capabilityId=capabilityId;self.eventType=eventType;self.payload=payload} }
public struct IntentRequirement: Codable, Sendable, Hashable { public let key: String; public init(key:String){self.key=key} }
public struct IntentRequest: Codable, Sendable, Hashable { public let projectId:String; public let objective:String; public let requirements:[IntentRequirement]; public let contextRefs:[String]; public init(projectId:String, objective:String, requirements:[IntentRequirement], contextRefs:[String]=[]){self.projectId=projectId;self.objective=objective;self.requirements=requirements;self.contextRefs=contextRefs} }
public struct NexusExecutionResponse: Codable, Sendable, Hashable { public let execution:NexusExecution?; public let idempotentReplay:Bool?; public let status:String?; public let evidence:[NexusEvidence]?; public init(execution:NexusExecution?=nil,idempotentReplay:Bool?=nil,status:String?=nil,evidence:[NexusEvidence]?=nil){self.execution=execution;self.idempotentReplay=idempotentReplay;self.status=status;self.evidence=evidence} }
public struct NexusError: Codable, Error, Sendable, Hashable { public let message:String; public init(message:String){self.message=message} }
