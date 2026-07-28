import { getDefaultContent } from '../data/contentDefaults';

export async function fetchContentItems(type) {
  const fallback = getDefaultContent(type);

  try {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    const response = await fetch(`/api/content${query}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) throw new Error('Content API unavailable');
    const payload = await response.json();
    return Array.isArray(payload.items) ? payload.items : fallback;
  } catch {
    return fallback;
  }
}

export function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
