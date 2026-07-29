import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getDefaultContent } from '../data/contentDefaults';
import { fetchContentItems } from '../lib/contentApi';
import './Studio.css';

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
        <div className="gallery-header fade-in courses-header">
          <div className="tagline glass-panel">AIGrowth Learning</div>
          <h1 className="section-title">{t('courses_title')}</h1>
          <p className="hero-subtitle text-center">{t('courses_subtitle')}</p>
        </div>

        <div className="studio-grid fade-in">
          {courses.length === 0 && <div className="glass-panel empty-state">Belum ada course yang dipublikasikan.</div>}
          {courses.map((course) => (
            <article key={course.id} className="studio-card glass-panel course-card">
              <div className={`course-cover ${course.imageUrl ? '' : 'course-cover-placeholder'}`}>
                {course.imageUrl ? <img src={course.imageUrl} alt={course.title} /> : <span>AIGROWTH COURSE</span>}
              </div>
              <div className="studio-info">
                <div className="course-card-meta">
                  <span className="studio-category">{course.category || 'Course'}</span>
                  {course.featured && <span className="course-featured">Rekomendasi</span>}
                </div>
                <h2 className="studio-title">{course.title}</h2>
                <p className="course-description">{course.description}</p>
                {course.url && (
                  <a href={course.url} target="_blank" rel="noopener noreferrer" className="course-link">
                    {course.label || 'Lihat Detail Course'}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
