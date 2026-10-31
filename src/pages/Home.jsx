import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDefaultContent } from '../data/contentDefaults';
import { fetchContentItems, getYouTubeVideoId } from '../lib/contentApi';
import { initLanding } from './home/landingEngine';
import './Home.css';

const WHATSAPP_URL = 'https://wa.me/6287773535692';
const YOUTUBE_URL = 'https://www.youtube.com/@Aigrowthid';
const INFINITY_PATH = 'M24 12c-3.6-4.4-7-6.6-10.2-6.6a6.6 6.6 0 0 0 0 13.2C17 18.6 20.4 16.4 24 12zm0 0c3.6 4.4 7 6.6 10.2 6.6a6.6 6.6 0 0 0 0-13.2C31 5.4 27.6 7.6 24 12z';
const CHAPTER_LABELS = ['Mulai', 'Belajar', 'Praktik', 'Tumbuh'];
const PRELOADER_KEY = 'aigrowth-home-preloaded';

const TOOLS = [['G', 'ChatGPT'], ['C', 'Claude'], ['Ge', 'Gemini'], ['O', 'Google Omni'], ['Co', 'Comet Browser'], ['R', 'Repliz'], ['Oc', 'OpenClaw']];
const TOPICS = ['AI influencer', 'foto produk', 'video sinematik', 'auto-post Threads', 'properti', 'F&B', 'image prompting', 'affiliate', 'AI agent'];
const PARTNERS = ['Paragon Corp', 'Smesco', 'Cekat AI', 'Elshinta Radio', 'Om Botak'];

// Each pair links to the matching course from the CMS when one exists
const PAIRS = [
  { match: /threads/i, label: 'Threads', course: 'Automate Threads Pakai AI', before: 'Posting manual tiap hari', after: 'Auto-post terjadwal' },
  { match: /influencer/i, label: 'AI Influencer', course: 'Framework AI Influencer yang Konsisten', before: 'Muka karakter berubah-ubah', after: 'Identitas AI terkunci' },
  { match: /propert/i, label: 'Properti', course: 'AI for Property', before: 'Foto listing gelap', after: 'Visual properti premium' },
  { match: /commerce/i, label: 'Produk', course: 'AI for Product Commerce', before: 'Foto produk diam', after: 'Video produk sinematik' },
  { match: /prompt/i, label: 'Prompting', course: 'AI Fundamentals: Image Prompting', before: 'Beli prompt orang terus', after: 'Punya formula sendiri' },
];

const FAQ = [
  ['Saya belum pernah pakai AI. Bisa ikut?', 'Bisa. Mulai dari video gratis di YouTube atau freebies Automate Threads, lalu lanjut ke AI Fundamentals: Image Prompting buat pegangan dasar menyusun prompt sendiri.'],
  ['Tools AI apa saja yang dipakai?', 'Tergantung course: ChatGPT/GPT untuk gambar, Claude untuk copywriting, Google Omni untuk video, Comet Browser untuk riset, Repliz untuk jadwal posting, dan OpenClaw untuk AI agent.'],
  ['Materinya bakal ketinggalan zaman nggak?', 'Dunia AI berubah cepat, jadi beberapa course (misalnya Framework AI Influencer) terus diperbarui saat ada teknik atau tools baru.'],
  ['Gimana cara gabung komunitas?', 'Klik Join Komunitas. Kamu langsung terhubung ke WhatsApp AIGrowth untuk info grup, course, dan event terbaru.'],
  ['Course-nya dibeli di mana?', 'Tiap kartu course punya tombol yang mengarah ke halaman pendaftaran resminya. Freebies Automate Threads bisa diambil gratis.'],
  ['Bisa untuk training tim atau perusahaan?', 'Bisa. AIGrowth sudah mengisi training, workshop, dan webinar bersama Paragon Corp, Smesco, Cekat AI, Om Botak, sampai talkshow di Elshinta Radio.'],
];

const pad = (n) => String(n).padStart(2, '0');

