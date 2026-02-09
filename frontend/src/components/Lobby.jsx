import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import '../App.css';

const socket = io("http://localhost:8000");

export default function Lobby() {
    const [topPlayers, setTopPlayers] = useState([]);
    const [recentMatches, setRecentMatches] = useState([]);

    const [view, setView] = useState('menu');

    const [nick, setNick] = useState("Player_" + Math.floor(Math.random() * 1000));
    const [gameCode, setGameCode] = useState("");
    const [roomCode, setRoomCode] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const topRes = await fetch("http://localhost:8000/stats/top-players?limit=5");
                setTopPlayers(await topRes.json());
                const recentRes = await fetch("http://localhost:8000/stats/recent-matches?limit=10");
                setRecentMatches(await recentRes.json());
            } catch (err) { console.error(err); }
        };
        fetchData();

        socket.on('room_created', (data) => {
            setRoomCode(data.room_id);
            setView('room_created');
        });
        socket.on('game_start', () => alert("GAME STARTED"));
        socket.on('error', (d) => alert(d.message));

        return () => { socket.off('room_created'); socket.off('game_start'); socket.off('error'); }
    }, []);

    const handleBack = () => {
        setView('menu');
        setRoomCode("");
    };

    const handleAction = () => {
        if (!nick) return alert("IDENTITY REQUIRED");
        if (view === 'join') {
            socket.emit('join_room', { room_id: gameCode, nick, config: {} });
        } else {
            // Create
            socket.emit('create_room', { nick, config: { "4": 1, "3": 2, "2": 2, "1": 4 } });
        }
    };

    return (
        <div
            className="min-h-screen text-[#e5e5e5] p-8 font-mono grid grid-cols-1 lg:grid-cols-2 gap-12"
            style={{
                background: "radial-gradient(circle at center, #020617 0%, #1e1b4b 50%, #5a27ab 100%)"
            }}
        >

            <div className="flex flex-col gap-8 border-r border-blue-500/30 pr-12">
                <div className="cyber-panel p-6 rounded relative overflow-hidden">
                    <h2 className="text-xl font-bold mb-6 text-[#00f2ea] cyber-text-glow flex items-center gap-3">
                        <span className="text-2xl">⚡</span> TOP_OPERATIVES
                    </h2>
                    <ul className="space-y-3">
                        {topPlayers.map((p, idx) => (
                            <li key={idx} className="flex justify-between items-center border-b border-[#00f2ea33] pb-2">
                                <span className={`font-bold ${idx === 0 ? 'text-[#a855f7]' : 'text-white'}`}>#{idx + 1} {p.nick.toUpperCase()}</span>
                                <span className="font-mono text-[#00f2ea]">{p.wins} WINS</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="cyber-panel p-6 rounded relative flex-1">
                    <h2 className="text-xl font-bold mb-6 text-[#a855f7] cyber-text-glow">📊 RECENT_MATCHES</h2>
                    <div className="overflow-auto max-h-[400px] text-sm">
                        <table className="w-full text-left">
                            <thead className="text-[#00f2ea] border-b border-[#00f2ea33]">
                                <tr>
                                    <th className="p-2">VICTOR</th>
                                    <th className="p-2">DEFEATED</th>
                                    <th className="p-2 text-right">DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentMatches.map((m, idx) => (
                                    <tr key={idx} className="border-b border-[#00f2ea33]">
                                        <td className="p-2 text-[#39ff14] font-bold drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">{m.winner_nick}</td>
                                        <td className="p-2 text-red-400">{m.winner_nick === m.player1_nick ? m.player2_nick : m.player1_nick}</td>
                                        <td className="p-2 text-right text-[#00f2ea]">{new Date(m.played_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center relative">
                <h1 className="text-7xl font-black mb-24 text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ea] to-[#a855f7] cyber-text-glow tracking-tighter">
                    BATTLESHIP_NET
                </h1>

                {view === 'menu' && (
                    <div className="cards w-full max-w-md flex flex-col gap-6 items-center">
                        <div className="card red" onClick={() => setView('create')}>
                            <p className="tip">CREATE ROOM</p>
                            <p className="second-text">Start a new battle</p>
                        </div>
                        <div className="card blue" onClick={() => setView('join')}>
                            <p className="tip">JOIN ROOM</p>
                            <p className="second-text">Enter existing code</p>
                        </div>
                        <div className="card green">
                            <p className="tip">MATCH HISTORY</p>
                            <p className="second-text">See full records</p>
                        </div>
                    </div>
                )}

                {(view === 'create' || view === 'join') && (
                    <div className="w-full max-w-md">
                        <button onClick={handleBack} className="mb-4 text-[#00f2ea] hover:underline flex items-center gap-2">
                            &larr; ABORT SEQUENCE
                        </button>

                        <div className="form-container">
                            <form className="form" onSubmit={(e) => e.preventDefault()}>
                                <div className="form-group">
                                    <label htmlFor="nick">CODENAME</label>
                                    <input type="text" id="nick" name="nick" required value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Enter your identity" />
                                </div>

                                {view === 'join' && (
                                    <div className="form-group">
                                        <label htmlFor="room">SECURE ROOM ID</label>
                                        <input type="text" id="room" name="room" required value={gameCode} onChange={(e) => setGameCode(e.target.value)} placeholder="Enter access code" />
                                    </div>
                                )}

                                <button className="form-submit-btn" type="submit" onClick={handleAction}>
                                    {view === 'create' ? "INITIALIZE MISSION" : "ESTABLISH CONNECTION"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {view === 'room_created' && (
                    <div className="mt-8 p-6 border-2 border-[#00f2ea] bg-[#00f2ea11] rounded text-center w-full max-w-sm cyber-panel">
                        <p className="text-[#00f2ea] text-sm tracking-widest mb-2">SERVER_INITIALIZED</p>
                        <p className="text-4xl font-mono font-bold text-white tracking-widest">{roomCode}</p>
                        <p className="text-gray-500 text-xs mt-4 animate-pulse">WAITING_FOR_PEER_CONNECTION...</p>
                        <button onClick={handleBack} className="mt-6 text-xs text-gray-500 hover:text-white">CANCEL</button>
                    </div>
                )}
            </div>
        </div>
    );
}