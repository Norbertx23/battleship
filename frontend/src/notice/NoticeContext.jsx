import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { NoticeContext } from './context';

const DISMISS_MS = 5000;

export function NoticeProvider({ children }) {
  const { t, i18n } = useTranslation();
  const [notices, setNotices] = useState([]);
  const nextId = useRef(0);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((payload = {}) => {
    const { code, message, nick, tone = 'error' } = payload;
    const key = `${code || ''}|${message || ''}|${nick || ''}`;
    setNotices((prev) => {
      if (prev.some((n) => n.key === key)) return prev;
      const id = nextId.current++;
      timers.current[id] = setTimeout(() => dismiss(id), DISMISS_MS);
      return [...prev, { id, key, code, message, nick, tone }];
    });
  }, [dismiss]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const value = useMemo(() => ({ notify }), [notify]);

  const text = (n) => (n.code && i18n.exists(`errors.${n.code}`) ? t(`errors.${n.code}`, { nick: n.nick }) : n.message || '');

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-3 px-4 pointer-events-none">
        {notices.map((n) => (
          <div
            key={n.id}
            role="alert"
            className={`pointer-events-auto relative flex max-w-md items-start gap-3 bg-white px-5 pt-5 pb-4 note-shadow -rotate-1 border-l-4 ${n.tone === 'error' ? 'border-pen' : 'border-ink'}`}
          >
            <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-24 -ml-12 -rotate-3 bg-[rgba(244,217,120,0.75)]" />
            <p className="m-0 flex-1 text-base font-semibold text-ink-dark">{text(n)}</p>
            <button
              type="button"
              onClick={() => dismiss(n.id)}
              aria-label={t('errors.close')}
              className="-mr-2 -mt-2 flex size-11 items-center justify-center text-pencil hover:text-ink-dark"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </NoticeContext.Provider>
  );
}
