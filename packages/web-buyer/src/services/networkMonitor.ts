export type ConnectionQuality = "online" | "degraded" | "offline";

export interface ConnectionState {
  quality: ConnectionQuality;
  latencyMs: number | null;
  lastChangedAt: number;
}

type Listener = (state: ConnectionState) => void;

const HEALTH_CHECK_URL = "/api/health";
const HEALTH_CHECK_INTERVAL = 30_000;
const DEGRADED_THRESHOLD = 2000;

let state: ConnectionState = {
  quality: navigator.onLine ? "online" : "offline",
  latencyMs: null,
  lastChangedAt: Date.now(),
};

const listeners = new Set<Listener>();

function notify() {
  for (const fn of listeners) {
    try { fn(state); } catch { /* guard */ }
  }
}

function setQuality(q: ConnectionQuality, latency?: number) {
  if (state.quality === q && latency === undefined) return;
  state = { quality: q, latencyMs: latency ?? state.latencyMs, lastChangedAt: Date.now() };
  notify();
}

async function probeLatency(): Promise<number | null> {
  const start = performance.now();
  try {
    const resp = await fetch(HEALTH_CHECK_URL, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    return Math.round(performance.now() - start);
  } catch {
    return null;
  }
}

let healthCheckTimer: ReturnType<typeof setInterval> | null = null;

async function runHealthCheck() {
  const latency = await probeLatency();
  if (latency === null) {
    setQuality(navigator.onLine ? "degraded" : "offline");
    return;
  }
  setQuality(latency > DEGRADED_THRESHOLD ? "degraded" : "online", latency);
}

function onOnline() {
  runHealthCheck();
}

function onOffline() {
  setQuality("offline");
}

function startHealthChecks() {
  if (healthCheckTimer) return;
  healthCheckTimer = setInterval(runHealthCheck, HEALTH_CHECK_INTERVAL);
}

function stopHealthChecks() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  fn(state);
  return () => { listeners.delete(fn); };
}

export function getState(): ConnectionState {
  return state;
}

export function start() {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  startHealthChecks();
  if (navigator.onLine) runHealthCheck();
}

export function stop() {
  window.removeEventListener("online", onOnline);
  window.removeEventListener("offline", onOffline);
  stopHealthChecks();
}

export function forceCheck() {
  runHealthCheck();
}
