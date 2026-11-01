import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import LeadsPanel from '../components/LeadsPanel';
import ContentEditor from '../components/admin/ContentEditor';
import ContentList from '../components/admin/ContentList';
import { SALES_TYPES, itemToForm } from '../components/admin/formModel';
import Toasts from '../components/admin/Toasts';
import { useToasts } from '../components/admin/useToasts';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '../data/contentDefaults';
import { deleteContentItem, fetchAllContentItems, fetchDeliveryUrl, slugify } from '../lib/contentApi';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import './Admin.css';

const LEAVE_MESSAGE = 'Ada perubahan yang belum disimpan. Yakin mau keluar dari editor?';

const NAV_ICONS = {
  analytics: '◔',
  leads: '◎',
  video: '▶',
  event: '✦',
  course: '◆',
  freebie: '✚',
  tool: '⚙',
};

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [view, setView] = useState('course');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editor, setEditor] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const editorCount = useRef(0);
  const { toasts, notify, dismiss } = useToasts();

  const loadItems = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setIsLoading(true);
    try {
      setItems(await fetchAllContentItems());
    } catch (error) {
      notify(error.message || 'Konten gagal dimuat.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadItems();
  }, [loadItems]);

  // Warn before closing or reloading the tab with unsaved edits
  useEffect(() => {
    if (!isDirty) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const counts = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      map[item.type] = (map[item.type] || 0) + 1;
    });
    return map;
  }, [items]);

  const typeItems = useMemo(() => items.filter((item) => item.type === view), [items, view]);

  const guard = (action) => {
    if (editor && isDirty && !window.confirm(LEAVE_MESSAGE)) return;
    setIsDirty(false);
    action();
  };

  const openEditor = (item, seed) => {
    editorCount.current += 1;
    setEditor({ key: editorCount.current, item, seed });
    window.scrollTo({ top: 0 });
  };

  const changeView = (next) => guard(() => {
    setEditor(null);
    setView(next);
    window.scrollTo({ top: 0 });
  });

  // On mobile the menu scrolls sideways; keep the active item in view
  useEffect(() => {
    document.querySelector('.adm-nav-item.is-active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [view]);

  const closeEditor = () => guard(() => setEditor(null));

  const duplicate = async (item) => {
    const title = `${item.title} (salinan)`;
    const seed = { ...itemToForm(item), title, slug: SALES_TYPES.includes(item.type) ? slugify(title) : '' };
    if (item.type === 'freebie') {
      try {
        seed.deliveryUrl = await fetchDeliveryUrl(item.id);
      } catch {
        // The copy can still be saved; the delivery link just has to be re-entered
      }
    }
    openEditor(null, seed);
    notify('Salinan dibuat. Cek lalu simpan.');
  };

  const remove = async (item) => {
    if (!window.confirm(`Yakin ingin menghapus ${CONTENT_TYPE_LABELS[item.type]}: ${item.title}?`)) return;
    try {
      await deleteContentItem(item.id);
      await loadItems({ quiet: true });
      notify(`${item.title} dihapus.`);
    } catch (error) {
      notify(error.message || 'Konten gagal dihapus.', 'error');
    }
  };

  const logout = () => guard(async () => {
    await supabase.auth.signOut();
    navigate('/login');
  });

  const navButton = (key, label, count) => (
    <button
      key={key}
      type="button"
      className={`adm-nav-item ${view === key ? 'is-active' : ''}`}
      onClick={() => changeView(key)}
      aria-current={view === key ? 'page' : undefined}
    >
      <i aria-hidden="true">{NAV_ICONS[key]}</i>
      <span>{label}</span>
      {count !== undefined && <small>{count}</small>}
    </button>
  );

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-side-brand">
          <img src="/logo.jpg" alt="" />
          <div>
            <b>Admin AIGrowth</b>
            <a href="/" target="_blank" rel="noopener noreferrer">Lihat website ↗</a>
          </div>
        </div>
        <nav className="adm-nav" aria-label="Menu admin">
          <span className="adm-nav-label">Ringkasan</span>
          {navButton('analytics', 'Analytics')}
          {navButton('leads', 'Leads & Penjualan')}
          <span className="adm-nav-label">Konten</span>
          {CONTENT_TYPES.map((type) => navButton(type, CONTENT_TYPE_LABELS[type], isLoading ? '·' : counts[type] || 0))}
        </nav>
        <button type="button" className="adm-logout" onClick={logout}>{t('admin_logout')}</button>
      </aside>

      <main className="adm-main">
        {view === 'analytics' && <AnalyticsDashboard />}
        {view === 'leads' && <LeadsPanel />}
        {CONTENT_TYPES.includes(view) && (editor ? (
          <ContentEditor
            key={editor.key}
            type={view}
            item={editor.item}
            seed={editor.seed}
            onBack={closeEditor}
            onSaved={() => loadItems({ quiet: true })}
            onDirtyChange={setIsDirty}
            notify={notify}
          />
        ) : (
          <ContentList
            type={view}
            items={typeItems}
            isLoading={isLoading}
            onAdd={() => openEditor(null, null)}
            onEdit={(item) => openEditor(item, null)}
            onDuplicate={duplicate}
            onDelete={remove}
          />
        ))}
      </main>

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
