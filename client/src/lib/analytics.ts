type EventProps = Record<string, string | number | boolean | null | undefined>;

type QueuedEvent = {
  name: string;
  props?: EventProps;
  ts: string;
  path: string;
  sessionId: string;
};

const SESSION_KEY = "nc_session_id";
const EVENTS_KEY = "nc_event_log";
const MAX_EVENTS = 200;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getSessionId() {
  if (!canUseStorage()) return "server";
  let sessionId = window.localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto?.randomUUID?.() ?? `nc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function trackEvent(name: string, props?: EventProps) {
  if (typeof window === "undefined") return;

  const event: QueuedEvent = {
    name,
    props,
    ts: new Date().toISOString(),
    path: window.location.pathname,
    sessionId: getSessionId(),
  };

  try {
    const current = canUseStorage() ? JSON.parse(window.localStorage.getItem(EVENTS_KEY) || "[]") : [];
    const next = [...current, event].slice(-MAX_EVENTS);
    if (canUseStorage()) window.localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
  } catch {
    // noop
  }

  // Easy future handoff to Segment/PostHog/Amplitude/etc.
  if ((window as any).plausible) {
    (window as any).plausible(name, { props });
  }

  if (import.meta.env.DEV) {
    console.debug("[NetCheck analytics]", event);
  }
}

export function getTrackedEvents(): QueuedEvent[] {
  if (!canUseStorage()) return [];
  try {
    return JSON.parse(window.localStorage.getItem(EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}