function Split({ parts, start = 0 }) {
  let index = start;
  return parts.flatMap((part, pi) => {
    const [text, cls] = Array.isArray(part) ? part : [part, ''];
    return text.split(/(\s+)/).filter(Boolean).map((word, wi) => (
      /^\s+$/.test(word)
        ? ' '
        : (
          <span className="w" key={`${pi}-${wi}`}>
            <span className={cls ? `wi ${cls}` : 'wi'} style={{ '--i': index++ }}>{word}</span>
          </span>
        )
    ));
  });
}

function Arrow({ size = 15 }) {
  return (
    <svg className="i" viewBox="0 0 24 24" style={{ width: size, height: size }} aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg className="i" viewBox="0 0 24 24" style={{ width: size, height: size }} aria-hidden="true">
      <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
      <path d="M9 9.2c.2 2.9 2.9 5.6 5.8 5.8" />
    </svg>
  );
}

function Ticker({ items }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return undefined;
    const id = setInterval(() => setIndex((v) => (v + 1) % items.length), 2600);
    return () => clearInterval(id);
  }, [items.length]);

  if (!items.length) return null;
  return (
    <span className="tk-win">
      <span className="tk-item" key={index}>{items[index % items.length]}</span>
    </span>
  );
}

function CountUp({ to, run }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 1200);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, to]);

  return pad(value);
}

function CourseCard({ course, index }) {
  const free = /free|gratis/i.test(`${course.category} ${course.title} ${course.label}`);
  return (
    <article className="course">
      <div className="cimg">
        {course.imageUrl ? (
          <img loading="lazy" src={course.imageUrl} alt={course.title} />
        ) : (
          <span className="art" aria-hidden="true">
            <svg viewBox="0 0 48 24"><path d={INFINITY_PATH} fill="none" stroke="url(#lp-cyan)" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="3.4 1.7" /></svg>
          </span>
        )}
        {free ? <span className="tg pick">Gratis</span> : course.featured && <span className="tg pick">Pilihan</span>}
        <span className="num">{pad(index + 1)}</span>
      </div>
      <div className="cbody">
        <small>{course.category || 'Course'}</small>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="cfoot">
          <span>{free ? 'Gratis' : 'Online course'}</span>
          {course.url ? (
            <a href={course.url} target="_blank" rel="noopener noreferrer">{(course.label || 'Lihat detail').replace(/!+$/, '')} <Arrow size={14} /></a>
          ) : (
            <span>Segera hadir</span>
          )}
        </div>
      </div>
    </article>
  );
}

function EventTile({ event, index }) {
  const size = index === 0 ? ' big' : index === 5 ? ' wide' : '';
  const body = (
    <>
      {event.imageUrl ? <img loading="lazy" src={event.imageUrl} alt={event.title} /> : null}
      {event.url && <span className="yt">Lihat ↗</span>}
      <span className="cap"><small>{(event.category || 'AIGrowth event').toUpperCase()}</small><b>{event.title}</b></span>
    </>
  );
  return event.url ? (
    <a className={`ev${size}`} href={event.url} target="_blank" rel="noopener noreferrer" data-reveal style={{ '--d': (index % 3) + 1 }}>{body}</a>
  ) : (
    <div className={`ev${size}`} data-reveal style={{ '--d': (index % 3) + 1 }}>{body}</div>
  );
}

