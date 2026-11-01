import { Link } from 'react-router-dom';
import { PORTAL_URL, WHATSAPP_URL } from '../lib/site';

const YOUTUBE_URL = 'https://www.youtube.com/@Aigrowthid';

export default function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link to="/" className="brand"><img src="/logo.jpg" alt="" /><span>AIGrowth</span></Link>
            <p>Komunitas AI praktis Indonesia. Tutorial nyata, course terarah, dan kolaborasi yang relevan.</p>
          </div>
          <div><h4>BELAJAR</h4><ul><li><Link to="/courses">Courses</Link></li><li><Link to="/gratis">Freebies</Link></li><li><Link to="/tools">Tools</Link></li><li><a href={PORTAL_URL} target="_blank" rel="noopener noreferrer">Masuk kelas</a></li></ul></div>
          <div><h4>KOMUNITAS</h4><ul><li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Join komunitas</a></li><li><a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">Video gratis</a></li><li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Training untuk tim</a></li></ul></div>
          <div><h4>IKUTI</h4><ul><li><a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">YouTube</a></li><li><a href="https://www.instagram.com/aigrowth.id/" target="_blank" rel="noopener noreferrer">Instagram</a></li><li><a href="https://www.tiktok.com/@aigrowthid" target="_blank" rel="noopener noreferrer">TikTok</a></li><li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a></li></ul></div>
        </div>
        <svg className="foot-line" viewBox="0 0 1200 22" preserveAspectRatio="none" aria-hidden="true"><path d="M0 11 C 150 -4, 300 26, 450 11 S 750 -4, 900 11 S 1100 26, 1200 11" /></svg>
        <div className="foot-bot"><span>© 2026 AIGrowth.id</span><span>Belajar AI, praktikkan, terus tumbuh.</span></div>
      </div>
    </footer>
  );
}
