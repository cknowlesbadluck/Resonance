# Resonance Plugin / Bridge Matrix

| System | What Resonance should take from it | Boundary | Core dependency? |
|---|---|---|---|
| GitHub | repos, files, branches, PRs, Actions, events | GitHub adapter | No |
| Linear | issues, projects, milestones, decisions | Linear adapter | No |
| Supabase | operational persistence, RLS, events, context | persistence adapter | No |
| Figma | design source/context | Figma adapter | No |
| OpenAI | model intelligence/API capability | model/provider adapter | No |
| Brainbase | external agents and orchestration capability | agent adapter | No |
| Outside Agent | external agents/connectors | agent/connector adapter | No |
| MCP | tools/resources/prompts interoperability | MCP adapter | No |
| Manufact | deployment of Resonance MCP bridge infrastructure | deployment surface | No |
| Descope | authentication/authorization/FGA | identity adapter | No |
| AppDeploy | hosted deployment/QA surface | deployment surface | No |
| Netlify | alternate hosting surface | deployment adapter | No |
| Replit | alternate build/development surface | development surface | No |
| Base44 / Adalo | no-code application surfaces | external application adapter | No |
| Convex | alternative backend/runtime | backend adapter if ever selected | No |

## Rule

A plugin earns a place in Resonance because it exposes a capability, bridge, control surface, verification path, or deployment surface that improves the Nexus. It does not become part of the core domain merely because it is connected.

**Integration without domination.**
