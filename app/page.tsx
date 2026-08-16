"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowRight, Bot, CheckCircle2, CircleAlert, Network, Play, ShieldCheck, Sparkles, Workflow } from "lucide-react";

type Event = { id: string; source: string; type: string; status: string; created_at: string };
type Capability = { id: string; key: string; name: string; adapterId?: string; risk: string; availability?: string; provenance?: string };

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/events?limit=8").then((r) => r.ok ? r.json() : { events: [] }),
      fetch("/api/nexus/capabilities").then((r) => r.ok ? r.json() : { capabilities: [] }),
    ]).then(([eventData, capabilityData]) => { setEvents(eventData.events ?? []); setCapabilities(capabilityData.capabilities ?? []); }).finally(() => setLoading(false));
  }, []);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="orb" /><div><strong>RESONANCE</strong><small>the integration & intelligence nexus</small></div></div>
        <div className="status"><span className="dot" /> nexus online</div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">NEXUS / FOUNDATION</p>
          <h1>Bridge the ecosystem.<br /><span>Amplify the whole.</span></h1>
          <p className="lede">Resonance connects AI, agents, skills, tools, connectors, plugins, applications, resources, and people without forcing them into one provider or runtime.</p>
          <div className="hero-actions"><button className="primary"><Play size={16} /> Compose intent</button><button className="secondary"><ShieldCheck size={16} /> Policy</button></div>
        </div>
        <div className="pulse"><div className="pulse-ring" /><div className="pulse-core"><Network size={30} /><small>NEXUS</small></div></div>
      </section>

      <section className="stats">
        <div className="stat"><span>CAPABILITIES</span><strong>{capabilities.length}</strong><small>normalized surfaces</small></div>
        <div className="stat"><span>BRIDGES</span><strong>{new Set(capabilities.map((c) => c.adapterId)).size}</strong><small>adapter paths</small></div>
        <div className="stat"><span>EVENTS</span><strong>{events.length}</strong><small>recent observations</small></div>
        <div className="stat"><span>PRINCIPLE</span><strong>1</strong><small>integration without domination</small></div>
      </section>

      <section className="section-head"><div><p className="eyebrow">CAPABILITY GRAPH</p><h2>What the ecosystem can do</h2></div><span className="muted">Provider-neutral contracts. Explicit authority.</span></section>
      <section className="grid integrations">
        {capabilities.map((capability) => <article className="card" key={capability.id}>
          <div className="card-icon"><Sparkles size={19} /></div>
          <div><h3>{capability.name}</h3><p>{capability.key}</p><small>{capability.adapterId ?? "unbound"} · {capability.risk} risk</small></div>
          <span className="connected"><CheckCircle2 size={15} /> {capability.availability ?? "available"}</span>
        </article>)}
      </section>

      <section className="lower">
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">LIVE STREAM</p><h2>Recent events</h2></div><Activity size={19} /></div>
          {loading ? <p className="muted">Loading nexus stream…</p> : events.length ? events.map((event) => <div className="event" key={event.id}><span className="event-dot" /><div><strong>{event.type}</strong><small>{event.source}</small></div><span className="event-status">{event.status}</span></div>) : <div className="empty"><CircleAlert size={20} /><span>No external events yet. The nexus is ready for a bridge.</span></div>}
        </article>
        <article className="panel architecture">
          <p className="eyebrow">NEXUS MODEL</p><h2>Intent → cooperation</h2>
          <div className="flow"><span>Intent</span><ArrowRight size={14} /><span>Discover</span><ArrowRight size={14} /><span>Compose</span></div>
          <div className="flow"><span>Context</span><ArrowRight size={14} /><span>Policy</span><ArrowRight size={14} /><span>Execute</span></div>
          <div className="flow"><span>Evidence</span><ArrowRight size={14} /><span>Knowledge</span><ArrowRight size={14} /><span>Continue</span></div>
          <div className="callout"><ShieldCheck size={17} /><span>Resonance coordinates connected systems; it does not own them.</span></div>
        </article>
      </section>
    </main>
  );
}
