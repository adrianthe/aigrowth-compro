import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getDefaultContent } from '../data/contentDefaults';
import { fetchContentItems } from '../lib/contentApi';
import './Studio.css';

function CourseCard({ course, index }) {
  const Card = course.url ? 'a' : 'article';
  const linkProps = course.url
    ? {
        href: course.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': `${course.title} - ${course.label || 'Lihat course'}`,
      }
    : {};

  return (
    <Card
      {...linkProps}
      className={`studio-card course-card ${course.url ? 'course-card-clickable' : ''}`}
    >
      <div className={`course-cover ${course.imageUrl ? '' : 'course-cover-placeholder'}`}>
        {course.imageUrl ? <img src={course.imageUrl} alt={course.title} loading="lazy" /> : <span>AIGROWTH COURSE</span>}
        <span className="course-number">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="studio-info">
        <div className="course-card-meta">
          <span className="studio-category">{course.category || 'Course'}</span>
          {course.featured && <span className="course-featured">Pilihan</span>}
        </div>
        <h2 className="studio-title">{course.title}</h2>
        <p className="course-description">{course.description}</p>
        <span className={`course-link ${course.url ? '' : 'course-link-disabled'}`}>
          {course.url ? (course.label || 'Lihat Detail Course') : 'Segera hadir'}
          {course.url && <span aria-hidden="true">↗</span>}
        </span>
      </div>
    </Card>
  );
}

export default function Studio() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState(() => getDefaultContent('course'));

  useEffect(() => {
    let active = true;
    fetchContentItems('course').then((items) => {
      if (active) setCourses(items);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="studio-page">
      <section className="container courses-section">
        <div className="gallery-header fade-in courses-header glass-panel">
          <div className="courses-header-copy">
            <div className="courses-eyebrow">AIGROWTH LEARNING</div>
            <h1 className="section-title">{t('courses_title')}</h1>
            <p className="hero-subtitle">{t('courses_subtitle')}</p>
          </div>
          <div className="courses-count" aria-label={`${courses.length} course tersedia`}>
            <strong>{String(courses.length).padStart(2, '0')}</strong>
            <span>COURSE<br />TERSEDIA</span>
          </div>
        </div>

        <div className="studio-grid fade-in">
          {courses.length === 0 && <div className="glass-panel empty-state">Belum ada course yang dipublikasikan.</div>}
          {courses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}
        </div>
      </section>
    </div>
  );
}
