import { useEffect, useMemo, useState } from 'react';
import { formatRupiah } from '../lib/contentApi';
import { deleteLead, fetchLeads, fetchPayments } from '../lib/leadApi';

const KIND_LABELS = { checkout: 'Checkout', freebie: 'Freebies' };

function sourceOf(lead) {
  const utm = lead.utm || {};
  const touch = utm.last || utm.first || {};
  if (touch.utm_source) return [touch.utm_source, touch.utm_medium, touch.utm_campaign].filter(Boolean).join(' / ');
  if (touch.fbclid) return 'facebook / ads';
  if (touch.ttclid) return 'tiktok / ads';
  if (touch.gclid) return 'google / ads';
  if (utm.first?.referrer) {
    try {
      return new URL(utm.first.referrer).hostname.replace(/^www\./, '');
    } catch {
      return 'referral';
    }
  }
  return 'langsung';
}

function followUpLink(lead) {
  const firstName = lead.name.split(' ')[0];
  const title = lead.content?.title || 'kelas AIGrowth';
  const text = lead.kind === 'checkout' && lead.status !== 'paid'
    ? `Halo ${firstName}, ini dari AIGrowth. Tadi kamu sempat daftar ${title} tapi pembayarannya belum selesai. Ada yang bisa kami bantu?`
    : `Halo ${firstName}, ini dari AIGrowth soal ${title}.`;
  return `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(text)}`;
}

