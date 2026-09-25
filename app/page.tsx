"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { Activity, ArrowRight, CheckCircle2, CircleAlert, Network, Play, ShieldCheck, Sparkles } from "lucide-react";

type Event = { id: string; source: string; type: string; status: string; created_at: string };
type Capability = { id: string; key: string; name: string; adapterId?: string; risk: string; availability?: string; provenance?: string };
type PlanStep = { id: string; capabilityId: string; adapterId: string; requiresApproval: boolean };
type ExecutionResponse = {
  status?: string;
  error?: string;
  intent?: { id?: string };
  plan?: { id?: string; approvalRequired?: boolean; steps?: PlanStep[]; rationale?: string[] };
  execution?: { id?: string; status?: string; output?: unknown; error?: string; stepOutcomes?: Array<{ stepId: string; ok: boolean; error?: string }> };
  evidence?: Array<{ id: string; summary: string; type: string }>;
};
type Ready = { status?: string; authMode?: string; authModeOk?: boolean; persistenceConfigured?: boolean; githubAdapterConfigured?: boolean; missingRequired?: string[]; production?: boolean };
type History = { source?: string; executions?: Array<{ id: string; status: string; error?: string }>; evidence?: Array<{ id: string; summary: string; type: string }> };

const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_RESONANCE_PROJECT_ID ?? "00000000-0000-4000-8000-000000000001";
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

function badgeClass(availability?: string) {
  if (availability === "available") return "badge ok";
  if (availability === "degraded") return "badge warn";
  return "badge bad";
}

