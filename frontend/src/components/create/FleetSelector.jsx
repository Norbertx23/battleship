import { useTranslation } from 'react-i18next';

const SIZES = ['4', '3', '2', '1'];
const COUNTS = [0, 1, 2, 3, 4, 5];

export default function FleetSelector({ config, onChange }) {
  const { t } = useTranslation();

  return (
    <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
      <legend className="mb-2 p-0 font-hand text-[30px] font-bold text-ink">{t('create.fleet')}</legend>
      {SIZES.map((size) => {
        const name = t('create.shipName', { n: size });
        const current = Number(config[size] ?? 0);
        return (
          <div key={size} className="flex flex-wrap items-center gap-4 border-b border-dashed border-dash py-2.5">
            <span className="w-[120px] text-base font-extrabold">{name}</span>
            <span aria-hidden="true" className="flex w-[84px] gap-0.5">
              {Array.from({ length: Number(size) }).map((_, i) => (
                <span key={i} className="size-[18px] bg-ship shadow-[inset_0_0_0_2px_var(--color-ink)]" />
              ))}
            </span>
            <span role="radiogroup" aria-label={t('create.countLabel', { name })} className="flex flex-grow gap-1">
              {COUNTS.map((n) => {
                const on = current === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    data-value={n}
                    aria-checked={on}
                    onClick={() => onChange(size, n)}
                    className={`size-11 cursor-pointer rounded-full border-0 bg-transparent p-0 font-hand text-[28px] font-bold ${on ? 'circled text-ink' : 'text-pencil hover:text-ink'}`}
                  >
                    {n}
                  </button>
                );
              })}
            </span>
          </div>
        );
      })}
    </fieldset>
  );
}