const formatDate = (value) => new Date(value).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function downloadCsv(filename, header, rows) {
  const lines = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));
  const url = URL.createObjectURL(new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function LeadsPanel() {
  const [view, setView] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [payments, setPayments] = useState([]);
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('');
  const [contentId, setContentId] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const load = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [leadRows, paymentRows] = await Promise.all([fetchLeads(), fetchPayments()]);
      setLeads(leadRows);
      setPayments(paymentRows);
    } catch (error) {
      setErrorMessage(error.message || 'Data leads gagal dimuat. Pastikan migrasi funnel sudah dijalankan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const offers = useMemo(() => {
    const map = new Map();
    leads.forEach((lead) => lead.content && map.set(lead.content.id, lead.content.title));
    return [...map.entries()];
  }, [leads]);

  const query = search.trim().toLowerCase();
  const visible = leads.filter((lead) => (
    (!kind || lead.kind === kind)
    && (!status || lead.status === status)
    && (!contentId || lead.content?.id === contentId)
    && (!query || `${lead.name} ${lead.email || ''} ${lead.whatsapp}`.toLowerCase().includes(query))
  ));

  const checkouts = leads.filter((lead) => lead.kind === 'checkout');
  const paid = checkouts.filter((lead) => lead.status === 'paid');
  const revenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const stats = [
    ['Leads freebies', leads.length - checkouts.length],
    ['Isi form checkout', checkouts.length],
    ['Sudah bayar', `${paid.length}${checkouts.length ? ` (${Math.round((paid.length / checkouts.length) * 100)}%)` : ''}`],
    ['Omzet via Mayar', formatRupiah(revenue) || 'Rp0'],
  ];

  const handleDelete = async (lead) => {
    if (!window.confirm(`Hapus data ${lead.name}?`)) return;
    try {
      await deleteLead(lead.id);
      setLeads((rows) => rows.filter((row) => row.id !== lead.id));
    } catch (error) {
      setErrorMessage(error.message || 'Gagal menghapus.');
    }
  };

  const exportLeads = () => downloadCsv(
    'aigrowth-leads.csv',
    ['tanggal', 'jenis', 'status', 'nama', 'email', 'whatsapp', 'produk', 'sumber'],
    visible.map((lead) => [lead.created_at, KIND_LABELS[lead.kind], lead.status === 'paid' ? 'sudah bayar' : 'belum bayar', lead.name, lead.email, lead.whatsapp, lead.content?.title, sourceOf(lead)]),
  );

  const exportPayments = () => downloadCsv(
    'aigrowth-pembayaran-mayar.csv',
    ['tanggal', 'transaksi', 'nama', 'email', 'hp', 'course', 'nominal'],
    payments.map((payment) => [payment.created_at, payment.transaction_id, payment.name, payment.email, payment.mobile, payment.content?.title, payment.amount]),
  );

  return (
    <div className="leads-admin">
      {errorMessage && <div className="error-message glass-panel">{errorMessage}</div>}

      <div className="leads-stats">
        {stats.map(([label, value]) => (
          <div className="leads-stat glass-panel" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="leads-toolbar glass-panel">
        <div className="leads-switch" role="tablist">
          <button type="button" className={view === 'leads' ? 'active' : ''} onClick={() => setView('leads')}>Leads</button>
          <button type="button" className={view === 'payments' ? 'active' : ''} onClick={() => setView('payments')}>Pembayaran Mayar</button>
        </div>
        {view === 'leads' && (
          <>
            <select className="glass-input" value={kind} onChange={(event) => setKind(event.target.value)} aria-label="Jenis">
              <option value="">Semua jenis</option>
              <option value="checkout">Checkout</option>
              <option value="freebie">Freebies</option>
            </select>
            <select className="glass-input" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
              <option value="">Semua status</option>
              <option value="new">Belum bayar</option>
              <option value="paid">Sudah bayar</option>
            </select>
            <select className="glass-input" value={contentId} onChange={(event) => setContentId(event.target.value)} aria-label="Produk">
              <option value="">Semua produk</option>
              {offers.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
            </select>
            <input className="glass-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, email, WA..." />
          </>
        )}
        <div className="leads-toolbar-actions">
          <button type="button" className="cancel-btn" onClick={load}>Muat ulang</button>
          <button type="button" className="cancel-btn" onClick={view === 'leads' ? exportLeads : exportPayments}>Export CSV</button>
        </div>
      </div>

      {view === 'leads' ? (
        <div className="leads-table glass-panel">
          {isLoading && <div className="empty-state">Memuat...</div>}
          {!isLoading && visible.length === 0 && <div className="empty-state">Belum ada leads.</div>}
          {visible.map((lead) => (
            <div className="leads-row" key={lead.id}>
              <div className="leads-who">
                <strong>{lead.name}</strong>
                <span>{lead.email || 'tanpa email'} · +{lead.whatsapp}</span>
              </div>
              <div className="leads-what">
                <span className={`leads-badge is-${lead.kind === 'checkout' ? lead.status : 'freebie'}`}>
                  {lead.kind === 'freebie' ? 'Freebies' : lead.status === 'paid' ? `Lunas ${formatRupiah(lead.amount)}` : 'Belum bayar'}
                </span>
                <span>{lead.content?.title || 'Produk dihapus'}</span>
              </div>
              <div className="leads-meta">
                <span>{sourceOf(lead)}</span>
                <span>{formatDate(lead.created_at)}</span>
              </div>
              <div className="leads-actions">
                <a className="edit-btn" href={followUpLink(lead)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <button type="button" className="delete-btn" onClick={() => handleDelete(lead)}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="leads-table glass-panel">
          {isLoading && <div className="empty-state">Memuat...</div>}
          {!isLoading && payments.length === 0 && <div className="empty-state">Belum ada pembayaran yang masuk lewat webhook Mayar.</div>}
          {payments.map((payment) => (
            <div className="leads-row" key={payment.transaction_id}>
              <div className="leads-who">
                <strong>{payment.name || payment.email || 'Pembeli'}</strong>
                <span>{payment.email}{payment.mobile ? ` · +${payment.mobile}` : ''}</span>
              </div>
              <div className="leads-what">
                <span className="leads-badge is-paid">{formatRupiah(payment.amount)}</span>
                <span>{payment.content?.title || 'Produk Mayar lain'}</span>
              </div>
              <div className="leads-meta">
                <span>{payment.lead_id ? 'Lewat form aigrowth.id' : 'Langsung di Mayar'}</span>
                <span>{formatDate(payment.created_at)}</span>
              </div>
              <div className="leads-actions" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
