import { useEffect, useState } from 'react';
import { getDefaultContent } from '../data/contentDefaults';
import { fetchContentItems, getYouTubeVideoId } from '../lib/contentApi';
import './Home.css';

const rotatingWords = ['Belajar', 'Berkembang', 'Ber-progress', 'Bertumbuh'];

function EventCard({ event }) {
  const content = (
    <div className="event-image-wrapper">
      {event.imageUrl ? (
        <img src={event.imageUrl} alt={event.title} />
      ) : (
        <div className="event-image-placeholder">AIGROWTH EVENT</div>
      )}
      <div className="event-caption-overlay">
        <div>
          <span className="highlight-cyan">{event.category || 'AIGROWTH EVENT'}</span>
          <p>{event.title}</p>
          {event.eventDate && <time dateTime={event.eventDate}>{new Date(event.eventDate).toLocaleDateString('id-ID')}</time>}
        </div>
      </div>
    </div>
  );

  return event.url ? (
    <a href={event.url} target="_blank" rel="noopener noreferrer" className="event-card glass-panel dynamic-event-card">
      {content}
    </a>
  ) : (
    <article className="event-card glass-panel dynamic-event-card">{content}</article>
  );
}

function YouTubeCard({ video, index }) {
  const videoId = getYouTubeVideoId(video.url);
  if (!videoId) return null;

  return (
    <article className="youtube-card glass-panel reveal-card" style={{ '--card-delay': `${index * 90}ms` }}>
      <div className="youtube-player-shell">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
          title={video.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <div className="youtube-card-body">
        <div className="video-meta">
          <span className="video-category">{video.category || 'AIGrowth Tutorial'}</span>
          <span className="video-watch-label">WATCH & LEARN</span>
        </div>
        <h3>{video.title}</h3>
        <p>{video.description}</p>
        <a href={video.url} target="_blank" rel="noopener noreferrer" className="youtube-external-link">
          Buka di YouTube <span aria-hidden="true">&nearr;</span>
        </a>
      </div>
    </article>
  );
}

export default function Home() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [videos, setVideos] = useState(() => getDefaultContent('video'));
  const [events, setEvents] = useState(() => getDefaultContent('event'));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((previous) => (previous + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([fetchContentItems('video'), fetchContentItems('event')]).then(([videoItems, eventItems]) => {
      if (!active) return;
      setVideos(videoItems);
      setEvents(eventItems);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="home-page">
      <div className="page-ambient" aria-hidden="true">
        <span className="ambient-orb orb-one"></span>
        <span className="ambient-orb orb-two"></span>
        <span className="ambient-grid"></span>
      </div>

      <section className="community-section container fade-in">
        <div className="community-content glass-panel">
          <div className="community-aura aura-left" aria-hidden="true"></div>
          <div className="community-aura aura-right" aria-hidden="true"></div>
          <div className="community-kicker"><span className="pulse-dot"></span> KOMUNITAS AI PRAKTIS INDONESIA</div>
          <h1 className="community-title">
            Gabung Komunitas AIGrowth untuk <br />
            <span className="gradient-word fade-text" key={currentWordIndex}>
              {rotatingWords[currentWordIndex]}
            </span> di Era AI
          </h1>
          <p className="community-subtitle">
            Tempat praktisi, kreator, dan pemilik bisnis belajar AI lewat tutorial nyata, course terarah, dan kolaborasi yang relevan.
          </p>
          <div className="community-actions">
            <a href="https://Wa.me/6285716280788" target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
              Join Komunitas -&gt;
            </a>
            <a href="#belajar" className="learn-btn">Mulai Belajar</a>
          </div>

          <div className="community-proof" aria-label="Fokus komunitas AIGrowth">
            <div><strong>Praktis</strong><span>Bukan teori doang</span></div>
            <div><strong>Relevan</strong><span>Use case Indonesia</span></div>
            <div><strong>Kolaboratif</strong><span>Tumbuh bareng</span></div>
          </div>

          <div className="social-buttons-row">
            <a href="https://www.youtube.com/@Aigrowthid" className="social-btn youtube" target="_blank" rel="noopener noreferrer" title="YouTube" aria-label="YouTube AIGrowth">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
            <a href="https://www.instagram.com/aigrowth.id/" className="social-btn instagram" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram AIGrowth">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://www.tiktok.com/@aigrowthid" className="social-btn tiktok" target="_blank" rel="noopener noreferrer" title="TikTok" aria-label="TikTok AIGrowth">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
            </a>
            <a href="https://Wa.me/6285716280788" className="social-btn whatsapp" target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label="WhatsApp AIGrowth">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </a>
          </div>
        </div>
      </section>

      <section id="belajar" className="youtube-learning-section container">
        <div className="section-heading reveal-card">
          <div className="section-kicker"><span></span> AIGROWTH LEARNING HUB</div>
          <h2>Belajar AI langsung dari <span className="gradient-word">video praktis</span></h2>
          <p>Tekan play dan mulai belajar tanpa pindah halaman. Koleksi ini bisa diperbarui kapan pun dari dashboard admin.</p>
        </div>
        <div className="youtube-grid">
          {videos.length === 0 && <div className="glass-panel empty-state">Belum ada video yang dipublikasikan.</div>}
          {videos.map((video, index) => <YouTubeCard key={video.id} video={video} index={index} />)}
        </div>
        <div className="youtube-channel-cta">
          <a href="https://www.youtube.com/@Aigrowthid" target="_blank" rel="noopener noreferrer">Lihat semua video di YouTube -&gt;</a>
        </div>
      </section>

      <section className="profile-catalog-section container">
        <div className="profile-wrapper">
          <div className="glass-panel unified-section">
            <div className="profile-card about-card about-card-modern">
              <div className="about-avatar about-logo-wrap">
                <img src="/logo.jpg" alt="AIGrowth Logo" />
              </div>
              <div className="about-info">
                <div className="section-kicker"><span></span> ABOUT US</div>
                <h2 className="about-card-title">AI terasa lebih mudah saat <span className="gradient-word">belajar bareng</span></h2>
                <p className="about-card-desc">
                  AIGrowth.id adalah platform komunitas yang membahas Generative AI untuk konten, video, otomasi, dan produktivitas melalui pengalaman yang praktis dan relevan.
                </p>
              </div>
            </div>

            <div className="founders-section">
              <div className="section-heading compact-heading">
                <div className="section-kicker"><span></span> PEOPLE BEHIND AIGROWTH</div>
                <h2>Meet the <span className="gradient-word">founders</span></h2>
              </div>
              <div className="founders-grid">
                <div className="founder-card glass-panel">
                  <div className="founder-image" style={{ backgroundImage: 'url(/adrian.png)' }}></div>
                  <div className="founder-overlay">
                    <div className="founder-badges"><span className="founder-role">FOUNDER</span></div>
                    <div className="founder-bottom">
                      <div className="founder-info"><h3>Adrian The</h3><p>AI Strategist & Creator</p></div>
                      <a href="https://www.instagram.com/adrianthe_/" target="_blank" rel="noopener noreferrer" className="founder-link-btn" aria-label="Instagram Adrian The">&nearr;</a>
                    </div>
                  </div>
                </div>
                <div className="founder-card glass-panel">
                  <div className="founder-image" style={{ backgroundImage: 'url(/adriel.png)' }}></div>
                  <div className="founder-overlay">
                    <div className="founder-badges"><span className="founder-role">CO-FOUNDER</span></div>
                    <div className="founder-bottom">
                      <div className="founder-info"><h3>Adriel Edgard</h3><p>AI Engineer & Innovator</p></div>
                      <a href="https://www.instagram.com/adrieledgard/" target="_blank" rel="noopener noreferrer" className="founder-link-btn" aria-label="Instagram Adriel Edgard">&nearr;</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="event-showcase-section">
              <div className="section-heading compact-heading">
                <div className="section-kicker"><span></span> COMMUNITY IN ACTION</div>
                <h2>AIGrowth <span className="gradient-word">events</span></h2>
              </div>
              <div className="event-gallery-grid">
                {events.length === 0 && <div className="glass-panel empty-state">Belum ada event yang dipublikasikan.</div>}
                {events.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
