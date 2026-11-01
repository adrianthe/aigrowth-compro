import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { Arrow, GradTail } from '../components/ui';
import { useLanguage } from '../contexts/LanguageContext';
import { getDefaultContent } from '../data/contentDefaults';
import { pad } from '../lib/brand';
import { fetchContentItems } from '../lib/contentApi';
import { WHATSAPP_URL } from '../lib/site';

const ALL = 'Semua';

export default function Studio({ type = 'course' }) {
  const { t } = useLanguage();
  const isFree = type === 'freebie';
  const [loaded, setLoaded] = useState({ type: null, items: [] });
  const [filter, setFilter] = useState({ type, category: ALL });
  const courses = loaded.type === type ? loaded.items : getDefaultContent(type);
  const category = filter.type === type ? filter.category : ALL;

  useEffect(() => {
    let active = true;
    fetchContentItems(type).then((items) => {
      if (active) setLoaded({ type, items });
    });
    return () => {
      active = false;
    };
  }, [type]);

  const categories = useMemo(() => {
    const counts = new Map();
    courses.forEach((course) => {
      if (course.category) counts.set(course.category, (counts.get(course.category) || 0) + 1);
    });
    return [...counts];
  }, [courses]);
  const shown = category === ALL ? courses : courses.filter((course) => course.category === category);

  return (
    <div className="ui">
      <section className="wrap page-hero">
        <div className="copy">
          <span className="pill" data-reveal>{isFree ? 'AIGrowth freebies' : 'AIGrowth learning'}</span>
          <h1 data-reveal style={{ '--d': 1 }}><GradTail text={t(isFree ? 'freebies_title' : 'courses_title')} /></h1>
          <p className="lead" data-reveal style={{ '--d': 2 }}>{t(isFree ? 'freebies_subtitle' : 'courses_subtitle')}</p>
        </div>
        {courses.length > 0 && (
          <div className="hero-stat panel" data-reveal style={{ '--d': 3 }}>
            <b className="grad">{pad(courses.length)}</b>
            <span>{isFree ? 'FREEBIES' : 'COURSE'}<br />TERSEDIA</span>
          </div>
        )}
      </section>

      <section className="wrap">
        {categories.length > 1 && (
          <div className="chips" role="group" aria-label="Filter kategori">
            {[[ALL, courses.length], ...categories].map(([name, count]) => (
              <button key={name} type="button" className={`chip${category === name ? ' on' : ''}`} aria-pressed={category === name} onClick={() => setFilter({ type, category: name })}>
                {name}<small>{count}</small>
              </button>
            ))}
          </div>
        )}
        <div className="cgrid">
          {shown.length === 0 && <div className="empty panel">{isFree ? 'Freebies baru lagi disiapkan. Sementara itu, tonton tutorial gratisnya di YouTube AIGrowth.' : 'Course baru lagi disiapkan.'}</div>}
          {shown.map((course, index) => <CourseCard key={course.id} course={course} index={index} style={{ '--d': index }} />)}
        </div>
      </section>

      <section className="wrap sec-final">
        <div className="final">
          <span className="pill">{isFree ? 'Mau lebih dalam?' : 'Masih bingung?'}</span>
          <h2>{isFree ? <>Siap naik ke <span className="grad">course lengkap?</span></> : <>Ceritain kebutuhanmu, <span className="grad">kami pilihin.</span></>}</h2>
          <p className="lead">{isFree ? 'Materi gratis buat mulai. Kalau mau terarah dari nol sampai jadi, ambil course-nya.' : 'Chat tim AIGrowth di WhatsApp, nanti diarahkan ke course yang paling pas buat kamu.'}</p>
          <div className="acts">
            {isFree
              ? <Link className="btn btn-primary" to="/courses">Lihat semua course <span className="arr">→</span></Link>
              : <a className="btn btn-primary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Chat via WhatsApp <span className="arr">→</span></a>}
            <Link className="btn btn-glass" to={isFree ? '/' : '/gratis'}>{isFree ? 'Kenalan sama AIGrowth' : 'Mulai dari yang gratis'} <Arrow /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
