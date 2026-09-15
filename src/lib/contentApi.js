import { getDefaultContent } from '../data/contentDefaults';
import { isSupabaseConfigured, supabase } from './supabaseClient';

function fromDatabase(item) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    category: item.category || '',
    url: item.url || '',
    imageUrl: item.image_url || '',
    eventDate: item.event_date || '',
    label: item.label || '',
    featured: Boolean(item.featured),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function toDatabase(item) {
  return {
    ...(item.id ? { id: item.id } : {}),
    type: item.type,
    title: item.title.trim(),
    description: item.description.trim(),
    category: item.category.trim() || null,
    url: item.url.trim() || null,
    image_url: item.imageUrl.trim() || null,
    event_date: item.eventDate || null,
    label: item.label.trim() || null,
    featured: Boolean(item.featured),
    published: true,
  };
}

export async function fetchContentItems(type) {
  const fallback = getDefaultContent(type);
  if (!isSupabaseConfigured) return fallback;

  let query = supabase
    .from('content_items')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return fallback;
  return data.map(fromDatabase);
}

export async function fetchAllContentItems() {
  if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');

  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(fromDatabase);
}

export async function saveContentItem(item) {
  if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');

  const payload = toDatabase(item);
  const query = item.id
    ? supabase.from('content_items').update(payload).eq('id', item.id)
    : supabase.from('content_items').insert(payload);

  const { data, error } = await query.select().single();
  if (error) throw error;
  return fromDatabase(data);
}

export async function deleteContentItem(id) {
  if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await supabase.from('content_items').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadContentImage(file, contentType) {
  if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${contentType}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('content-images')
    .upload(filename, file, { contentType: file.type, upsert: false });

  if (error) throw error;
  return supabase.storage.from('content-images').getPublicUrl(filename).data.publicUrl;
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
