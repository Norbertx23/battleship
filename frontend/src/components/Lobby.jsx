import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import '../App.css';
import { useNavigate } from 'react-router-dom';


const socket = io("http://localhost:8000");

const ShipSelector = ({ masts, count, onChange }) => (
    <div className="flex flex-col gap-1 mb-3">
        <div className="flex justify-between items-center text-xs text-[#00f2ea]">
            <span>{masts}-MAST SHIP</span>
            <span>COUNT: <span className="text-white font-bold">{count}</span></span>
        </div>
        <div className="radio-input self-center">
            {[0, 1, 2, 3, 4, 5].map(val => (
                <label key={val}>
                    <input
                        type="radio"
                        name={`ship-${masts}`}
                        value={val}
                        checked={count === val}
                        onChange={() => {
                            console.log(`Config Update: ${masts}-mast ships set to ${val}`);
                            onChange(masts, val);
                        }}
                    />
                    <span>{val}</span>
                </label>
            ))}
            <span className="selection"></span>
        </div>
    </div>
);

export default function Lobby() {
    const navigate = useNavigate();

    const [topPlayers, setTopPlayers] = useState([]);
    const [recentMatches, setRecentMatches] = useState([]);

    const [view, setView] = useState('menu');

    const [nick, setNick] = useState("Player_" + Math.floor(Math.random() * 1000));
    const [gameCode, setGameCode] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [shipConfig, setShipConfig] = useState({ "4": 1, "3": 2, "2": 2, "1": 4 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const topRes = await fetch("http://localhost:8000/stats/top-players?limit=3");
                setTopPlayers(await topRes.json());
                const recentRes = await fetch("http://localhost:8000/stats/recent-matches?limit=10");
                setRecentMatches(await recentRes.json());
            } catch (err) { console.error(err); }
        };
        fetchData();

        socket.on('room_created', (data) => {
            console.log("Room Created Event Received:", data);
            setRoomCode(data.room_id);
            setView('room_created');
        });
        socket.on('game_start', (data) => {
            console.log("GAME STARTED! Config:", data.config);
            alert("GAME STARTED");
        });
        socket.on('error', (d) => alert(d.message));

        return () => { socket.off('room_created'); socket.off('game_start'); socket.off('error'); }
    }, []);

    const handleBack = () => {
        if (roomCode) {
            socket.emit('leave_room', { room_id: roomCode });
        }
        setView('menu');
        setRoomCode("");
    };

    const handleAction = () => {
        console.log("Handle Action Triggered. View:", view);
        console.log("Socket connected:", socket.connected, "Socket ID:", socket.id);

        if (!nick) return alert("IDENTITY REQUIRED");

        if (view === 'join') {
            socket.emit('join_room', { room_id: gameCode, nick, config: {} });
        }
        else {
            console.log("Creating room with ship config:", shipConfig);
            socket.emit('create_room', { nick, config: shipConfig });
        }
    };

    return (
        <div
            className={`min-h-screen lg:h-screen w-full text-[#e5e5e5] font-mono flex flex-col-reverse p-4 lg:p-8 gap-8 lg:gap-12 overflow-x-hidden ${view === 'match_history' ? 'flex-col' : 'lg:grid lg:grid-cols-2'}`}
        >

            {/* LEFT COLUMN: Stats */}
            {view !== 'match_history' && (
                <div className="flex flex-col gap-4 lg:gap-8 border-t lg:border-t-0 lg:border-r border-blue-500/30 pt-8 lg:pt-0 lg:pr-12 lg:h-full lg:overflow-hidden">
                    {/* Top Players Panel */}
                    <div className="cyber-panel p-4 lg:p-6 rounded relative overflow-hidden flex-shrink-0 lg:max-h-[40%] flex flex-col">
                        <h2 className="text-lg lg:text-xl font-bold mb-4 text-[#00f2ea] cyber-text-glow flex-shrink-0">
                            TOP_OPERATIVES
                        </h2>
                        <ul className="space-y-2 lg:space-y-3 lg:overflow-y-auto pr-2 custom-scrollbar">
                            {topPlayers.map((p, idx) => (
                                <li key={idx} className="flex justify-between items-center border-b border-[#00f2ea33] pb-2 text-sm lg:text-base">
                                    <span className={`font-bold ${idx === 0 ? 'text-[#a855f7]' : 'text-white'}`}>#{idx + 1} {p.nick.toUpperCase()}</span>
                                    <span className="font-mono text-[#00f2ea]">{p.wins} WINS</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Recent Matches Panel */}
                    <div className="cyber-panel p-4 lg:p-6 rounded relative flex-1 flex flex-col lg:overflow-hidden min-h-[300px] lg:min-h-0">
                        <h2 className="text-lg lg:text-xl font-bold mb-4 text-[#a855f7] cyber-text-glow flex-shrink-0">RECENT_MATCHES</h2>
                        <div className="lg:overflow-y-auto flex-1 pr-2 custom-scrollbar text-xs lg:text-sm">
                            <table className="w-full text-left">
                                <thead className="text-[#00f2ea] border-b border-[#00f2ea33] sticky top-0 bg-[#000000dd] backdrop-blur-sm z-10">
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
            )}

            {/* RIGHT COLUMN: Control Interface */}
            <div className={`flex flex-col items-center justify-center relative py-8 lg:py-0 lg:h-full lg:overflow-y-auto ${view === 'match_history' ? 'w-full h-full' : ''}`}>
                <h1 className="text-4xl lg:text-7xl font-black mb-8 lg:mb-12 text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ea] to-[#a855f7] cyber-text-glow tracking-tighter text-center">
                    BATTLESHIP_NET
                </h1>

                {view === 'menu' && (
                    <div className="cards w-full max-w-xs lg:max-w-md flex flex-col gap-4 lg:gap-6 items-center">
                        <div className="card red" onClick={() => setView('create')}>
                            <p className="tip text-xl lg:text-3xl">CREATE ROOM</p>
                            <p className="second-text text-sm lg:text-base">Start a new battle</p>
                        </div>
                        <div className="card blue" onClick={() => setView('join')}>
                            <p className="tip text-xl lg:text-3xl">JOIN ROOM</p>
                            <p className="second-text text-sm lg:text-base">Enter existing code</p>
                        </div>
                        <div className="card green" onClick={() => navigate('/match_history')}>
                            <p className="tip text-xl lg:text-3xl">MATCH HISTORY</p>
                            <p className="second-text text-sm lg:text-base">See full records</p>
                        </div>
                    </div>
                )}

                {(view === 'create' || view === 'join') && (
                    <div className="w-full max-w-xs lg:max-w-md flex flex-col justify-center">
                        <button onClick={handleBack} className="mb-4 text-[#00f2ea] hover:underline flex items-center gap-2">
                            &larr; ABORT SEQUENCE
                        </button>

                        <div className="form-container">
                            <form className="form" onSubmit={(e) => e.preventDefault()}>
                                <div className="form-group">
                                    <label htmlFor="nick">CODENAME</label>
                                    <input type="text" id="nick" name="nick" required value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Enter your identity" />
                                </div>

                                {view === 'create' && (
                                    <>
                                        <div className="border-t border-[#414141] my-2 pt-2">
                                            <p className="text-[#00f2ea] text-xs font-bold mb-3 tracking-widest text-center">FLEET CONFIGURATION</p>
                                            <ShipSelector masts="4" count={shipConfig["4"]} onChange={(m, v) => setShipConfig({ ...shipConfig, [m]: v })} />
                                            <ShipSelector masts="3" count={shipConfig["3"]} onChange={(m, v) => setShipConfig({ ...shipConfig, [m]: v })} />
                                            <ShipSelector masts="2" count={shipConfig["2"]} onChange={(m, v) => setShipConfig({ ...shipConfig, [m]: v })} />
                                            <ShipSelector masts="1" count={shipConfig["1"]} onChange={(m, v) => setShipConfig({ ...shipConfig, [m]: v })} />
                                        </div>
                                    </>
                                )}

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