import { useState } from 'react';
import { CONTENT_TYPE_LABELS } from '../../data/contentDefaults';
import { formatRupiah, getContentPath } from '../../lib/contentApi';
import { itemReadiness } from './formModel';

const TYPE_HINTS = {
  video: 'Video YouTube yang tampil di homepage.',
  event: 'Dokumentasi event, workshop, dan kolaborasi.',
  course: 'Course berbayar dengan halaman jualan dan checkout Mayar.',
  freebie: 'Materi gratis yang dibuka setelah pengunjung isi nama + WhatsApp.',
  tool: 'Rekomendasi tools AI di halaman Tools.',
};

const formatDate = (value) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function StatusChips({ item }) {
  const path = getContentPath(item);
  const chips = [];

  if (item.type === 'course' || item.type === 'freebie') {
    chips.push(path
      ? <a key="live" className="adm-chip is-ok" href={path} target="_blank" rel="noopener noreferrer">● Live {path} ↗</a>
      : <span key="page" className="adm-chip is-muted">Belum ada halaman</span>);
  }
  if (item.type === 'course') {
    if (path && !item.checkoutUrl) chips.push(<span key="checkout" className="adm-chip is-warn">Belum ada link checkout</span>);
    if (item.price > 0) {
      chips.push(
        <span key="price" className="adm-chip">
          {formatRupiah(item.price)}
          {item.comparePrice > item.price && <s>{formatRupiah(item.comparePrice)}</s>}
        </span>,
      );
    }
    const readiness = itemReadiness(item);
    if (readiness && path) {
      chips.push(
        <span key="ready" className={`adm-chip ${readiness.done === readiness.total ? 'is-ok' : ''}`}>
          Kesiapan {readiness.done}/{readiness.total}
        </span>,
      );
    }
  }
  if (item.type === 'event' && item.eventDate) chips.push(<span key="date" className="adm-chip">{formatDate(item.eventDate)}</span>);
  if (item.featured) chips.push(<span key="featured" className="adm-chip is-cyan">★ Rekomendasi</span>);
  if (item.category) chips.push(<span key="cat" className="adm-chip is-muted">{item.category}</span>);

  return <div className="adm-chips">{chips}</div>;
}

export default function ContentList({ type, items, isLoading, onAdd, onEdit, onDuplicate, onDelete }) {
  const [search, setSearch] = useState('');
  const label = CONTENT_TYPE_LABELS[type];
  const query = search.trim().toLowerCase();
  const visible = query
    ? items.filter((item) => `${item.title} ${item.description} ${item.category} ${item.slug}`.toLowerCase().includes(query))
    : items;

  return (
    <section className="adm-view">
      <header className="adm-view-head">
        <div>
          <span className="adm-pill">{label}</span>
          <h1>Daftar {label.toLowerCase()}</h1>
          <p>{TYPE_HINTS[type]}</p>
        </div>
        <button type="button" className="adm-btn adm-btn-primary" onClick={onAdd}>+ Tambah {label.toLowerCase()}</button>
      </header>

      <div className="adm-searchbar">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Cari ${label.toLowerCase()}...`}
          aria-label={`Cari ${label.toLowerCase()}`}
        />
        <small>{visible.length} item</small>
      </div>

      <div className="adm-list">
        {isLoading && <div className="adm-empty">Memuat konten...</div>}
        {!isLoading && items.length === 0 && (
          <div className="adm-empty">
            <strong>Belum ada {label.toLowerCase()}.</strong>
            <span>Mulai dengan menambahkan yang pertama.</span>
            <button type="button" className="adm-btn adm-btn-primary" onClick={onAdd}>+ Tambah {label.toLowerCase()}</button>
          </div>
        )}
        {!isLoading && items.length > 0 && visible.length === 0 && <div className="adm-empty">Tidak ada yang cocok dengan “{search}”.</div>}

        {visible.map((item) => {
          const path = getContentPath(item);
          return (
            <article className="adm-item" key={item.id}>
              <button type="button" className="adm-item-thumb" onClick={() => onEdit(item)} aria-label={`Edit ${item.title}`}>
                {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : <span>{label.slice(0, 2).toUpperCase()}</span>}
              </button>
              <div className="adm-item-body">
                <button type="button" className="adm-item-title" onClick={() => onEdit(item)}>{item.title}</button>
                <p>{item.description}</p>
                <StatusChips item={item} />
              </div>
              <div className="adm-item-actions">
                <button type="button" className="adm-btn adm-btn-soft" onClick={() => onEdit(item)}>Edit</button>
                {path && <a className="adm-btn adm-btn-ghost" href={path} target="_blank" rel="noopener noreferrer">Buka halaman</a>}
                {item.type === 'video' && item.url && <a className="adm-btn adm-btn-ghost" href={item.url} target="_blank" rel="noopener noreferrer">Buka YouTube</a>}
                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => onDuplicate(item)}>Duplikat</button>
                <button type="button" className="adm-btn adm-btn-danger" onClick={() => onDelete(item)}>Hapus</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
