import { useTranslation } from 'react-i18next';
import { formatMatchDate } from '../../utils/formatMatchDate';

export default function RecentGames({ matches }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;

  return (
    <section className="-rotate-[0.8deg] bg-white px-6 py-5.5 note-shadow">
      <h2 className="m-0 mb-1.5 font-hand text-3xl font-bold text-ink">{t('lobby.recent')}</h2>
      {matches.map((m, idx) => {
        const loser = m.winner_nick === m.player1_nick ? m.player2_nick : m.player1_nick;
        const date = formatMatchDate(m.played_at, lang, { withTime: false });
        return (
          <div
            key={idx}
            title={`${m.winner_nick} ${t('lobby.sank')} ${loser} · ${formatMatchDate(m.played_at, lang)}`}
            className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-baseline gap-x-2 border-b border-dashed border-dash py-[0.5625rem] text-base"
          >
            <strong className="truncate">{m.winner_nick}</strong>
            <span className="font-hand text-xl leading-none text-pencil">{t('lobby.sank')}</span>
            <span className="truncate text-pen-dark line-through">{loser}</span>
            <span className="whitespace-nowrap text-right text-sm text-muted">{date}</span>
          </div>
        );
      })}
    </section>
  );
}