export default function Home() {
  const rootRef = useRef(null);
  const engineRef = useRef(null);
  const dialogRef = useRef(null);
  const [showPreloader] = useState(() => {
    try {
      return !window.sessionStorage.getItem(PRELOADER_KEY);
    } catch {
      return true;
    }
  });
  const [ready, setReady] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [statsOn, setStatsOn] = useState(false);
  const [videoId, setVideoId] = useState('');
  const [courses, setCourses] = useState(() => getDefaultContent('course'));
  const [videos, setVideos] = useState(() => getDefaultContent('video'));
  const [events, setEvents] = useState(() => getDefaultContent('event'));

  useEffect(() => {
    let active = true;
    Promise.all([fetchContentItems('course'), fetchContentItems('video'), fetchContentItems('event')]).then(([c, v, e]) => {
      if (!active) return;
      setCourses(c);
      setVideos(v);
      setEvents(e);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const engine = initLanding(rootRef.current, {
      showPreloader,
      onChapter: (k) => {
        setChapter(k);
        if (k === 3) setStatsOn(true);
      },
      onReady: () => {
        setReady(true);
        try {
          window.sessionStorage.setItem(PRELOADER_KEY, '1');
        } catch {
          // storage can be blocked; the preloader just shows again next time
        }
      },
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [showPreloader]);

  // CMS data swaps cards in after first paint; re-measure and watch the new reveals
  useEffect(() => {
    engineRef.current?.refresh();
  }, [courses, videos, events]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (videoId && !dialog.open) {
      dialog.showModal();
      engineRef.current?.pause();
    }
  }, [videoId]);

  const closeVideo = () => {
    dialogRef.current?.close();
  };

  const playable = videos.map((v) => ({ ...v, ytId: getYouTubeVideoId(v.url) })).filter((v) => v.ytId).slice(0, 3);
  const pairs = PAIRS.map((pair) => {
    const found = courses.find((c) => pair.match.test(c.title));
    return { ...pair, course: found?.title || pair.course, url: found?.url || '' };
  });
  const collage = events.filter((e) => e.imageUrl).slice(1, 4);

  return (
    <div className={`lp${ready ? ' is-ready' : ''}`} ref={rootRef}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="lp-cyan" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#00d2ff" /><stop offset=".52" stopColor="#3a7bd5" /><stop offset="1" stopColor="#8be9ff" /></linearGradient>
          <linearGradient id="lp-cyan-h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#00d2ff" stopOpacity="0" /><stop offset=".5" stopColor="#00d2ff" /><stop offset="1" stopColor="#8be9ff" stopOpacity="0" /></linearGradient>
        </defs>
      </svg>

      {showPreloader && (
        <div className="lp-preloader" aria-hidden="true">
          <div className="pl">
            <svg viewBox="0 0 48 24"><path className="base" d={INFINITY_PATH} /><path className="draw" pathLength="100" d={INFINITY_PATH} /></svg>
            <div className="pl-word">AIGrowth</div>
            <div className="segs">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div>
          </div>
        </div>
      )}

      <div className="loopnav" aria-label="Progres Growth Loop">
        <svg viewBox="0 0 48 24" aria-hidden="true"><path className="b" d={INFINITY_PATH} /><path className="p" pathLength="100" d={INFINITY_PATH} /></svg>
        <span className="lbl"><i>{pad(chapter)}</i>{CHAPTER_LABELS[chapter]}</span>
        <span className="dots">
          {CHAPTER_LABELS.map((label, k) => (
            <button key={label} type="button" aria-label={label} className={k === chapter ? 'on' : ''} onClick={() => engineRef.current?.goChapter(k)} />
          ))}
        </span>
      </div>

      {/* ===== GROWTH LOOP (pinned) ===== */}
      <section className="lp-stage">
        <div className="stage-sticky">
          <div className="pixels" />
          <div className="haze" />
          <canvas className="lp-gl" />

          <div className="chap hero" data-k="0">
            <div className="copy">
              <div className="hero-veil" />
              <span className="pill" data-reveal style={{ '--d': 1 }}>Komunitas AI praktis Indonesia</span>
              <h1 className="lp-h1">
                <span className="l"><Split parts={['Belajar AI, praktikkan,']} /></span>{' '}
                <span className="l"><Split parts={[['terus tumbuh.', 'grad']]} start={3} /></span>
              </h1>
              <p className="hero-sub" data-reveal style={{ '--d': 5 }}>Tempat praktisi, kreator, dan pemilik bisnis belajar AI lewat tutorial nyata, course terarah, dan kolaborasi yang relevan.</p>
              <div className="hero-cta" data-reveal style={{ '--d': 6 }}>
                <a className="btn btn-primary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Join Komunitas <span className="arr">→</span></a>
                <Link className="btn btn-glass" to="/courses">Lihat Courses</Link>
              </div>
              {courses.length > 0 && (
                <div className="ticker" data-reveal style={{ '--d': 7 }}><b>Course terbaru</b><Ticker items={courses.map((c) => c.title)} /></div>
              )}
              <div className="socials" data-reveal style={{ '--d': 8 }}>
                <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" aria-label="YouTube AIGrowth"><svg className="i" viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" /></svg></a>
                <a href="https://www.instagram.com/aigrowth.id/" target="_blank" rel="noopener noreferrer" aria-label="Instagram AIGrowth"><svg className="i" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg></a>
                <a href="https://www.tiktok.com/@aigrowthid" target="_blank" rel="noopener noreferrer" aria-label="TikTok AIGrowth"><svg className="i" viewBox="0 0 24 24"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.5 2.6 2.4 4.4 5 4.6" /></svg></a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp AIGrowth"><WhatsAppIcon /></a>
              </div>
            </div>
          </div>

          <div className="chap" data-k="1" id="belajar">
            <div className="copy">
              <span className="pill" data-reveal>01 · Belajar</span>
              <h2><Split parts={['Mulai dari ', ['nonton.', 'grad'], ' Gratis.']} /></h2>
              <p className="lead" data-reveal style={{ '--d': 2 }}>Tutorial praktis di YouTube AIGrowth. Tekan play dan langsung belajar tanpa pindah halaman.</p>
              <div className="vlist panel" data-reveal style={{ '--d': 3 }}>
                {playable.map((video) => (
                  <button key={video.id} className="vitem" type="button" onClick={() => setVideoId(video.ytId)}>
                    <span className="th">
                      <img loading="lazy" src={`https://i.ytimg.com/vi/${video.ytId}/mqdefault.jpg`} alt="" />
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
                    </span>
                    <span><small>{video.category || 'AIGrowth tutorial'}</small><b>{video.title}</b></span>
                  </button>
                ))}
                <div className="vlist-foot"><span>Watch &amp; learn</span><a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">Semua video →</a></div>
              </div>
            </div>
          </div>

          <div className="chap flip" data-k="2" id="praktik">
            <div className="copy">
              <span className="pill" data-reveal>02 · Praktik</span>
              <h2><Split parts={['Lalu ', ['praktik', 'grad'], ' pakai workflow nyata.']} /></h2>
              <p className="lead" data-reveal style={{ '--d': 2 }}>Bukan kumpulan trik. Tiap course ngajarin alur kerja utuh, dari riset sampai hasilnya jalan sendiri.</p>
              <div className="flow" data-reveal style={{ '--d': 3 }}>
                <div className="node" style={{ '--nd': '.7s' }}><div className="tl"><i>C</i><b>Comet</b></div><p>Riset konten viral di niche-mu</p><div className="st"><span className="wt">menunggu…</span><span className="dn">✓ 10 referensi</span></div></div>
                <div className="node" style={{ '--nd': '1.4s' }}><div className="tl"><i>Cl</i><b>Claude</b></div><p>Tulis thread original dari polanya</p><div className="st"><span className="wt">menunggu…</span><span className="dn">✓ 3 draft siap</span></div></div>
                <div className="node" style={{ '--nd': '2.1s' }}><div className="tl"><i>R</i><b>Repliz</b></div><p>Jadwal &amp; auto-post ke Threads</p><div className="st"><span className="wt">menunggu…</span><span className="dn">✓ terjadwal</span></div></div>
              </div>
              <div className="post panel">
                <img src="/logo.jpg" alt="" />
                <div className="post-body"><div className="ph"><b>aigrowth.id</b><em>Terjadwal · besok 09.00</em></div><div className="sk" style={{ width: '92%' }} /><div className="sk" style={{ width: '76%' }} /><div className="sk" style={{ width: '54%' }} /></div>
              </div>
              <div className="flow-note" data-reveal style={{ '--d': 4 }}>Ilustrasi alur dari freebies Automate Threads Pakai AI.</div>
            </div>
          </div>

          <div className="chap rise" data-k="3" id="tumbuh">
            <div className="copy">
              <span className="pill" data-reveal>03 · Tumbuh</span>
              <h2><Split parts={['Terus ', ['tumbuh', 'grad'], ' bareng komunitas.']} /></h2>
              <p className="lead" data-reveal style={{ '--d': 2 }}>AI terasa lebih mudah saat belajar bareng. Tanya, share hasil, ikut event, lalu ulangi loop-nya dengan skill baru.</p>
              <div className="stats">
                <div className="stat panel" data-reveal style={{ '--d': 3 }}><b className="grad"><CountUp to={courses.length} run={statsOn} /></b><span>course praktis</span></div>
                <div className="stat panel" data-reveal style={{ '--d': 4 }}><b className="grad"><CountUp to={events.length} run={statsOn} /></b><span>event &amp; kolaborasi</span></div>
                <div className="stat panel" data-reveal style={{ '--d': 5 }}><b className="grad"><CountUp to={3} run={statsOn} /></b><span>kanal belajar gratis</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TOOLS ===== */}
      <section className="tools" aria-label="Tools dan topik">
        <div className="wrap head">
          <h3 data-reveal>Tools &amp; topik yang dibahas di kelas AIGrowth.</h3>
          <p data-reveal style={{ '--d': 2 }}>Dipilih karena dipakai di kerjaan sehari-hari, bukan karena lagi viral doang.</p>
        </div>
        <div className="chiprow">
          {[...TOOLS, ...TOOLS].map(([icon, name], i) => <span className="chip" key={`${name}-${i}`}><i>{icon}</i>{name}</span>)}
        </div>
        <div className="chiprow rev">
          {[...TOPICS, ...TOPICS].map((topic, i) => <span className="chip t" key={`${topic}-${i}`}>{topic}</span>)}
        </div>
        <div className="tools-fade" />
      </section>

      {/* ===== DULU vs SEKARANG ===== */}
      <section className="scan" aria-label="Dulu dan sekarang">
        <div className="scan-sticky">
          <div className="scan-grid" />
          <div className="scan-head"><span className="pill">Dulu vs sekarang</span></div>
          {pairs.map((pair) => (
            <div className="pair" key={pair.label}>
              <span className="pc">{pair.course}</span>
              <div className="lines">
                <div className="row"><span className="tag old">Dulu</span><span className="txt before">{pair.before}</span></div>
                <div className="row"><span className="tag new">Sekarang</span><span className="txt after">{pair.after}</span></div>
                <i className="scanner" />
              </div>
              {pair.url ? (
                <a className="go" href={pair.url} target="_blank" rel="noopener noreferrer">Lihat course-nya <Arrow /></a>
              ) : (
                <Link className="go" to="/courses">Lihat course-nya <Arrow /></Link>
              )}
            </div>
          ))}
          <div className="scan-steps">{pairs.map((pair) => <span key={pair.label}>{pair.label}</span>)}</div>
          <div className="scan-cap">Gambaran perubahan cara kerja dari materi course. Hasil tiap orang bisa berbeda.</div>
        </div>
      </section>

      {/* ===== COURSES ===== */}
      <section className="courses" id="course">
        <div className="c-sticky">
          <div className="wrap sec-head">
            <div>
              <span className="pill" data-reveal>AIGrowth learning</span>
              <h2 data-split><Split parts={['Pilih skill yang mau ', ['kamu kuasai.', 'grad']]} /></h2>
              <p className="lead" data-reveal style={{ '--d': 2 }}>Course fokus, contoh praktis, langsung bisa dipakai di kerjaanmu.</p>
            </div>
            <Link className="btn btn-glass" data-reveal style={{ '--d': 3 }} to="/courses">Semua course <Arrow /></Link>
          </div>
          <div className="c-view">
            <div className="c-track">
              {courses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}
              <article className="course end">
                <span className="pill">Masih bingung?</span>
                <div><h3>Ceritain kebutuhanmu, kami bantu pilihin.</h3><p>Chat tim AIGrowth di WhatsApp, nanti diarahkan ke course yang paling pas.</p></div>
                <a className="btn btn-primary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Chat via WhatsApp <span className="arr">→</span></a>
              </article>
            </div>
          </div>
          <div className="wrap c-foot"><div className="c-prog"><i /></div><span>SCROLL UNTUK GESER</span></div>
        </div>
      </section>

      {/* ===== EVENTS ===== */}
      <section className="sec" id="event">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="pill" data-reveal>Community in action</span>
              <h2 data-split><Split parts={['Komunitas yang ', ['turun ke lapangan.', 'grad']]} /></h2>
            </div>
            <p className="lead" data-reveal style={{ '--d': 2 }}>Webinar, training, workshop, konferensi, talkshow radio, sampai AI tech trip ke Shenzhen.</p>
          </div>
          <div className="bento">
            {events.map((event, index) => <EventTile key={event.id} event={event} index={index} />)}
          </div>
        </div>
      </section>

      {/* ===== UNTUK TIM ===== */}
      <section className="sec" id="tim" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="team" data-reveal>
            <div className="team-grid">
              <div>
                <span className="pill">Training &amp; kolaborasi</span>
                <h2>Bawa AI ke tim, brand, <span className="grad">atau komunitasmu.</span></h2>
                <p className="lead">AIGrowth sudah mengisi training perusahaan, workshop, webinar UMKM, sampai talkshow radio. Materinya disesuaikan dengan kebutuhan dan kasus nyata audiensmu.</p>
                <div className="formats"><span>Training in-house</span><span>Workshop</span><span>Webinar</span><span>Tech conference</span><span>Talkshow</span></div>
                <div className="acts">
                  <a className="btn btn-primary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Ajak kolaborasi <span className="arr">→</span></a>
                  <a className="btn btn-glass" href="#event">Lihat event</a>
                </div>
              </div>
              {collage.length > 0 && (
                <div className="collage" aria-hidden="true">
                  {collage.map((event, i) => (
                    <figure className={`f${i + 1}`} key={event.id}><img loading="lazy" src={event.imageUrl} alt="" /><figcaption>{event.title.replace(/^AIGrowth x /i, '')}</figcaption></figure>
                  ))}
                </div>
              )}
            </div>
            <div className="partners"><small>PERNAH BERKOLABORASI DENGAN</small>{PARTNERS.map((p) => <span key={p}>{p}</span>)}</div>
          </div>
        </div>
      </section>

      {/* ===== FOUNDERS ===== */}
      <section className="sec alt" id="founder">
        <div className="wrap about">
          <div>
            <span className="pill" data-reveal>People behind AIGrowth</span>
            <h2 data-split><Split parts={['Dibangun praktisi, ', ['buat praktisi.', 'grad']]} /></h2>
            <p className="lead" data-reveal style={{ '--d': 2 }}>AIGrowth.id adalah platform komunitas yang membahas Generative AI untuk konten, video, otomasi, dan produktivitas, lewat pengalaman yang praktis dan relevan.</p>
          </div>
          <div className="founders">
            <a className="fcard" href="https://www.instagram.com/adrianthe_/" target="_blank" rel="noopener noreferrer" style={{ backgroundImage: 'url(/adrian.png)' }} data-reveal>
              <span className="role">FOUNDER</span><span className="nm"><b>Adrian The</b><span>AI Strategist &amp; Creator</span></span><span className="go"><Arrow size={18} /></span>
            </a>
            <a className="fcard" href="https://www.instagram.com/adrieledgard/" target="_blank" rel="noopener noreferrer" style={{ backgroundImage: 'url(/adriel.png)', '--d': 2 }} data-reveal>
              <span className="role">CO-FOUNDER</span><span className="nm"><b>Adriel Edgard</b><span>AI Engineer &amp; Innovator</span></span><span className="go"><Arrow size={18} /></span>
            </a>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="sec" id="faq">
        <div className="wrap">
          <div className="faq-head">
            <span className="pill" data-reveal>FAQ</span>
            <h2 data-split><Split parts={['Masih ada yang ', ['bikin ragu?', 'grad']]} /></h2>
          </div>
          <div className="qa">
            {[FAQ.slice(0, 3), FAQ.slice(3)].map((col, ci) => (
              <div className="qa-col" key={ci}>
                {col.map(([q, a], i) => (
                  <details key={q} data-reveal style={{ '--d': i + ci }} open={ci === 0 && i === 0}>
                    <summary>{q}<i /></summary>
                    <p className="ans">{a}</p>
                  </details>
                ))}
              </div>
            ))}
          </div>
          <div className="faq-cta panel" data-reveal>
            <span><b>Belum ketemu jawabannya?</b> Tanya langsung tim AIGrowth.</span>
            <a className="btn btn-primary btn-sm" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={16} />+62 877-7353-5692</a>
          </div>
        </div>
      </section>

      {/* ===== FINAL ===== */}
      <section className="sec alt" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="final" data-reveal>
            <svg className="loop" viewBox="-2 -2 52 28" aria-hidden="true">
              <path className="b" d={INFINITY_PATH} />
              <path className="f" pathLength="100" d={INFINITY_PATH} />
              <path className="f f2" pathLength="100" d={INFINITY_PATH} />
            </svg>
            <h2>Siap masuk <span className="grad">loop-nya?</span></h2>
            <p className="lead">Belajar, praktik, tumbuh, ulangi. Gabung komunitas AIGrowth dan berkembang bareng di era AI.</p>
            <div className="acts">
              <a className="btn btn-primary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Join Komunitas <span className="arr">→</span></a>
              <a className="btn btn-glass" href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">Tonton gratis di YouTube</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <Link to="/" className="brand"><img src="/logo.jpg" alt="" /><span>AIGrowth</span></Link>
              <p>Komunitas AI praktis Indonesia. Tutorial nyata, course terarah, dan kolaborasi yang relevan.</p>
            </div>
            <div><h4>BELAJAR</h4><ul><li><Link to="/courses">Courses</Link></li><li><a href="#belajar">Video gratis</a></li><li><Link to="/tools">Tools</Link></li></ul></div>
            <div><h4>KOMUNITAS</h4><ul><li><a href="#event">Event</a></li><li><a href="#tim">Untuk tim</a></li><li><a href="#founder">Founder</a></li><li><a href="#faq">FAQ</a></li></ul></div>
            <div><h4>IKUTI</h4><ul><li><a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">YouTube</a></li><li><a href="https://www.instagram.com/aigrowth.id/" target="_blank" rel="noopener noreferrer">Instagram</a></li><li><a href="https://www.tiktok.com/@aigrowthid" target="_blank" rel="noopener noreferrer">TikTok</a></li><li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a></li></ul></div>
          </div>
          <svg className="foot-line" viewBox="0 0 1200 22" preserveAspectRatio="none" aria-hidden="true"><path d="M0 11 C 150 -4, 300 26, 450 11 S 750 -4, 900 11 S 1100 26, 1200 11" /></svg>
          <div className="foot-bot"><span>© 2026 AIGrowth.id</span><span>Belajar AI, praktikkan, terus tumbuh.</span></div>
        </div>
      </footer>

      <dialog
        className="vmodal"
        ref={dialogRef}
        onClose={() => {
          setVideoId('');
          engineRef.current?.resume();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeVideo();
        }}
      >
        <button className="vclose" type="button" onClick={closeVideo} aria-label="Tutup video">
          <svg className="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        {videoId && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title="Video AIGrowth"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}
      </dialog>
    </div>
  );
}
