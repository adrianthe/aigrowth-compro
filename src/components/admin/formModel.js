import { getContentPath, slugify } from '../../lib/contentApi';

export const SALES_TYPES = ['course', 'freebie'];
export const SITE_ORIGIN = 'https://www.aigrowth.id';

let rowCounter = 0;
// Row editors need stable keys so moving a row keeps its input focus and state
const rowKey = () => `r${(rowCounter += 1)}`;

export const textRow = (text = '') => ({ key: rowKey(), text });
export const moduleRow = (title = '', detail = '') => ({ key: rowKey(), title, detail });
export const faqRow = (q = '', a = '') => ({ key: rowKey(), q, a });

export const emptyForm = {
  title: '',
  description: '',
  category: '',
  url: '',
  imageUrl: '',
  eventDate: '',
  label: '',
  featured: false,
  slug: '',
  price: '',
  comparePrice: '',
  checkoutUrl: '',
  deliveryUrl: '',
  headline: '',
  subheadline: '',
  videoUrl: '',
  ctaLabel: '',
  benefits: [],
  audience: [],
  curriculum: [],
  faq: [],
};

export function itemToForm(item) {
  const sales = item.sales || {};
  return {
    ...emptyForm,
    title: item.title || '',
    description: item.description || '',
    category: item.category || '',
    url: item.url || '',
    imageUrl: item.imageUrl || '',
    eventDate: item.eventDate || '',
    label: item.label || '',
    featured: Boolean(item.featured),
    slug: item.slug || '',
    price: item.price == null ? '' : String(item.price),
    comparePrice: item.comparePrice == null ? '' : String(item.comparePrice),
    checkoutUrl: item.checkoutUrl || '',
    headline: sales.headline || '',
    subheadline: sales.subheadline || '',
    videoUrl: sales.videoUrl || '',
    ctaLabel: sales.ctaLabel || '',
    benefits: (sales.benefits || []).map((text) => textRow(text)),
    audience: (sales.audience || []).map((text) => textRow(text)),
    curriculum: (sales.curriculum || []).map((row) => moduleRow(row.title, row.detail)),
    faq: (sales.faq || []).map((row) => faqRow(row.q, row.a)),
  };
}

const cleanTexts = (rows) => rows.map((row) => row.text.trim()).filter(Boolean);

// Same jsonb shape the sales page (Offer.jsx) reads
export function salesFromForm(form) {
  return {
    headline: form.headline.trim(),
    subheadline: form.subheadline.trim(),
    videoUrl: form.videoUrl.trim(),
    ctaLabel: form.ctaLabel.trim(),
    benefits: cleanTexts(form.benefits),
    audience: cleanTexts(form.audience),
    curriculum: form.curriculum
      .map((row) => ({ title: row.title.trim(), detail: row.detail.trim() }))
      .filter((row) => row.title),
    faq: form.faq
      .map((row) => ({ q: row.q.trim(), a: row.a.trim() }))
      .filter((row) => row.q && row.a),
  };
}

export function formToItem(form, type, id) {
  const isSalesType = SALES_TYPES.includes(type);
  return {
    ...form,
    id: id || undefined,
    type,
    slug: isSalesType ? form.slug : '',
    price: type === 'course' ? form.price : '',
    comparePrice: type === 'course' ? form.comparePrice : '',
    checkoutUrl: type === 'course' ? form.checkoutUrl : '',
    sales: isSalesType ? salesFromForm(form) : {},
  };
}

// Comparable snapshot for the unsaved-changes indicator (row keys excluded)
export function formSignature(form) {
  return JSON.stringify({ ...form, ...salesFromForm(form) });
}

export function validateForm(form, type) {
  if (!form.title.trim() || !form.description.trim()) return 'Judul dan deskripsi wajib diisi.';
  if (type === 'video' && !form.url.trim()) return 'Link video YouTube wajib diisi.';
  if (form.slug && form.slug !== slugify(form.slug)) {
    return 'Alamat halaman hanya boleh huruf kecil, angka, dan tanda strip. Contoh: ai-influencer';
  }
  if (form.checkoutUrl && !/^https:\/\//.test(form.checkoutUrl.trim())) return 'Link checkout Mayar harus diawali https://';
  if (type === 'freebie' && !form.slug) return 'Freebies butuh alamat halaman supaya form-nya bisa dibuka.';
  return '';
}

export function pagePath(type, slug) {
  return getContentPath({ type, slug });
}

export const discountPercent = (price, compare) => {
  const p = Number(price);
  const c = Number(compare);
  if (!p || !c || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
};

// What a sales page needs before it is worth sending traffic to
export function readinessChecks(form, type) {
  const benefits = cleanTexts(form.benefits).length;
  const base = [
    { id: 'info', label: 'Judul & deskripsi', done: Boolean(form.title.trim() && form.description.trim()) },
    { id: 'image', label: 'Gambar cover', done: Boolean(form.imageUrl) },
    { id: 'page', label: 'Alamat halaman', done: Boolean(form.slug) },
  ];
  if (type === 'course') {
    return [
      ...base,
      { id: 'pricing', label: 'Harga', done: Number(form.price) > 0 },
      { id: 'pricing', label: 'Link checkout Mayar', done: /^https:\/\//.test(form.checkoutUrl.trim()) },
      { id: 'benefits', label: 'Minimal 3 benefit', done: benefits >= 3, hint: `${benefits}/3` },
      { id: 'curriculum', label: 'Kurikulum / modul', done: salesFromForm(form).curriculum.length > 0 },
      { id: 'faq', label: 'FAQ', done: salesFromForm(form).faq.length > 0 },
    ];
  }
  if (type === 'freebie') {
    return [
      ...base,
      { id: 'delivery', label: 'Link materi', done: /^https?:\/\//.test(form.deliveryUrl.trim()) },
      { id: 'benefits', label: 'Minimal 3 benefit', done: benefits >= 3, hint: `${benefits}/3` },
      { id: 'audience', label: 'Cocok untuk siapa', done: cleanTexts(form.audience).length > 0 },
      { id: 'faq', label: 'FAQ', done: salesFromForm(form).faq.length > 0 },
    ];
  }
  return [];
}

// Readiness for the list view, from a saved item (freebie delivery links are private, so skipped)
export function itemReadiness(item) {
  if (item.type !== 'course') return null;
  const checks = readinessChecks(itemToForm(item), 'course');
  return { done: checks.filter((check) => check.done).length, total: checks.length };
}
