// Ad pixels (Meta, GA4, TikTok) and first/last-touch attribution.
// Every pixel is optional: it only loads when its ID is set in the Vercel env.

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
const GA4_ID = import.meta.env.VITE_GA4_ID;
const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID;

const ATTRIBUTION_KEY = 'aigrowth_attribution';
const CHECKOUT_KEY = 'aigrowth_last_checkout';
const CAMPAIGN_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid'];
const PRIVATE_PATHS = ['/admin', '/login'];

let initialized = false;

function loadScript(src) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function initMeta() {
  if (!META_PIXEL_ID || window.fbq) return;
  const fbq = function (...args) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  loadScript('https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', META_PIXEL_ID);
}

function initGa() {
  if (!GA4_ID || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js expects the raw arguments object, not an array
    window.dataLayer.push(arguments);
  };
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`);
  window.gtag('js', new Date());
  // Page views are sent by trackPageView so client-side navigation is counted too
  window.gtag('config', GA4_ID, { send_page_view: false });
}

function initTikTok() {
  if (!TIKTOK_PIXEL_ID || window.ttq) return;
  // Port of TikTok's official base snippet: queue calls until events.js loads
  const sdk = 'https://analytics.tiktok.com/i18n/pixel/events.js';
  const ttq = [];
  ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
  ttq.setAndDefer = (target, method) => {
    target[method] = (...args) => target.push([method, ...args]);
  };
  ttq.methods.forEach((method) => ttq.setAndDefer(ttq, method));
  ttq.instance = (id) => {
    const instance = ttq._i[id] || [];
    ttq.methods.forEach((method) => ttq.setAndDefer(instance, method));
    return instance;
  };
  ttq._i = { [TIKTOK_PIXEL_ID]: Object.assign([], { _u: sdk }) };
  ttq._t = { [TIKTOK_PIXEL_ID]: Date.now() };
  ttq._o = { [TIKTOK_PIXEL_ID]: {} };
  window.TiktokAnalyticsObject = 'ttq';
  window.ttq = ttq;
  loadScript(`${sdk}?sdkid=${TIKTOK_PIXEL_ID}&lib=ttq`);
}

export function initTracking() {
  if (initialized || import.meta.env.DEV) return;
  initialized = true;
  initMeta();
  initGa();
  initTikTok();
}

export function isPrivatePath(pathname) {
  return PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function trackPageView(path) {
  if (!initialized) return;
  window.fbq?.('track', 'PageView');
  window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: document.title });
  window.ttq?.page();
}

const GA_EVENTS = { ViewContent: 'view_item', Lead: 'generate_lead', InitiateCheckout: 'begin_checkout' };

// eventId lets Meta deduplicate this browser event with the same event sent from the server
export function trackEvent(name, { id, title, value, category } = {}, eventId) {
  if (!initialized) return;
  const currency = 'IDR';
  const hasValue = typeof value === 'number' && value > 0;

  window.fbq?.('track', name, {
    content_ids: id ? [id] : undefined,
    content_name: title,
    content_category: category,
    content_type: 'product',
    ...(hasValue ? { value, currency } : {}),
  }, eventId ? { eventID: eventId } : undefined);

  window.gtag?.('event', GA_EVENTS[name] || name, {
    ...(hasValue ? { value, currency } : {}),
    items: id ? [{ item_id: id, item_name: title, item_category: category, ...(hasValue ? { price: value } : {}) }] : undefined,
  });

  window.ttq?.track(name === 'Lead' ? 'SubmitForm' : name, {
    contents: id ? [{ content_id: id, content_name: title }] : undefined,
    ...(hasValue ? { value, currency } : {}),
  }, eventId ? { event_id: eventId } : undefined);
}

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or blocked storage: attribution is best-effort
  }
}

// Remembers where a visitor first came from and the latest campaign that brought them back
export function captureAttribution(search, pathname) {
  const params = new URLSearchParams(search);
  const touch = {};
  CAMPAIGN_PARAMS.forEach((key) => {
    const value = params.get(key);
    if (value) touch[key] = value.slice(0, 200);
  });

  const stored = readStorage(ATTRIBUTION_KEY) || {};
  const stamp = { at: new Date().toISOString(), landing: pathname };
  if (!stored.first) {
    stored.first = { ...touch, ...stamp, referrer: document.referrer.slice(0, 500) || undefined };
  }
  if (Object.keys(touch).length) stored.last = { ...touch, ...stamp };
  writeStorage(ATTRIBUTION_KEY, stored);
}

export function getAttribution() {
  return readStorage(ATTRIBUTION_KEY) || {};
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

// Browser ids the server needs to match its conversion events to this visitor
export function getClientIds() {
  const attribution = getAttribution();
  const fbclid = attribution.last?.fbclid || attribution.first?.fbclid;
  const gaCookie = readCookie('_ga');
  return {
    fbp: readCookie('_fbp') || undefined,
    fbc: readCookie('_fbc') || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined),
    gaClientId: gaCookie ? gaCookie.split('.').slice(-2).join('.') : undefined,
    ttp: readCookie('_ttp') || undefined,
  };
}

export function rememberCheckout(details) {
  writeStorage(CHECKOUT_KEY, { ...details, at: new Date().toISOString() });
}

export function getLastCheckout() {
  return readStorage(CHECKOUT_KEY);
}
