import { useEffect, useMemo, useState } from 'react';
import { Arrow, LoopArt } from '../components/ui';
import { getDefaultContent } from '../data/contentDefaults';
import { pad } from '../lib/brand';
import { fetchContentItems } from '../lib/contentApi';

const ALL = 'Semua';

function ToolCard({ tool, index }) {
  return (
    <article className="course tool" style={{ '--d': index }}>
      <div className="cimg">
        {tool.imageUrl ? <img loading="lazy" src={tool.imageUrl} alt={tool.title} /> : <LoopArt />}
        {tool.featured && <span className="tg pick">Rekomendasi</span>}
        <span className="num">{pad(index + 1)}</span>
      </div>
      <div className="cbody">
        <small>{tool.category || 'AI tool'}</small>
        <h3>{tool.url ? <a className="cover-link" href={tool.url} target="_blank" rel="noopener noreferrer">{tool.title}</a> : tool.title}</h3>
        <p>{tool.description}</p>
        <div className="cfoot">
          <span>{tool.label || 'Dipakai tim AIGrowth'}</span>
          {tool.url && <a href={tool.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">Buka tool <Arrow size={14} /></a>}
        </div>
      </div>
    </article>
  );
}

export default function Tools() {
  const [tools, setTools] = useState(() => getDefaultContent('tool'));
  const [category, setCategory] = useState(ALL);

  useEffect(() => {
    let active = true;
    fetchContentItems('tool').then((items) => {
      if (active) setTools(items);
    });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => [ALL, ...new Set(tools.map((tool) => tool.category).filter(Boolean))],
    [tools],
  );
  const shown = category === ALL ? tools : tools.filter((tool) => tool.category === category);

  return (
    <div className="ui">
      <section className="wrap page-hero">
        <div className="copy">
          <span className="pill" data-reveal>AIGrowth toolkit</span>
          <h1 data-reveal style={{ '--d': 1 }}>Tools yang kami <span className="grad">pakai tiap hari.</span></h1>
          <p className="lead" data-reveal style={{ '--d': 2 }}>Rekomendasi platform AI yang dipakai tim AIGrowth buat bikin konten, riset, dan otomasi kerjaan.</p>
        </div>
        <div className="hero-stat panel" data-reveal style={{ '--d': 3 }}>
          <b className="grad">{pad(tools.length)}</b>
          <span>TOOLS<br />PILIHAN</span>
        </div>
      </section>

      <section className="wrap">
        {categories.length > 2 && (
          <div className="chips" role="group" aria-label="Filter kategori">
            {categories.map((name) => (
              <button key={name} type="button" className={`chip${category === name ? ' on' : ''}`} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>
            ))}
          </div>
        )}
        <div className="cgrid">
          {shown.length === 0 && <div className="empty panel">Belum ada tool di kategori ini.</div>}
          {shown.map((tool, index) => <ToolCard key={tool.id} tool={tool} index={index} />)}
        </div>
        <p className="note">*Beberapa tautan di atas adalah tautan afiliasi. AIGrowth bisa menerima komisi tanpa biaya tambahan buat kamu.</p>
      </section>

      <div className="sec-final" />
    </div>
  );
}
