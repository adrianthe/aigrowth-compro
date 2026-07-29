import { handleUpload } from '@vercel/blob/client';
import { isAdminRequest } from '../server/adminAuth.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method tidak didukung.' });
    return;
  }

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAdminRequest(request)) throw new Error('Sesi admin tidak valid.');
        if (!pathname.startsWith('cms/images/')) throw new Error('Lokasi upload tidak valid.');

        return {
          allowedContentTypes: ALLOWED_IMAGE_TYPES,
          maximumSizeInBytes: MAX_IMAGE_SIZE,
          addRandomSuffix: true,
          cacheControlMaxAge: 31_536_000,
        };
      },
      onUploadCompleted: async () => {},
    });

    response.status(200).json(result);
  } catch (error) {
    const message = error.message || 'Foto gagal diunggah.';
    const status = message.includes('Sesi admin') ? 401 : 400;
    response.status(status).json({ error: message });
  }
}
