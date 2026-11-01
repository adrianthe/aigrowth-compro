import { useCallback, useState } from 'react';

let toastId = 0;

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const notify = useCallback((text, tone = 'ok') => {
    toastId += 1;
    const id = toastId;
    setToasts((list) => [...list.slice(-2), { id, text, tone }]);
    setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500);
  }, [dismiss]);

  return { toasts, notify, dismiss };
}
