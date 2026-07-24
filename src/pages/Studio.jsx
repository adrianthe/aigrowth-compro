import { useLanguage } from '../contexts/LanguageContext';
import './Studio.css';

const courses = [
  {
    id: 1,
    title: 'Open Claw Course',
    category: 'Online Course',
    description: 'Kelas praktis dari AIGrowth untuk membantu Anda menerapkan AI ke dalam alur kerja profesional secara terarah.',
    href: 'https://s.id/openclawadr',
  },
];

export default function Studio() {
  const { t } = useLanguage();

  return (
    <div className="studio-page">
      <section className="container courses-section">
        <div className="gallery-header fade-in courses-header">
          <div className="tagline glass-panel">AIGrowth Learning</div>
          <h1 className="section-title">{t('courses_title')}</h1>
          <p className="hero-subtitle text-center">{t('courses_subtitle')}</p>
        </div>

        <div className="studio-grid fade-in">
          {courses.map((course) => (
            <article key={course.id} className="studio-card glass-panel course-card">
              <div className="studio-info">
                <span className="studio-category">{course.category}</span>
                <h2 className="studio-title">{course.title}</h2>
                <p className="course-description">{course.description}</p>
                <a href={course.href} target="_blank" rel="noopener noreferrer" className="course-link">
                  Lihat Detail Course
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}