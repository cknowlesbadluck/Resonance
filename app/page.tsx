"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Activity, ArrowRight, CheckCircle2, CircleAlert, Network, Play, ShieldCheck, Sparkles } from "lucide-react";

type Event = { id: string; source: string; type: string; status: string; created_at: string };
type Capability = { id: string; key: string; name: string; adapterId?: string; risk: string; availability?: string; provenance?: string };
type ExecutionResponse = {
  status?: string;
  error?: string;
  execution?: { status?: string; output?: unknown; error?: string };
};

const PROJECT_ID = process.env.NEXT_PUBLIC_RESONANCE_PROJECT_ID ?? "00000000-0000-4000-8000-000000000001";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errorText(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const error = (payload as { error?: unknown }).error;
  return typeof error === "string" && error.trim() ? error : fallback;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [execution, setExecution] = useState<ExecutionResponse | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = await accessToken();
      const headers = authHeaders(token);
      const [eventResponse, capabilityResponse] = await Promise.all([
        fetch(`/api/events?limit=8&projectId=${encodeURIComponent(PROJECT_ID)}`, { headers }),
        fetch(`/api/nexus/capabilities?projectId=${encodeURIComponent(PROJECT_ID)}`, { headers }),
      ]);
      const eventData = await eventResponse.json().catch(() => ({}));
      const capabilityData = await capabilityResponse.json().catch(() => ({}));
      const failures: string[] = [];
      if (!eventResponse.ok) failures.push(`Events: ${errorText(eventData, `HTTP ${eventResponse.status}`)}`);
      if (!capabilityResponse.ok) failures.push(`Capabilities: ${errorText(capabilityData, `HTTP ${capabilityResponse.status}`)}`);
      setEvents(eventResponse.ok ? eventData.events ?? [] : []);
      setCapabilities(capabilityResponse.ok ? capabilityData.capabilities ?? [] : []);
      setLoadError(failures.length ? failures.join(" · ") : null);
    } catch (error) {
      setEvents([]);
      setCapabilities([]);
      setLoadError(error instanceof Error ? error.message : "Failed to reach the Nexus API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function composeIntent(capability = capabilities.find((item) => item.key === selectedKey) ?? capabilities[0]) {
    if (!capability || executing) return;
    setExecuting(true);
    setExecution(null);
    try {
      const token = await accessToken();
      const response = await fetch("/api/nexus/executions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
          ...authHeaders(token),
        },
        body: JSON.stringify({
          objective: `Demonstrate ${capability.name}`,
          requestedBy: "web-user",
          projectId: PROJECT_ID,
          requirements: [{ key: capability.key, requiredPermissions: capability.risk === "low" ? ["read"] : ["execute"], maxRisk: capability.risk }],
          metadata: {
            input: capability.key === "github.repository.read"
              ? {
                  owner: process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "cknowlesbadluck",
                  repo: process.env.NEXT_PUBLIC_GITHUB_REPO ?? "Resonance",
                }
              : {},
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 202) {
        setExecution({ status: "error", error: errorText(data, `HTTP ${response.status}`), execution: { error: errorText(data, "Execution failed") } });
      } else {
        setExecution({ ...data, status: data.status ?? data.execution?.status ?? (response.ok ? "completed" : "error") });
      }
      await load();
    } catch (error) {
      setExecution({ status: "error", execution: { error: error instanceof Error ? error.message : "Execution failed" } });
    } finally {
      setExecuting(false);
    }
  }

  const selected = capabilities.find((item) => item.key === selectedKey) ?? capabilities[0];
  const executionLabel = execution?.status === "approval_required"
    ? "Approval required"
    : execution?.status === "waiting"
      ? "Waiting for approval"
      : execution?.status === "error" || execution?.status === "failed"
        ? "Execution error"
        : execution?.status === "completed"
          ? "Execution complete"
          : execution?.status ?? "Execution update";

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
          <div className="hero-actions">
            <button className="primary" onClick={() => void composeIntent(selected)} disabled={!selected || executing}>
              <Play size={16} /> {executing ? "Executing…" : selected ? `Compose ${selected.name}` : "Compose intent"}
            </button>
            <div className="policy-badge"><ShieldCheck size={16} /> policy boundary active</div>
          </div>
          {loadError && (
            <div className="execution-status">
              <strong>Nexus fetch error</strong>
              <small>{loadError}</small>
            </div>
          )}
          {execution && (
            <div className="execution-status">
              <strong>{executionLabel}</strong>
              <small>{execution.error ?? execution.execution?.error ?? execution.execution?.status ?? execution.status}</small>
            </div>
          )}
        </div>
        <div className="pulse"><div className="pulse-ring" /><div className="pulse-core"><Network size={30} /><small>NEXUS</small></div></div>
      </section>

      <section className="stats">
        <div className="stat"><span>CAPABILITIES</span><strong>{capabilities.length}</strong><small>normalized surfaces</small></div>
        <div className="stat"><span>BRIDGES</span><strong>{new Set(capabilities.map((c) => c.adapterId).filter(Boolean)).size}</strong><small>adapter paths</small></div>
        <div className="stat"><span>EVENTS</span><strong>{events.length}</strong><small>recent observations</small></div>
        <div className="stat"><span>PRINCIPLE</span><strong>1</strong><small>integration without domination</small></div>
      </section>

      <section className="section-head"><div><p className="eyebrow">CAPABILITY GRAPH</p><h2>What the ecosystem can do</h2></div><span className="muted">Select a capability, then compose. Connection is not authority.</span></section>
      <section className="grid integrations">
        {capabilities.map((capability) => (
          <article
            className="card"
            key={capability.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedKey(capability.key)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedKey(capability.key); } }}
            style={selected?.id === capability.id ? { borderColor: "#53e0b4" } : undefined}
          >
            <div className="card-icon"><Sparkles size={19} /></div>
            <div><h3>{capability.name}</h3><p>{capability.key}</p><small>{capability.adapterId ?? "unbound"} · {capability.risk} risk</small></div>
            <span className="connected"><CheckCircle2 size={15} /> {capability.availability ?? "available"}</span>
          </article>
        ))}
      </section>

      <section className="lower">
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">LIVE STREAM</p><h2>Recent events</h2></div><Activity size={19} /></div>
          {loading ? <p className="muted">Loading nexus stream…</p> : loadError && !events.length ? <div className="empty"><CircleAlert size={20} /><span>{loadError}</span></div> : events.length ? events.map((event) => <div className="event" key={event.id}><span className="event-dot" /><div><strong>{event.type}</strong><small>{event.source}</small></div><span className="event-status">{event.status}</span></div>) : <div className="empty"><CircleAlert size={20} /><span>No external events yet. The nexus is ready for a bridge.</span></div>}
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
