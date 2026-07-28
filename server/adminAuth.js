import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'aigrowth_admin_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return '';
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function readCookie(request, name) {
  const cookies = request.headers.cookie || '';
  const entry = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : '';
}

export function passwordMatches(password) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && safeEqual(password, expected);
}

export function createSessionCookie() {
  const payload = encode(JSON.stringify({ exp: Date.now() + SESSION_DURATION_SECONDS * 1000 }));
  const signature = sign(payload);
  return `${COOKIE_NAME}=${payload}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAdminRequest(request) {
  const token = readCookie(request, COOKIE_NAME);
  const separatorIndex = token.lastIndexOf('.');
  if (separatorIndex <= 0) return false;

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expectedSignature = sign(payload);
  if (!expectedSignature || !safeEqual(signature, expectedSignature)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number(session.exp) > Date.now();
  } catch {
    return false;
  }
}
