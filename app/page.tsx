"use client";

import { useEffect, useState } from "react";
import { Activity, GitBranch, Globe, Database, MessageSquare, CheckCircle2, CircleAlert, Workflow } from "lucide-react";

type Event = { id: string; source: string; type: string; status: string; created_at: string };

const integrations = [
  { name: "GitHub", icon: GitBranch, desc: "Source control & CI", color: "violet" },
  { name: "Vercel", icon: Globe, desc: "Deployments & runtime", color: "blue" },
  { name: "Supabase", icon: Database, desc: "Data, auth & realtime", color: "emerald" },
  { name: "Linear", icon: Activity, desc: "Projects & execution", color: "amber" },
  { name: "Twilio", icon: MessageSquare, desc: "SMS & voice", color: "rose" },
];

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/events?limit=8").then(r => r.ok ? r.json() : { events: [] }).then(d => setEvents(d.events ?? [])).finally(() => setLoading(false)); }, []);

  return <main className="shell">
    <header className="topbar"><div className="brand"><span className="orb" /> <div><strong>RESONANCE</strong><small>integration plane</small></div></div><div className="status"><span className="dot"/> operational</div></header>
    <section className="hero"><div><p className="eyebrow">NEXUS / CONTROL PLANE</p><h1>Everything connected.<br/><span>Nothing fragmented.</span></h1><p className="lede">One operational surface for source, deployment, data, work, and communication.</p></div><div className="pulse"><div className="pulse-ring"/><div className="pulse-core"><Workflow size={30}/><small>EVENT BUS</small></div></div></section>
    <section className="grid integrations">{integrations.map(({name, icon: Icon, desc}) => <article className="card" key={name}><div className="card-icon"><Icon size={19}/></div><div><h3>{name}</h3><p>{desc}</p></div><span className="connected"><CheckCircle2 size={15}/> ready</span></article>)}</section>
    <section className="lower"><article className="panel"><div className="panel-head"><div><p className="eyebrow">LIVE STREAM</p><h2>Recent events</h2></div><Activity size={19}/></div>{loading ? <p className="muted">Loading event stream…</p> : events.length ? events.map(e => <div className="event" key={e.id}><span className="event-dot"/><div><strong>{e.type}</strong><small>{e.source}</small></div><span className="event-status">{e.status}</span></div>) : <div className="empty"><CircleAlert size={20}/><span>No events yet. The bus is waiting for something interesting to happen.</span></div>}</article>
    <article className="panel architecture"><p className="eyebrow">ORCHESTRATION</p><h2>Signal → Action</h2><div className="flow"><span>GitHub</span><b>→</b><span>Resonance</span><b>→</b><span>Linear</span></div><div className="flow"><span>Vercel</span><b>→</b><span>Event Bus</span><b>→</b><span>Twilio</span></div><div className="flow"><span>Supabase</span><b>→</b><span>Context</span><b>→</b><span>Workflow</span></div></article></section>
  </main>;
}
