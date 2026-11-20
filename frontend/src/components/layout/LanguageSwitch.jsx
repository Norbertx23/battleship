import { useTranslation } from 'react-i18next';

const LANGS = ['en', 'pl'];

export default function LanguageSwitch() {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage || 'en';

  return (
    <div role="group" aria-label={t('lang.group')} className="inline-flex overflow-hidden rounded-full border-2 border-ink-dark text-[13px] font-extrabold">
      {LANGS.map((lng) => {
        const on = current === lng;
        return (
          <button
            key={lng}
            type="button"
            aria-pressed={on}
            onClick={() => i18n.changeLanguage(lng)}
            className={`min-h-[34px] min-w-11 cursor-pointer px-3 ${on ? 'bg-ink-dark text-white' : 'bg-transparent text-ink-dark hover:bg-ink-dark/10'}`}
          >
            {lng.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
