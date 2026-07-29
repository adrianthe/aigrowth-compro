import { list, put } from '@vercel/blob';
import { getDefaultContent } from '../src/data/contentDefaults.js';

const CONTENT_PATH = 'cms/aigrowth-content.json';

function migrateContentItems(items) {
  if (!Array.isArray(items)) return getDefaultContent();

  const migrated = items.filter((item) => item?.type !== 'article');
  if (!migrated.some((item) => item.type === 'video')) {
    migrated.push(...getDefaultContent('video'));
  }
  return migrated;
}

export async function readContentItems() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return getDefaultContent();

  const result = await list({ prefix: CONTENT_PATH, limit: 10, token });
  const blob = result.blobs.find((item) => item.pathname === CONTENT_PATH);
  if (!blob) return getDefaultContent();

  const response = await fetch(`${blob.url}?v=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) return getDefaultContent();

  const payload = await response.json();
  return migrateContentItems(payload.items);
}

export async function writeContentItems(items) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Penyimpanan konten belum dikonfigurasi.');

  await put(CONTENT_PATH, JSON.stringify({ items: migrateContentItems(items) }, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    contentType: 'application/json',
    token,
  });
}
