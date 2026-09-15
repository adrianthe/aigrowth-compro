import { isSupabaseConfigured, supabase } from './supabaseClient';

const SESSION_KEY = 'aigrowth_traffic_session';

function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export async function trackTrafficEvent(eventType, details = {}) {
  if (!isSupabaseConfigured || import.meta.env.DEV) return;

  const payload = {
    event_type: eventType,
    page_path: String(details.pagePath || window.location.pathname).slice(0, 500),
    destination_url: details.destinationUrl ? String(details.destinationUrl).slice(0, 1500) : null,
    referrer: document.referrer ? document.referrer.slice(0, 1500) : null,
    session_id: getSessionId(),
  };

  await supabase.from('traffic_events').insert(payload);
}
