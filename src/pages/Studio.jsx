import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getDefaultContent } from '../data/contentDefaults';
import { fetchContentItems, formatRupiah, getContentPath } from '../lib/contentApi';
import './Studio.css';

function CourseCard({ course, index }) {
  // Own sales page first, then the old external link (Scalev/Lynk/s.id)
  const path = getContentPath(course);
  const isFree = course.type === 'freebie';
  const Card = path ? Link : course.url ? 'a' : 'article';
  const ariaLabel = `${course.title} - ${course.label || (isFree ? 'Ambil gratis' : 'Lihat course')}`;
  const linkProps = path
    ? { to: path, 'aria-label': ariaLabel }
    : course.url
      ? { href: course.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': ariaLabel }
      : {};
  const hasLink = Boolean(path || course.url);

  return (
    <Card
      {...linkProps}
      className={`studio-card course-card ${hasLink ? 'course-card-clickable' : ''}`}
    >
      <div className={`course-cover ${course.imageUrl ? '' : 'course-cover-placeholder'}`}>
        {course.imageUrl ? <img src={course.imageUrl} alt={course.title} loading="lazy" /> : <span>{isFree ? 'AIGROWTH FREEBIES' : 'AIGROWTH COURSE'}</span>}
        <span className="course-number">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="studio-info">
        <div className="course-card-meta">
          <span className="studio-category">{course.category || (isFree ? 'Gratis' : 'Course')}</span>
          {course.featured && <span className="course-featured">Pilihan</span>}
          {course.price > 0 && <span className="course-price">{formatRupiah(course.price)}</span>}
        </div>
        <h2 className="studio-title">{course.title}</h2>
        <p className="course-description">{course.description}</p>
        <span className={`course-link ${hasLink ? '' : 'course-link-disabled'}`}>
          {hasLink ? (course.label || (isFree ? 'Ambil Gratis' : 'Lihat Detail Course')) : 'Segera hadir'}
          {hasLink && <span aria-hidden="true">{path ? '→' : '↗'}</span>}
        </span>
      </div>
    </Card>
  );
}

export default function Studio({ type = 'course' }) {
  const { t } = useLanguage();
  const isFree = type === 'freebie';
  const [loaded, setLoaded] = useState({ type: null, items: [] });
  const courses = loaded.type === type ? loaded.items : getDefaultContent(type);

  useEffect(() => {
    let active = true;
    fetchContentItems(type).then((items) => {
      if (active) setLoaded({ type, items });
    });
    return () => {
      active = false;
    };
  }, [type]);

  return (
    <div className="studio-page">
      <section className="container courses-section">
        <div className="gallery-header fade-in courses-header glass-panel">
          <div className="courses-header-copy">
            <div className="courses-eyebrow">{isFree ? 'AIGROWTH FREEBIES' : 'AIGROWTH LEARNING'}</div>
            <h1 className="section-title">{t(isFree ? 'freebies_title' : 'courses_title')}</h1>
            <p className="hero-subtitle">{t(isFree ? 'freebies_subtitle' : 'courses_subtitle')}</p>
          </div>
          <div className="courses-count" aria-label={`${courses.length} ${isFree ? 'freebies' : 'course'} tersedia`}>
            <strong>{String(courses.length).padStart(2, '0')}</strong>
            <span>{isFree ? 'FREEBIES' : 'COURSE'}<br />TERSEDIA</span>
          </div>
        </div>

        <div className="studio-grid fade-in">
          {courses.length === 0 && <div className="glass-panel empty-state">Belum ada {isFree ? 'freebies' : 'course'} yang dipublikasikan.</div>}
          {courses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}
        </div>
      </section>
    </div>
  );
}
