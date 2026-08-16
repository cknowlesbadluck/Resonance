# Nexus Proof

## Purpose

This proof demonstrates that Resonance's core model is broader than MCP and independent of Quicksilver.

## Proven path

1. A provider-neutral intent requests `demo.read` and `demo.write`.
2. The capability registry resolves two capabilities.
3. One capability is exposed through an HTTP-style adapter.
4. One capability is exposed through an MCP-style adapter.
5. The composition engine produces a single plan without provider-specific branching in the core.
6. Multiple capabilities produce a Chamber execution mode.
7. The low-risk single-capability path executes directly.
8. Execution emits evidence.
9. High-risk capability selection produces an approval requirement rather than silent execution.

## What this proves

- MCP is a bridge, not the Nexus itself.
- Multiple bridge types can expose the same normalized capability model.
- Chambers are an execution mechanism, not the product boundary.
- Provider selection belongs to composition/adapter layers, not core domain contracts.
- Quicksilver is not required for the Nexus model.

## What this does not claim

The demo adapters are fixtures. They prove the architecture and execution contracts, not production connectivity to external services. Production adapters can be added behind the same interfaces without changing the core Nexus domain.
