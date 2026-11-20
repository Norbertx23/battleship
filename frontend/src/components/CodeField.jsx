import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';

const HIDDEN = '••••••';

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

export default function CodeField({ code, revealable = false, size = 'lg' }) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(!revealable);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await copyText(code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const toggleLabel = revealed ? t('room.hide') : t('room.show');
  const copyLabel = copied ? t('room.copied') : t('room.copy');

  if (size === 'sm') {
    return (
      <span className="inline-flex items-center gap-1">
        <strong className="tracking-[0.12em] text-ink-dark select-all">{revealed ? code : HIDDEN}</strong>
        {revealable && (
          <button type="button" onClick={() => setRevealed((v) => !v)} aria-label={toggleLabel} title={toggleLabel} className="flex size-8 cursor-pointer items-center justify-center text-pencil hover:text-ink">
            {revealed ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
        <button type="button" onClick={copy} aria-label={copyLabel} title={copyLabel} className="flex size-8 cursor-pointer items-center justify-center text-pencil hover:text-ink">
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        </button>
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <span className={`px-3 font-hand text-[72px] leading-[1.1] font-bold tracking-[0.14em] text-ink select-all ${revealed ? 'bg-highlight' : ''}`}>
        {revealed ? code : HIDDEN}
      </span>
      <div className="flex flex-wrap justify-center gap-3">
        {revealable && (
          <button type="button" onClick={() => setRevealed((v) => !v)} className="sketch-border inline-flex min-h-11 cursor-pointer items-center gap-2 border-ink-dark bg-white px-5 text-[15px] font-extrabold text-ink-dark transition-transform hover:-translate-y-0.5 hover:-rotate-1">
            {revealed ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}{toggleLabel}
          </button>
        )}
        <button type="button" onClick={copy} className="sketch-border inline-flex min-h-11 cursor-pointer items-center gap-2 border-ink bg-ink px-5 text-[15px] font-extrabold text-white transition-transform hover:-translate-y-0.5 hover:-rotate-1">
          {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}{copyLabel}
        </button>
      </div>
    </div>
  );
}
