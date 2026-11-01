// Shared helpers for the Vercel functions in /api (files starting with _ are not routes).
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

let adminClient = null;

// Service-role client: bypasses RLS, so it must only ever run on the server
export function getAdminClient() {
  if (adminClient) return adminClient;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi.');
  adminClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return adminClient;
}

export function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(req.body || '{}');
  } catch {
    return {};
  }
}

// 0812..., +62812..., 812... -> 62812...
export function normalizeWhatsapp(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
  return /^62\d{7,14}$/.test(digits) ? digits : '';
}

export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200 ? email : '';
}

export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded || '').split(',')[0].trim() || undefined;
}

const sha256 = (value) => (value ? createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex') : undefined);

async function postJson(url, body, timeoutMs = 4000) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
}

// Meta Conversions API. Skipped silently until the pixel id and token are configured.
export async function sendMetaEvent({ name, eventId, sourceUrl, user = {}, customData = {} }) {
  const pixelId = process.env.META_PIXEL_ID || process.env.VITE_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;

  const [firstName, ...rest] = String(user.name || '').trim().split(/\s+/);
  const event = {
    event_name: name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    event_source_url: sourceUrl,
    user_data: {
      em: user.email ? [sha256(user.email)] : undefined,
      ph: user.phone ? [sha256(user.phone)] : undefined,
      fn: firstName ? [sha256(firstName)] : undefined,
      ln: rest.length ? [sha256(rest.join(' '))] : undefined,
      country: [sha256('id')],
      client_ip_address: user.ip,
      client_user_agent: user.userAgent,
      fbp: user.fbp,
      fbc: user.fbc,
    },
    custom_data: { currency: 'IDR', ...customData },
  };

  const version = process.env.META_GRAPH_VERSION || 'v23.0';
  const testCode = process.env.META_TEST_EVENT_CODE;
  try {
    await postJson(`https://graph.facebook.com/${version}/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
      data: [event],
      ...(testCode ? { test_event_code: testCode } : {}),
    });
  } catch (error) {
    console.error('Meta CAPI failed', error.message);
  }
}

// GA4 Measurement Protocol, needs the visitor's GA client id captured at checkout
export async function sendGaPurchase({ clientId, transactionId, value, item }) {
  const measurementId = process.env.GA4_ID || process.env.VITE_GA4_ID;
  const secret = process.env.GA4_API_SECRET;
  if (!measurementId || !secret || !clientId) return;

  try {
    await postJson(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${encodeURIComponent(secret)}`, {
      client_id: clientId,
      events: [{
        name: 'purchase',
        params: {
          transaction_id: transactionId,
          currency: 'IDR',
          value,
          items: item ? [{ item_id: item.id, item_name: item.title, price: value, quantity: 1 }] : [],
        },
      }],
    });
  } catch (error) {
    console.error('GA4 purchase failed', error.message);
  }
}
