import {
  clearSessionCookie,
  createSessionCookie,
  isAdminRequest,
  passwordMatches,
} from '../server/adminAuth.js';

function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET') {
    sendJson(response, 200, { authenticated: isAdminRequest(request) });
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    sendJson(response, 405, { error: 'Method tidak didukung.' });
    return;
  }

  if (request.body?.action === 'logout') {
    response.setHeader('Set-Cookie', clearSessionCookie());
    sendJson(response, 200, { authenticated: false });
    return;
  }

  if (!passwordMatches(request.body?.password || '')) {
    sendJson(response, 401, { error: 'Kata sandi admin tidak sesuai.' });
    return;
  }

  response.setHeader('Set-Cookie', createSessionCookie());
  sendJson(response, 200, { authenticated: true });
}
