import { Link } from 'react-router-dom';
import { formatRupiah, getContentPath } from '../lib/contentApi';
import { pad } from '../lib/brand';
import { Arrow, LoopArt } from './ui';

// Course/freebie card used on the homepage rail and the /courses and /gratis grids
export default function CourseCard({ course, index, style }) {
  const free = course.type === 'freebie' || /free|gratis/i.test(`${course.category} ${course.title} ${course.label}`);
  const path = getContentPath(course);
  const label = (course.label || (free ? 'Ambil gratis' : 'Lihat detail')).replace(/!+$/, '');
  const hasDiscount = course.comparePrice > course.price && course.price > 0;

  return (
    <article className="course" style={style}>
      <div className="cimg">
        {course.imageUrl ? <img loading="lazy" src={course.imageUrl} alt={course.title} /> : <LoopArt />}
        {free ? <span className="tg pick">Gratis</span> : course.featured && <span className="tg pick">Pilihan</span>}
        <span className="num">{pad(index + 1)}</span>
      </div>
      <div className="cbody">
        <small>{course.category || (free ? 'Freebies' : 'Course')}</small>
        <h3>{path ? <Link className="cover-link" to={path}>{course.title}</Link> : course.title}</h3>
        <p>{course.description}</p>
        <div className="cfoot">
          {course.price > 0 ? (
            <span className="cprice">
              {hasDiscount && <s>{formatRupiah(course.comparePrice)}</s>}
              <b>{formatRupiah(course.price)}</b>
            </span>
          ) : (
            <span>{free ? 'Gratis' : 'Online course'}</span>
          )}
          {path ? (
            <Link to={path} tabIndex={-1} aria-hidden="true">{label} <Arrow size={14} /></Link>
          ) : course.url ? (
            <a href={course.url} target="_blank" rel="noopener noreferrer">{label} <Arrow size={14} /></a>
          ) : (
            <span>Segera hadir</span>
          )}
        </div>
      </div>
    </article>
  );
}
