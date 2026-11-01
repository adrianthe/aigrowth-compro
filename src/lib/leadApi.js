import { isSupabaseConfigured, supabase } from './supabaseClient';
import { getAttribution, getClientIds } from './tracking';

// Sends a checkout or freebie form to /api/lead (a Vercel function)
export async function submitLead({ type, slug, name, email, whatsapp, website, eventId }) {
  const response = await fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      slug,
      name,
      email,
      whatsapp,
      website,
      eventId,
      attribution: getAttribution(),
      client: getClientIds(),
      path: window.location.pathname,
      url: window.location.href,
      referrer: document.referrer,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Gagal mengirim data. Coba lagi sebentar.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function newEventId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function fetchLeads({ kind, status } = {}) {
  if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
  let query = supabase
    .from('leads')
    .select('id, kind, name, email, whatsapp, status, utm, amount, paid_at, created_at, content:content_items(id, title, type)')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (kind) query = query.eq('kind', kind);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function deleteLead(id) {
  if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPayments() {
  if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase
    .from('mayar_payments')
    .select('transaction_id, email, name, mobile, amount, lead_id, created_at, content:content_items(id, title)')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data;
}
