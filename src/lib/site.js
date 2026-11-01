export const WHATSAPP_NUMBER = '6287773535692';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

// Mayar customer portal (https://<subdomain>.myr.id/portal). Empty until set in the Vercel env.
export const PORTAL_URL = import.meta.env.VITE_MAYAR_PORTAL_URL || '';

export function whatsappLink(text) {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}
