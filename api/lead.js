// POST /api/lead
// Saves a checkout or freebie form, sends the matching server-side pixel event,
// and returns where the visitor goes next (Mayar checkout or the freebie link).
import {
  clientIp,
  getAdminClient,
  normalizeEmail,
  normalizeWhatsapp,
  readJsonBody,
  sendMetaEvent,
} from './_lib/server.js';

const KINDS = { course: 'checkout', freebie: 'freebie' };

const clip = (value, max) => (value ? String(value).slice(0, max) : null);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = readJsonBody(req);
  // Honeypot: real visitors never see or fill this field
  if (body.website) return res.status(200).json({ ok: true });

  const kind = KINDS[body.type];
  const name = String(body.name || '').trim().slice(0, 120);
  const whatsapp = normalizeWhatsapp(body.whatsapp);
  const email = body.email ? normalizeEmail(body.email) : '';

  if (!kind || !body.slug) return res.status(400).json({ error: 'Halaman tidak dikenal.' });
  if (!name) return res.status(400).json({ error: 'Nama wajib diisi.' });
  if (!whatsapp) return res.status(400).json({ error: 'Nomor WhatsApp belum valid. Contoh: 0812xxxxxxx' });
  if (body.email && !email) return res.status(400).json({ error: 'Format email belum valid.' });
  if (kind === 'checkout' && !email) return res.status(400).json({ error: 'Email wajib diisi, akses kelas dikirim ke email ini.' });

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (error) {
    console.error(error.message);
    return res.status(503).json({ error: 'Server belum dikonfigurasi.' });
  }

  const { data: offer, error: offerError } = await supabase
    .from('content_items')
    .select('id, title, category, price, checkout_url')
    .eq('type', body.type)
    .eq('slug', String(body.slug))
    .eq('published', true)
    .maybeSingle();

  if (offerError || !offer) return res.status(404).json({ error: 'Halaman tidak ditemukan.' });

  const client = {
    fbp: clip(body.client?.fbp, 200),
    fbc: clip(body.client?.fbc, 400),
    gaClientId: clip(body.client?.gaClientId, 100),
    ttp: clip(body.client?.ttp, 200),
    ip: clientIp(req),
    userAgent: clip(req.headers['user-agent'], 500),
  };

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      content_id: offer.id,
      kind,
      name,
      email: email || null,
      whatsapp,
      utm: body.attribution && typeof body.attribution === 'object' ? body.attribution : {},
      client,
      landing_path: clip(body.path, 500),
      referrer: clip(body.referrer, 1500),
    })
    .select('id')
    .single();

  if (leadError) {
    console.error('Lead insert failed', leadError.message);
    return res.status(500).json({ error: 'Data gagal disimpan. Coba lagi sebentar.' });
  }

  let deliveryUrl = '';
  if (kind === 'freebie') {
    const { data: delivery } = await supabase
      .from('offer_deliveries')
      .select('delivery_url')
      .eq('content_id', offer.id)
      .maybeSingle();
    deliveryUrl = delivery?.delivery_url || '';
  }

  await sendMetaEvent({
    name: kind === 'checkout' ? 'InitiateCheckout' : 'Lead',
    eventId: clip(body.eventId, 100) || lead.id,
    sourceUrl: clip(body.url, 1500),
    user: { email, phone: whatsapp, name, ip: client.ip, userAgent: client.userAgent, fbp: client.fbp, fbc: client.fbc },
    customData: {
      content_ids: [offer.id],
      content_name: offer.title,
      content_category: offer.category || undefined,
      content_type: 'product',
      ...(kind === 'checkout' && offer.price ? { value: offer.price } : {}),
    },
  });

  return res.status(200).json({
    ok: true,
    leadId: lead.id,
    checkoutUrl: kind === 'checkout' ? offer.checkout_url || '' : undefined,
    deliveryUrl: kind === 'freebie' ? deliveryUrl : undefined,
  });
}
