export const WHATSAPP_NUMBER = '6287773535692';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
// WhatsApp Channel: every "Join Komunitas" button points here, not to the admin chat
export const COMMUNITY_URL = 'https://whatsapp.com/channel/0029VbAm408HltY5n38tJ31d';

// Mayar customer portal where buyers open their courses. VITE_MAYAR_PORTAL_URL can override it.
export const PORTAL_URL = import.meta.env.VITE_MAYAR_PORTAL_URL || 'https://aigrowth.myr.id/portal';

export function whatsappLink(text) {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}
