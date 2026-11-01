import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PORTAL_URL, WHATSAPP_URL, whatsappLink } from '../lib/site';
import { getLastCheckout } from '../lib/tracking';
import './Offer.css';

// Mayar sends buyers here after payment (set as the product's redirect URL).
// Purchase conversions are sent from the webhook, not this page, because anyone can open this URL.
export default function ThankYou() {
  const checkout = getLastCheckout();

  useEffect(() => {
    document.title = 'Pembayaran berhasil | AIGrowth';
    return () => {
      document.title = 'AIGrowth';
    };
  }, []);

  const steps = [
    ['Cek email kamu', `Mayar mengirim bukti bayar dan akses kelas ke ${checkout?.email || 'email yang kamu pakai saat bayar'}. Cek juga folder Promosi/Spam.`],
    ['Masuk ke portal member', 'Buka portal, masukkan email yang sama, lalu klik link login yang dikirim ke email. Semua kelas yang kamu beli ada di situ.'],
    ['Gabung komunitas', 'Kalau ada kendala akses atau mau tanya materi, langsung chat tim AIGrowth di WhatsApp.'],
  ];

  return (
    <div className="of-page ty-page">
      <section className="of-final ty-card">
        <span className="of-kicker"><i />Pembayaran berhasil</span>
        <h1>Terima kasih{checkout?.title ? '!' : ', pembayaranmu sudah kami terima!'}</h1>
        {checkout?.title && <p>Kamu sudah terdaftar di <b>{checkout.title}</b>.</p>}
        <ol className="ty-steps">
          {steps.map(([title, text], index) => (
            <li key={title}>
              <span className="of-num">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="of-actions ty-actions">
          {PORTAL_URL && <a className="primary-btn of-cta" href={PORTAL_URL} target="_blank" rel="noopener noreferrer">Masuk Kelas →</a>}
          <a className="of-ghost" href={checkout?.title ? whatsappLink(`Halo AIGrowth, saya baru beli ${checkout.title}`) : WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Chat WhatsApp</a>
        </div>
        <Link className="of-ask" to="/courses">Lihat course lainnya</Link>
      </section>
    </div>
  );
}
