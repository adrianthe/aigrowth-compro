import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const RANGE_OPTIONS = [7, 30, 90];

function countBy(items, getKey) {
  const counts = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
}

function getHostname(value, fallback) {
  if (!value) return fallback;
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return fallback;
  }
}

function getDestination(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}`;
  } catch {
    return value;
  }
}

function RankingList({ items, emptyText }) {
  const maximum = items[0]?.value || 1;

  if (!items.length) return <div className="analytics-empty">{emptyText}</div>;

  return (
    <div className="analytics-ranking">
      {items.slice(0, 6).map((item) => (
        <div className="analytics-rank-row" key={item.label}>
          <div className="analytics-rank-copy">
            <span title={item.label}>{item.label}</span>
            <strong>{item.value.toLocaleString('id-ID')}</strong>
          </div>
          <div className="analytics-rank-track">
            <span style={{ width: `${Math.max((item.value / maximum) * 100, 4)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [range, setRange] = useState(30);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      setIsLoading(true);
      setErrorMessage('');

      if (!isSupabaseConfigured) {
        setErrorMessage('Supabase belum dikonfigurasi.');
        setIsLoading(false);
        return;
      }

      const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('traffic_events')
        .select('event_type,page_path,destination_url,referrer,session_id,occurred_at')
        .gte('occurred_at', since)
        .order('occurred_at', { ascending: false })
        .limit(10000);

      if (!active) return;
      if (error) setErrorMessage(error.message);
      else setEvents(data || []);
      setIsLoading(false);
    }

    loadEvents();
    return () => {
      active = false;
    };
  }, [range]);

  const report = useMemo(() => {
    const pageViews = events.filter((event) => event.event_type === 'page_view');
    const outboundClicks = events.filter((event) => event.event_type === 'outbound_click');
    const visitors = new Set(pageViews.map((event) => event.session_id).filter(Boolean));

    return {
      pageViews: pageViews.length,
      visitors: visitors.size,
      outboundClicks: outboundClicks.length,
      clickRate: pageViews.length ? Math.round((outboundClicks.length / pageViews.length) * 1000) / 10 : 0,
      pages: countBy(pageViews, (event) => event.page_path || '/'),
      referrers: countBy(pageViews, (event) => getHostname(event.referrer, 'Direct / tidak diketahui')),
      destinations: countBy(outboundClicks, (event) => getDestination(event.destination_url)),
    };
  }, [events]);

  return (
    <section className="analytics-dashboard">
      <div className="analytics-toolbar">
        <div>
          <h2>Ringkasan Traffic</h2>
          <p>Data pengunjung dan klik keluar yang tercatat langsung dari website.</p>
        </div>
        <div className="range-selector" aria-label="Rentang analytics">
          {RANGE_OPTIONS.map((days) => (
            <button key={days} type="button" className={range === days ? 'active' : ''} onClick={() => setRange(days)}>
              {days} hari
            </button>
          ))}
        </div>
      </div>

      {errorMessage && <div className="error-message glass-panel">{errorMessage}</div>}
      {isLoading ? (
        <div className="glass-panel empty-state">Memuat analytics...</div>
      ) : (
        <>
          <div className="analytics-metrics">
            <article className="analytics-metric glass-panel"><span>Page views</span><strong>{report.pageViews.toLocaleString('id-ID')}</strong></article>
            <article className="analytics-metric glass-panel"><span>Pengunjung</span><strong>{report.visitors.toLocaleString('id-ID')}</strong></article>
            <article className="analytics-metric glass-panel"><span>Klik keluar</span><strong>{report.outboundClicks.toLocaleString('id-ID')}</strong></article>
            <article className="analytics-metric glass-panel"><span>Rasio klik</span><strong>{report.clickRate}%</strong></article>
          </div>

          <div className="analytics-panels">
            <article className="analytics-panel glass-panel">
              <h3>Halaman terpopuler</h3>
              <RankingList items={report.pages} emptyText="Belum ada page view." />
            </article>
            <article className="analytics-panel glass-panel">
              <h3>Sumber traffic</h3>
              <RankingList items={report.referrers} emptyText="Belum ada data sumber traffic." />
            </article>
            <article className="analytics-panel glass-panel analytics-panel-wide">
              <h3>Traffic diarahkan ke mana</h3>
              <RankingList items={report.destinations} emptyText="Belum ada klik menuju situs lain." />
            </article>
          </div>
        </>
      )}
    </section>
  );
}