export default function Home() {
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);
  const [events, setEvents] = useState<Event[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [owner, setOwner] = useState(process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "cknowlesbadluck");
  const [repo, setRepo] = useState(process.env.NEXT_PUBLIC_GITHUB_REPO ?? "Resonance");
  const [objective, setObjective] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState<Ready | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execution, setExecution] = useState<ExecutionResponse | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionLabel, setSessionLabel] = useState(supabase ? "signed out" : "auth not configured");

  const selected = capabilities.find((item) => item.key === selectedKey) ?? capabilities.find((item) => item.availability === "available") ?? capabilities[0];

  const load = useCallback(async (activeProject = projectId) => {
    setLoading(true);
    try {
      const token = await accessToken();
      setSessionLabel(token ? "signed in" : supabase ? "signed out" : "auth not configured");
      const headers = authHeaders(token);
      const [eventResponse, capabilityResponse, readyResponse, historyResponse] = await Promise.all([
        fetch(`/api/events?limit=8&projectId=${encodeURIComponent(activeProject)}`, { headers }),
        fetch(`/api/nexus/capabilities?projectId=${encodeURIComponent(activeProject)}`, { headers }),
        fetch("/api/ready"),
        fetch(`/api/nexus/executions?projectId=${encodeURIComponent(activeProject)}`, { headers }),
      ]);
      const eventData = await eventResponse.json().catch(() => ({}));
      const capabilityData = await capabilityResponse.json().catch(() => ({}));
      const readyData = await readyResponse.json().catch(() => ({}));
      const historyData = await historyResponse.json().catch(() => ({}));
      const failures: string[] = [];
      if (!eventResponse.ok) failures.push(`Events: ${errorText(eventData, `HTTP ${eventResponse.status}`)}`);
      if (!capabilityResponse.ok) failures.push(`Capabilities: ${errorText(capabilityData, `HTTP ${capabilityResponse.status}`)}`);
      if (!historyResponse.ok) failures.push(`History: ${errorText(historyData, `HTTP ${historyResponse.status}`)}`);
      setEvents(eventResponse.ok ? eventData.events ?? [] : []);
      setCapabilities(capabilityResponse.ok ? capabilityData.capabilities ?? [] : []);
      setReady(readyData);
      setHistory(historyResponse.ok ? historyData : null);
      setLoadError(failures.length ? failures.join(" · ") : null);
    } catch (error) {
      setEvents([]);
      setCapabilities([]);
      setLoadError(error instanceof Error ? error.message : "Failed to reach the Nexus API.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void load(projectId); }, [load, projectId]);

  function intentBody(capability: Capability) {
    return {
      objective: objective.trim() || `Read ${capability.name}`,
      requestedBy: "web-user",
      projectId,
      requirements: [{ key: capability.key, requiredPermissions: capability.risk === "low" ? ["read"] : ["execute"], maxRisk: capability.risk }],
      metadata: capability.key === "github.repository.read" ? { input: { owner, repo } } : {},
    };
  }

  const hostReady = ready?.status === "ready";

  async function previewPlan() {
    if (!hostReady || !selected || selected.availability !== "available" || previewing) return;
    setPreviewing(true);
    setExecution(null);
    try {
      const token = await accessToken();
      const response = await fetch("/api/nexus/intents", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeaders(token) },
        body: JSON.stringify(intentBody(selected)),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) setExecution({ status: "error", error: errorText(data, `HTTP ${response.status}`) });
      else setExecution(data);
    } catch (error) {
      setExecution({ status: "error", error: error instanceof Error ? error.message : "Plan preview failed" });
    } finally {
      setPreviewing(false);
    }
  }

  async function composeIntent() {
    if (!hostReady || !selected || selected.availability !== "available" || executing) return;
    setExecuting(true);
    const key = idempotencyKey ?? crypto.randomUUID();
    setIdempotencyKey(key);
    try {
      const token = await accessToken();
      const response = await fetch("/api/nexus/executions", {
        method: "POST",
        headers: { "content-type": "application/json", "Idempotency-Key": key, ...authHeaders(token) },
        body: JSON.stringify(intentBody(selected)),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 202 && response.status !== 207) {
        setExecution({ status: "error", error: errorText(data, `HTTP ${response.status}`), ...data });
      } else {
        setExecution({ ...data, status: data.status ?? data.execution?.status ?? "completed" });
      }
      await load();
    } catch (error) {
      setExecution({ status: "error", error: error instanceof Error ? error.message : "Execution failed" });
    } finally {
      setExecuting(false);
    }
  }

  async function resume(approved: boolean) {
    if (!hostReady || !idempotencyKey || executing) return;
    setExecuting(true);
    try {
      const token = await accessToken();
      const response = await fetch(`/api/nexus/executions/${encodeURIComponent(idempotencyKey)}/resume`, {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ projectId, approved }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 207) setExecution({ status: "error", error: errorText(data, `HTTP ${response.status}`), ...data });
      else setExecution({ ...data, status: data.status ?? data.execution?.status ?? (approved ? "completed" : "cancelled") });
      await load();
    } catch (error) {
      setExecution({ status: "error", error: error instanceof Error ? error.message : "Resume failed" });
    } finally {
      setExecuting(false);
    }
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoadError(error ? error.message : null);
    await load();
  }

  const readyLabel = ready?.status === "ready" ? "nexus ready" : "nexus not ready";
  const executionLabel = execution?.status === "approval_required" || execution?.status === "waiting"
    ? "Approval required"
    : execution?.status === "partial" || execution?.execution?.status === "partial"
      ? "Partial — succeeded steps must not be retried"
      : execution?.status === "error" || execution?.status === "failed" || execution?.execution?.status === "failed"
        ? "Execution error"
        : execution?.execution?.status === "completed" || execution?.status === "completed"
          ? "Execution complete"
          : execution?.plan && !execution?.execution
            ? "Plan ready for review"
            : execution?.status ?? "Execution update";

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="orb" /><div><strong>RESONANCE</strong><small>the integration & intelligence nexus</small></div></div>
        <div className="status"><span className={ready?.status === "ready" ? "dot" : "dot bad"} /> {readyLabel}</div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">NEXUS / CONTROL SURFACE</p>
          <h1>Compose only what<br /><span>is actually available.</span></h1>
          <p className="lede">Discover capabilities, review the plan, approve privileged work, and read the evidence. A fixture or unconfigured directory slot stays visibly unavailable.</p>
          {ready?.status !== "ready" && (
            <div className="execution-status">
              <strong>Ready-or-refuse: compose and execute are disabled</strong>
              <small>{ready?.missingRequired?.length ? `Missing ${ready.missingRequired.join(", ")}.` : "Readiness has not been confirmed."} Auth mode: {ready?.authMode ?? "unknown"}{ready?.authModeOk === false ? " (not ok)" : ""}. Persistence: {ready?.persistenceConfigured ? "configured" : "not configured"}. GitHub adapter: {ready?.githubAdapterConfigured ? "configured" : "not configured"}.</small>
            </div>
          )}
          <div className="composer">
            <label>Project<input value={projectId} onChange={(event) => setProjectId(event.target.value)} /></label>
            <label>Objective<input value={objective} placeholder={selected ? `Read ${selected.name}` : "What should Resonance do?"} onChange={(event) => setObjective(event.target.value)} /></label>
            {selected?.key === "github.repository.read" && (
              <div className="split">
                <label>Owner<input value={owner} onChange={(event) => setOwner(event.target.value)} /></label>
                <label>Repository<input value={repo} onChange={(event) => setRepo(event.target.value)} /></label>
              </div>
            )}
          </div>
          <div className="hero-actions">
            <button className="primary" onClick={() => void previewPlan()} disabled={!hostReady || !selected || selected.availability !== "available" || previewing}>
              <Play size={16} /> {!hostReady ? "Host not ready" : previewing ? "Composing…" : "Preview plan"}
            </button>
            <button className="primary" onClick={() => void composeIntent()} disabled={!hostReady || !selected || selected.availability !== "available" || executing || !execution?.plan}>
              {executing ? "Executing…" : !hostReady ? "Execute locked" : "Execute plan"}
            </button>
            <div className="policy-badge"><ShieldCheck size={16} /> {sessionLabel}</div>
          </div>
          {supabase && sessionLabel !== "signed in" && (
            <form className="composer" onSubmit={signIn}>
              <div className="split">
                <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
              </div>
              <button className="primary" type="submit">Sign in</button>
            </form>
          )}
          {loadError && <div className="execution-status"><strong>Nexus fetch error</strong><small>{loadError}</small></div>}
          {execution && (
            <div className="execution-status">
              <strong>{executionLabel}</strong>
              <small>{execution.error ?? execution.execution?.error ?? execution.plan?.rationale?.join(" ") ?? execution.execution?.status ?? execution.status}</small>
              {execution.plan?.steps?.length ? (
                <ul className="plan">
                  {execution.plan.steps.map((step) => <li key={step.id}>{step.capabilityId} via {step.adapterId}{step.requiresApproval ? " · approval required" : ""}</li>)}
                </ul>
              ) : null}
              {(execution.status === "approval_required" || execution.status === "waiting" || execution.execution?.status === "waiting") && (
                <div className="hero-actions">
                  <button className="primary" type="button" onClick={() => void resume(true)} disabled={!hostReady || executing}>Approve and resume</button>
                  <button className="primary" type="button" onClick={() => void resume(false)} disabled={!hostReady || executing}>Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="pulse"><div className="pulse-ring" /><div className="pulse-core"><Network size={30} /><small>NEXUS</small></div></div>
      </section>

      <section className="stats">
        <div className="stat"><span>AVAILABLE</span><strong>{capabilities.filter((capability) => capability.availability === "available").length}</strong><small>configured capabilities</small></div>
        <div className="stat"><span>UNAVAILABLE</span><strong>{capabilities.filter((capability) => capability.availability !== "available").length}</strong><small>visible, not executable</small></div>
        <div className="stat"><span>EVIDENCE</span><strong>{history?.evidence?.length ?? 0}</strong><small>{history?.source ?? "not loaded"}</small></div>
        <div className="stat"><span>EVENTS</span><strong>{events.length}</strong><small>recent observations</small></div>
      </section>

      <section className="section-head"><div><p className="eyebrow">CAPABILITY GRAPH</p><h2>What the ecosystem can do</h2></div><span className="muted">Unavailable capabilities stay visible. Connection is not authority.</span></section>
      <section className="grid integrations">
        {loading && !capabilities.length ? <p className="muted">Loading capabilities…</p> : capabilities.length ? capabilities.map((capability) => (
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
            <div><h3>{capability.name}</h3><p>{capability.key}</p><small>{capability.adapterId ?? capability.provenance ?? "unbound"} · {capability.risk} risk</small></div>
            <span className={badgeClass(capability.availability)}>{capability.availability === "available" ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />} {capability.availability ?? "unknown"}</span>
          </article>
        )) : <div className="empty"><CircleAlert size={20} /><span>No capabilities were returned.</span></div>}
      </section>

      <section className="lower">
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">EVIDENCE</p><h2>Durable results</h2></div><Activity size={19} /></div>
          {history?.evidence?.length ? history.evidence.slice(0, 8).map((item) => <div className="event" key={item.id}><span className="event-dot" /><div><strong>{item.summary}</strong><small>{item.type}</small></div></div>) : <div className="empty"><CircleAlert size={20} /><span>{history?.source === "memory" ? "Only this process can see these records. Production will not serve them." : "No evidence for this project yet."}</span></div>}
          {history?.executions?.length ? history.executions.slice(0, 6).map((item) => <div className="event" key={item.id}><span className="event-dot" /><div><strong>{item.id.slice(0, 8)}</strong><small>{item.error ?? "execution"}</small></div><span className="event-status">{item.status}</span></div>) : null}
        </article>
        <article className="panel architecture">
          <p className="eyebrow">NEXUS MODEL</p><h2>Intent → evidence</h2>
          <div className="flow"><span>Intent</span><ArrowRight size={14} /><span>Plan</span><ArrowRight size={14} /><span>Approve</span></div>
          <div className="flow"><span>Execute</span><ArrowRight size={14} /><span>Evidence</span><ArrowRight size={14} /><span>History</span></div>
          <div className="panel-head"><div><p className="eyebrow">EVENTS</p><h2>Recent observations</h2></div></div>
          {events.length ? events.map((event) => <div className="event" key={event.id}><span className="event-dot" /><div><strong>{event.type}</strong><small>{event.source}</small></div><span className="event-status">{event.status}</span></div>) : <div className="empty"><CircleAlert size={20} /><span>No events for this project yet.</span></div>}
        </article>
      </section>
    </main>
  );
}
