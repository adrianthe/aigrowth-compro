import { randomUUID } from 'node:crypto';
import { CONTENT_TYPES } from '../src/data/contentDefaults.js';
import { isAdminRequest } from '../server/adminAuth.js';
import { readContentItems, writeContentItems } from '../server/contentStore.js';

const allowedTypes = new Set(CONTENT_TYPES);

function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

function cleanText(value, maxLength = 5000) {
  return String(value || '').trim().slice(0, maxLength);
}

function makeSlug(value) {
  return cleanText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function normalizeItem(input, existingItem) {
  const type = cleanText(input.type, 20);
  const title = cleanText(input.title, 180);
  const description = cleanText(input.description, 12000);

  if (!allowedTypes.has(type)) throw new Error('Jenis konten tidak valid.');
  if (!title) throw new Error('Judul wajib diisi.');
  if (!description) throw new Error('Deskripsi atau konten wajib diisi.');

  const now = new Date().toISOString();
  return {
    id: existingItem?.id || randomUUID(),
    type,
    title,
    description,
    category: cleanText(input.category, 80),
    url: cleanText(input.url, 1000),
    imageUrl: cleanText(input.imageUrl, 1000),
    eventDate: cleanText(input.eventDate, 40),
    label: cleanText(input.label, 80),
    slug: type === 'article' ? makeSlug(input.slug || title) : '',
    featured: Boolean(input.featured),
    createdAt: existingItem?.createdAt || now,
    updatedAt: now,
  };
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  try {
    const items = await readContentItems();

    if (request.method === 'GET') {
      const requestedType = cleanText(request.query.type, 20);
      if (requestedType && !allowedTypes.has(requestedType)) {
        sendJson(response, 400, { error: 'Jenis konten tidak valid.' });
        return;
      }

      const filteredItems = requestedType
        ? items.filter((item) => item.type === requestedType)
        : items;
      sendJson(response, 200, { items: filteredItems });
      return;
    }

    if (!isAdminRequest(request)) {
      sendJson(response, 401, { error: 'Sesi admin tidak valid.' });
      return;
    }

    if (request.method === 'POST') {
      const input = request.body?.item || {};
      const existingIndex = input.id ? items.findIndex((item) => item.id === input.id) : -1;
      const existingItem = existingIndex >= 0 ? items[existingIndex] : null;
      const normalizedItem = normalizeItem(input, existingItem);

      if (existingIndex >= 0) items[existingIndex] = normalizedItem;
      else items.unshift(normalizedItem);

      await writeContentItems(items);
      sendJson(response, existingItem ? 200 : 201, { item: normalizedItem });
      return;
    }

    if (request.method === 'DELETE') {
      const id = cleanText(request.query.id, 100);
      const nextItems = items.filter((item) => item.id !== id);
      if (!id || nextItems.length === items.length) {
        sendJson(response, 404, { error: 'Konten tidak ditemukan.' });
        return;
      }

      await writeContentItems(nextItems);
      sendJson(response, 200, { deleted: true });
      return;
    }

    response.setHeader('Allow', 'GET, POST, DELETE');
    sendJson(response, 405, { error: 'Method tidak didukung.' });
  } catch (error) {
    sendJson(response, 500, { error: error.message || 'Terjadi kesalahan pada server.' });
  }
}
