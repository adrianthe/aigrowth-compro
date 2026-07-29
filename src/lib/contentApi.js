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

export function getYouTubeVideoId(value) {
  if (!value) return '';

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, '');
    let candidate = '';

    if (hostname === 'youtu.be') candidate = url.pathname.split('/').filter(Boolean)[0] || '';
    if (hostname.endsWith('youtube.com')) {
      candidate = url.searchParams.get('v') || '';
      if (!candidate) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live'].includes(parts[0])) candidate = parts[1] || '';
      }
    }

    return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : '';
  } catch {
    return /^[A-Za-z0-9_-]{11}$/.test(value) ? value : '';
  }
}
