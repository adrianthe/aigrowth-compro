// Small pieces shared by the homepage and the other public pages
import { INFINITY_PATH } from '../lib/brand';

export function Arrow({ size = 15 }) {
  return (
    <svg className="i" viewBox="0 0 24 24" style={{ width: size, height: size }} aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 18 }) {
  return (
    <svg className="i" viewBox="0 0 24 24" style={{ width: size, height: size }} aria-hidden="true">
      <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
      <path d="M9 9.2c.2 2.9 2.9 5.6 5.8 5.8" />
    </svg>
  );
}

// Gradients referenced as url(#lp-cyan) / url(#lp-cyan-h) by SVGs on every page
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="lp-cyan" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#00d2ff" /><stop offset=".52" stopColor="#3a7bd5" /><stop offset="1" stopColor="#8be9ff" /></linearGradient>
        <linearGradient id="lp-cyan-h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#00d2ff" stopOpacity="0" /><stop offset=".5" stopColor="#00d2ff" /><stop offset="1" stopColor="#8be9ff" stopOpacity="0" /></linearGradient>
      </defs>
    </svg>
  );
}

export function LoopArt() {
  return (
    <span className="art" aria-hidden="true">
      <svg viewBox="0 0 48 24"><path d={INFINITY_PATH} fill="none" stroke="url(#lp-cyan)" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="3.4 1.7" /></svg>
    </span>
  );
}

// Highlights the last two words of a heading with the brand gradient
export function GradTail({ text, words = 2 }) {
  const parts = text.split(' ');
  return (
    <>
      {parts.slice(0, -words).join(' ')}{' '}
      <span className="grad">{parts.slice(-words).join(' ')}</span>
    </>
  );
}
