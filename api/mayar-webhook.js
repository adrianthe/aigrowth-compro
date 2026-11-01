// POST /api/mayar-webhook?token=MAYAR_WEBHOOK_TOKEN
// Mayar does not sign webhooks, so the URL carries a secret token and every
// payment is re-fetched from the Mayar API before anything is trusted.
import { getAdminClient, normalizeWhatsapp, readJsonBody, sendGaPurchase, sendMetaEvent } from './_lib/server.js';

const MAYAR_API = process.env.MAYAR_API_BASE || 'https://api.mayar.id/hl/v2';
const PAID_STATUSES = ['paid', 'success', 'settled', 'settlement'];

async function fetchTransaction(id) {
  const response = await fetch(`${MAYAR_API}/transactions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${process.env.MAYAR_API_KEY}` },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Mayar API ${response.status}`);
  return (await response.json()).data || null;
}

// A course matches when its Mayar checkout link contains the product id or the payment-link slug
function findCourse(courses, { productId, linkId, linkSlug }) {
  return courses.find((course) => {
    const url = (course.checkout_url || '').toLowerCase();
    if (!url) return false;
    if (productId && url.includes(productId.toLowerCase())) return true;
    if (linkId && url.includes(linkId.toLowerCase())) return true;
    if (!linkSlug) return false;
    try {
      return new URL(url).pathname.split('/').filter(Boolean).pop() === linkSlug.toLowerCase();
    } catch {
      return false;
    }
  }) || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedToken = process.env.MAYAR_WEBHOOK_TOKEN;
  if (!expectedToken || !process.env.MAYAR_API_KEY) return res.status(503).json({ error: 'Webhook belum dikonfigurasi.' });
  if (req.query?.token !== expectedToken) return res.status(401).json({ error: 'Unauthorized' });

  const body = readJsonBody(req);
  // Only completed payments matter; acknowledge everything else so Mayar stops retrying
  if (body.event !== 'payment.received') return res.status(200).json({ ok: true, ignored: body.event || 'unknown' });

  const transactionId = String(body.data?.transactionId || body.data?.id || '');
  if (!transactionId) return res.status(400).json({ error: 'transactionId kosong' });

  let transaction;
  try {
    transaction = await fetchTransaction(transactionId);
  } catch (error) {
    console.error('Mayar verify failed', error.message);
    // 5xx makes Mayar retry later
    return res.status(502).json({ error: 'Verifikasi Mayar gagal' });
  }

  if (!transaction || !PAID_STATUSES.includes(String(transaction.status).toLowerCase())) {
    return res.status(200).json({ ok: true, verified: false });
  }

  const supabase = getAdminClient();
  const customer = transaction.customer || {};
  const email = String(customer.email || body.data?.customerEmail || '').trim().toLowerCase();
  const mobile = normalizeWhatsapp(customer.mobile || body.data?.customerMobile);
  const amount = Number(transaction.amount ?? body.data?.amount) || 0;

  // Insert first: a duplicate delivery hits the primary key and stops here
  const { error: insertError } = await supabase.from('mayar_payments').insert({
    transaction_id: transactionId,
    email: email || null,
    name: customer.name || body.data?.customerName || null,
    mobile: mobile || null,
    amount,
    payment_link: transaction.paymentLink?.link || null,
    payload: { webhook: body.data || {}, paymentMethod: transaction.paymentMethod || null, invoiceCode: transaction.invoiceCode || null },
  });

  if (insertError) {
    if (insertError.code === '23505') return res.status(200).json({ ok: true, duplicate: true });
    console.error('Payment insert failed', insertError.message);
    return res.status(500).json({ error: 'Simpan pembayaran gagal' });
  }

  const { data: courses } = await supabase
    .from('content_items')
    .select('id, title, slug, category, checkout_url')
    .eq('type', 'course')
    .not('checkout_url', 'is', null);

  const course = findCourse(courses || [], {
    productId: body.data?.productId,
    linkId: transaction.paymentLink?.id,
    linkSlug: transaction.paymentLink?.link,
  });

  // The buyer's most recent unpaid checkout form, by email first, then WhatsApp
  let lead = null;
  for (const [column, value] of [['email', email], ['whatsapp', mobile]]) {
    if (lead || !value) continue;
    let query = supabase
      .from('leads')
      .select('id, name, client, content_id')
      .eq('kind', 'checkout')
      .eq('status', 'new')
      .eq(column, value)
      .order('created_at', { ascending: false })
      .limit(1);
    if (course) query = query.eq('content_id', course.id);
    const { data } = await query;
    lead = data?.[0] || null;
  }

  if (lead) {
    await supabase
      .from('leads')
      .update({ status: 'paid', amount, mayar_transaction_id: transactionId, paid_at: new Date().toISOString() })
      .eq('id', lead.id);
  }

  await supabase
    .from('mayar_payments')
    .update({ content_id: course?.id || lead?.content_id || null, lead_id: lead?.id || null })
    .eq('transaction_id', transactionId);

  const client = lead?.client || {};
  const item = course ? { id: course.id, title: course.title } : { id: body.data?.productId, title: body.data?.productName };

  await Promise.all([
    sendMetaEvent({
      name: 'Purchase',
      eventId: `purchase-${transactionId}`,
      sourceUrl: course?.slug ? `https://www.aigrowth.id/courses/${course.slug}` : 'https://www.aigrowth.id/',
      user: { email, phone: mobile, name: customer.name || lead?.name, ip: client.ip, userAgent: client.userAgent, fbp: client.fbp, fbc: client.fbc },
      customData: { value: amount, content_ids: item.id ? [item.id] : undefined, content_name: item.title, content_type: 'product', order_id: transactionId },
    }),
    sendGaPurchase({ clientId: client.gaClientId, transactionId, value: amount, item }),
  ]);

  return res.status(200).json({ ok: true, matchedCourse: Boolean(course), matchedLead: Boolean(lead) });
}
