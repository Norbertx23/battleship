import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import PaperLayout from './layout/PaperLayout';
import { REPO_URL } from './layout/Footer';
import { formatMatchDate } from '../utils/formatMatchDate';

const LIMIT = 10;
const DEBOUNCE_MS = 300;
const ROW = 'grid grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)_130px] gap-x-3';
const PAGE_BTN = 'h-11 min-w-11 cursor-pointer border-0 bg-transparent px-1.5 font-hand text-[26px] font-bold text-pencil disabled:cursor-not-allowed disabled:opacity-40';

const pageWindow = (page, maxPage) => {
    const start = Math.max(1, Math.min(page - 2, maxPage - 4));
    const end = Math.min(maxPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

export default function MatchHistory() {
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage;
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [matches, setMatches] = useState([]);
    const [total, setTotal] = useState(0);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(query.trim());
            setPage(1);
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        let alive = true;
        fetch(`/api/stats/recent-matches?page=${page}&limit=${LIMIT}&search=${encodeURIComponent(search)}`)
            .then((res) => res.json())
            .then((data) => {
                if (!alive) return;
                setMatches(data.items || []);
                setTotal(data.total || 0);
                setLoaded(true);
            })
            .catch((err) => console.error(err));
        return () => { alive = false; };
    }, [page, search]);

    const maxPage = Math.max(1, Math.ceil(total / LIMIT));

    return (
        <PaperLayout active="history">
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div className="flex flex-col gap-1">
                    <span className="-rotate-2 self-start font-hand text-[26px] text-pen">{t('history.kicker')}</span>
                    <h1 className="m-0 text-[44px] font-extrabold tracking-[-0.02em]">{t('nav.history')}</h1>
                </div>
                <div className="flex w-[min(320px,100%)] flex-col gap-0.5">
                    <label htmlFor="history-search" className="text-[13px] font-bold text-pencil">{t('history.find')}</label>
                    <input
                        id="history-search"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('history.findPh')}
                        className="h-[46px] w-full border-0 border-b-2 border-ink-dark bg-transparent px-1 font-hand text-[28px] text-ink outline-none placeholder:text-placeholder focus:border-pen"
                    />
                </div>
            </div>

            <section className="relative -rotate-[0.3deg] bg-white px-7 pt-7 pb-5 note-shadow">
                <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-24 -ml-12 -rotate-3 bg-[rgba(244,217,120,0.75)]" />
                <div className="overflow-x-auto">
                    <div className="min-w-[480px]">
                        <div className={`${ROW} border-b-2 border-ink-dark pb-2.5 text-[13px] font-extrabold tracking-[0.06em] text-pencil uppercase`}>
                            <span>{t('history.winner')}</span><span /><span>{t('history.defeated')}</span><span className="text-right">{t('history.played')}</span>
                        </div>
                        {matches.map((m, idx) => {
                            const loser = m.winner_nick === m.player1_nick ? m.player2_nick : m.player1_nick;
                            const date = formatMatchDate(m.played_at, lang);
                            return (
                                <div key={idx} title={`${m.winner_nick} ${t('history.sank')} ${loser} · ${date}`} className={`${ROW} items-baseline border-b border-dashed border-dash py-3 text-base`}>
                                    <strong className="truncate">{m.winner_nick}</strong>
                                    <span className="font-hand text-[22px] leading-none text-pencil">{t('history.sank')}</span>
                                    <span className="truncate text-pen-dark line-through">{loser}</span>
                                    <span className="whitespace-nowrap text-right text-sm text-muted">{date}</span>
                                </div>
                            );
                        })}
                        {loaded && matches.length === 0 && (
                            <p className="m-0 py-6 text-center font-hand text-[28px] text-pencil">{t('history.empty')}</p>
                        )}
                    </div>
                </div>

                <nav aria-label={t('history.pages')} className="flex items-center justify-center gap-1.5 pt-4">
                    <button type="button" aria-label={t('history.prev')} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={PAGE_BTN}>‹</button>
                    {pageWindow(page, maxPage).map((n) => (
                        <button
                            key={n}
                            type="button"
                            aria-current={n === page ? 'page' : undefined}
                            onClick={() => setPage(n)}
                            className={`${PAGE_BTN} ${n === page ? 'circled text-ink' : 'hover:text-ink'}`}
                        >
                            {n}
                        </button>
                    ))}
                    <button type="button" aria-label={t('history.next')} disabled={page >= maxPage} onClick={() => setPage((p) => Math.min(maxPage, p + 1))} className={PAGE_BTN}>›</button>
                </nav>

                <p className="m-0 mt-[18px] flex items-start gap-2.5 text-sm leading-normal text-pencil">
                    <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                    <span>
                        <Trans i18nKey="history.note" components={{ a: <a href={`${REPO_URL}/issues`} className="text-ink" /> }} />
                    </span>
                </p>
            </section>
        </PaperLayout>
    );
}
