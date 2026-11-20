import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { History, Plus } from 'lucide-react';
import useLobbySocket from '../hooks/useLobbySocket';
import { useNotice } from '../notice/useNotice';
import PaperLayout from './layout/PaperLayout';
import JoinForm from './lobby/JoinForm';
import TopPlayers from './lobby/TopPlayers';
import RecentGames from './lobby/RecentGames';
import CreateRoom from './create/CreateRoom';
import RoomCode from './create/RoomCode';
import GameBoard from './GameBoard';

const cardBase = 'sketch-border flex flex-[1_1_220px] flex-col gap-1.5 px-[26px] py-[22px] no-underline transition-transform hover:-translate-y-0.5 hover:-rotate-1';

export default function Lobby() {
    const { t } = useTranslation();
    const { notify } = useNotice();
    const {
        socket,
        view,
        setView,
        nick,
        setNick,
        gameCode,
        setGameCode,
        roomCode,
        shipConfig,
        setShipConfig,
        resumeState,
        resumeKey,
        opponent,
        createRoom,
        joinRoom,
        leaveRoom,
    } = useLobbySocket();

    const [topPlayers, setTopPlayers] = useState([]);
    const [recentMatches, setRecentMatches] = useState([]);

    useEffect(() => {
        if (view !== 'menu') return undefined;
        let alive = true;
        (async () => {
            try {
                const topRes = await fetch('/api/stats/top-players?limit=3');
                const recentRes = await fetch('/api/stats/recent-matches?limit=5');
                if (topRes.status === 429 || recentRes.status === 429) {
                    notify({ code: 'rate_limited' });
                    return;
                }
                const top = await topRes.json();
                const recent = await recentRes.json();
                if (!alive) return;
                setTopPlayers(Array.isArray(top) ? top : []);
                setRecentMatches(recent.items || []);
            } catch (err) {
                console.error(err);
            }
        })();
        return () => { alive = false; };
    }, [view, notify]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [view]);

    const requireNick = (action) => {
        if (!nick || !nick.trim()) {
            notify({ code: 'nickname_required' });
            return;
        }
        action();
    };

    if (view === 'game') {
        return (
            <GameBoard
                key={resumeKey}
                socket={socket}
                roomCode={roomCode || gameCode}
                shipConfig={shipConfig}
                onLeave={leaveRoom}
                nick={nick}
                opponent={opponent}
                resumeState={resumeState}
            />
        );
    }

    if (view === 'create') {
        return (
            <CreateRoom
                nick={nick}
                onNickChange={setNick}
                config={shipConfig}
                onConfigChange={(masts, count) => setShipConfig({ ...shipConfig, [masts]: count })}
                onBack={leaveRoom}
                onCreate={() => requireNick(createRoom)}
            />
        );
    }

    if (view === 'room_created') {
        return <RoomCode nick={nick} code={roomCode} onCancel={leaveRoom} />;
    }

    return (
        <PaperLayout active="lobby">
            <main className="flex flex-wrap items-start gap-12">
                <section className="flex min-w-0 flex-[999_1_540px] flex-col gap-8">
                    <div className="flex flex-col gap-3">
                        <span className="-rotate-2 self-start font-hand text-[26px] text-pen">{t('lobby.kicker')}</span>
                        <h1 className="m-0 text-[clamp(40px,5.4vw,66px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
                            {t('lobby.h1a')}<br />{t('lobby.h1b')}{' '}
                            <span className="bg-highlight px-1.5 [box-decoration-break:clone]">{t('lobby.h1c')}</span>.
                        </h1>
                        <p className="m-0 max-w-[500px] text-lg leading-relaxed text-[#4A4843]">{t('lobby.lead')}</p>
                    </div>

                    <div className="flex flex-wrap gap-5">
                        <button type="button" onClick={() => setView('create')} className={`${cardBase} cursor-pointer border-ink bg-ink text-left text-white`}>
                            <span className="flex items-center gap-2.5 text-[22px] font-extrabold"><Plus size={24} aria-hidden="true" />{t('lobby.create')}</span>
                            <span className="text-[15px] text-[#DCE3F7]">{t('lobby.createSub')}</span>
                        </button>
                        <Link to="/match_history" className={`${cardBase} border-ink-dark bg-white text-ink-dark`}>
                            <span className="flex items-center gap-2.5 text-[22px] font-extrabold"><History size={24} aria-hidden="true" />{t('nav.history')}</span>
                            <span className="text-[15px] text-pencil">{t('lobby.historySub')}</span>
                        </Link>
                    </div>

                    <JoinForm
                        nick={nick}
                        onNickChange={setNick}
                        code={gameCode}
                        onCodeChange={setGameCode}
                        onJoin={joinRoom}
                    />
                </section>

                <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-8">
                    <TopPlayers players={topPlayers} />
                    <RecentGames matches={recentMatches} />
                </aside>
            </main>
        </PaperLayout>
    );
}
