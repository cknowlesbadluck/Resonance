"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  CircleAlert,
  Database,
  GitBranch,
  Layers3,
  Network,
  Play,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { initialAgents, initialSkills, resonanceIntegrations } from "../lib/domain";

type Event = { id: string; source: string; type: string; status: string; created_at: string };

const icons = {
  github: GitBranch,
  supabase: Database,
  linear: Activity,
  figma: Layers3,
  openai: Sparkles,
  brainbase: Bot,
  mcp: Network,
} as const;

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events?limit=8")
      .then((response) => (response.ok ? response.json() : { events: [] }))
      .then((data) => setEvents(data.events ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="orb" />
          <div><strong>RESONANCE</strong><small>integration & orchestration plane</small></div>
        </div>
        <div className="status"><span className="dot" /> foundation online</div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">CONTROL PLANE / FOUNDATION</p>
          <h1>Connect the tools.<br /><span>Orchestrate the work.</span></h1>
          <p className="lede">A provider-neutral control plane for agents, skills, MCP tools, integrations, workflows, approvals, and auditable runs.</p>
          <div className="hero-actions">
            <button className="primary"><Play size={16} /> New workflow</button>
            <button className="secondary"><ShieldCheck size={16} /> Permissions</button>
          </div>
        </div>
        <div className="pulse"><div className="pulse-ring" /><div className="pulse-core"><Workflow size={30} /><small>WORKFLOW BUS</small></div></div>
      </section>

      <section className="stats">
        <div className="stat"><span>INTEGRATIONS</span><strong>{resonanceIntegrations.length}</strong><small>provider surfaces</small></div>
        <div className="stat"><span>AGENT ROLES</span><strong>{initialAgents.length}</strong><small>specialists planned</small></div>
        <div className="stat"><span>SKILLS</span><strong>{initialSkills.length}</strong><small>reusable capabilities</small></div>
        <div className="stat"><span>RUNS</span><strong>{events.length}</strong><small>recent events observed</small></div>
      </section>

      <section className="section-head"><div><p className="eyebrow">INTEGRATION REGISTRY</p><h2>Connected capability map</h2></div><span className="muted">Explicit capabilities. Explicit permissions.</span></section>
      <section className="grid integrations">
        {resonanceIntegrations.map((integration) => {
          const Icon = icons[integration.key];
          return <article className="card" key={integration.key}>
            <div className="card-icon"><Icon size={19} /></div>
            <div><h3>{integration.name}</h3><p>{integration.description}</p><small>{integration.category}</small></div>
            <span className="connected"><CheckCircle2 size={15} /> registered</span>
          </article>;
        })}
      </section>

      <section className="lower">
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">LIVE STREAM</p><h2>Recent events</h2></div><Activity size={19} /></div>
          {loading ? <p className="muted">Loading event stream…</p> : events.length ? events.map((event) => <div className="event" key={event.id}><span className="event-dot" /><div><strong>{event.type}</strong><small>{event.source}</small></div><span className="event-status">{event.status}</span></div>) : <div className="empty"><CircleAlert size={20} /><span>No events yet. The bus is waiting for the first workflow.</span></div>}
        </article>
        <article className="panel architecture">
          <p className="eyebrow">EXECUTION MODEL</p><h2>Request → Result</h2>
          <div className="flow"><span>Request</span><b>→</b><span>Planner</span><b>→</b><span>Agent</span></div>
          <div className="flow"><span>Skill</span><b>→</b><span>MCP / Tool</span><b>→</b><span>Validation</span></div>
          <div className="flow"><span>Approval</span><b>→</b><span>Run</span><b>→</b><span>Audit</span></div>
          <div className="callout"><ShieldCheck size={17} /><span>Destructive and production actions stay behind explicit policy gates.</span></div>
        </article>
      </section>
    </main>
  );
}
