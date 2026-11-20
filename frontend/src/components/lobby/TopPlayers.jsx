import { useTranslation } from 'react-i18next';

export default function TopPlayers({ players }) {
  const { t } = useTranslation();

  return (
    <section className="relative rotate-1 bg-white px-6 pt-[26px] pb-[18px] note-shadow">
      <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-24 -ml-12 -rotate-3 bg-[rgba(244,217,120,0.75)]" />
      <h2 className="m-0 mb-2 font-hand text-[32px] font-bold text-ink">{t('lobby.fame')}</h2>
      {players.map((p, idx) => (
        <div key={idx} className="flex items-baseline gap-3 border-b border-dashed border-dash py-2.5">
          <span className={`w-7 font-hand text-[28px] font-bold ${idx === 0 ? 'text-pen' : 'text-ink-dark'}`}>{idx + 1}.</span>
          <span className="min-w-0 flex-grow truncate text-[17px] font-bold">{p.nick}</span>
          <span className="whitespace-nowrap text-[15px] text-pencil">{t('lobby.wins', { count: p.wins })}</span>
        </div>
      ))}
    </section>
  );
}
