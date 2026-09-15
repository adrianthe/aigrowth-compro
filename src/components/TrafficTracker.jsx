import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackTrafficEvent } from '../lib/analytics';

export default function TrafficTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!['/admin', '/login'].includes(location.pathname)) {
      trackTrafficEvent('page_view', { pagePath: `${location.pathname}${location.search}` });
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClick = (event) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest('a[href]');
      if (!anchor) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin === window.location.origin) return;

      trackTrafficEvent('outbound_click', {
        pagePath: `${window.location.pathname}${window.location.search}`,
        destinationUrl: destination.href,
      });
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  return null;
}
