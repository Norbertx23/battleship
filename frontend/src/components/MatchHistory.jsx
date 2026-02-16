import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MatchHistory() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [totalMatches, setTotalMatches] = useState(0);
    const navigate = useNavigate();

    const LIMIT = 10;
    const maxPage = Math.ceil(totalMatches / LIMIT);

    useEffect(() => {
        setIsFetching(true);
        const timer = setTimeout(() => {
            setLoading(true);
        }, 400);

        fetch(`http://localhost:8000/stats/recent-matches?page=${page}&limit=${LIMIT}&search=${encodeURIComponent(search)}`)
            .then(response => response.json())
            .then(data => {
                clearTimeout(timer);
                setMatches(data.items);
                setTotalMatches(data.total);
                setLoading(false);
                setIsFetching(false);
            })
            .catch(error => {
                clearTimeout(timer);
                console.log(error);
                setLoading(false);
                setIsFetching(false);
            });

        return () => clearTimeout(timer);
    }, [page, search]);

    return (<div className="fixed inset-0 z-50 w-full text-[#e5e5e5] font-mono p-4 lg:p-8 flex flex-col items-center justify-start overflow-hidden">
        <h1 className="self-end text-3xl lg:text-5xl font-black mb-4 lg:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ea] to-[#a855f7] cyber-text-glow tracking-tighter text-right">
            BATTLESHIP_NET
        </h1>

        <div className="w-full max-w-4xl h-[80vh] flex flex-col">
            <button
                onClick={() => navigate('/')}
                className="mb-4 text-[#00f2ea] hover:underline flex items-center gap-2 self-start"
            >
                ← BACK TO MENU
            </button>

            <input
                type="text"
                placeholder="SEARCH OPERATIVE..."
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                }}
                className="w-full rounded-2xl bg-[#020617] border border-[#a855f7] text-[#00f2ea] p-2 rounded mb-4 focus:outline-none focus:shadow-[0_0_10px_#a855f7] font-mono"
            />

            {loading ? (
                <div className="text-[#00f2ea] animate-pulse text-2xl self-center my-auto flex flex-col items-center gap-8">
                    LOADING DATA...
                    <div className="pyramid-loader">
                        <div className="wrapper">
                            <span className="side side1"></span>
                            <span className="side side2"></span>
                            <span className="side side3"></span>
                            <span className="side side4"></span>
                            <span className="shadow"></span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="cyber-panel p-[1vh] md:p-[2vh] rounded-2xl flex-1 flex flex-col overflow-hidden border border-[#a855f7] relative">
                    <h2 className="text-[2vh] md:text-[3vh] font-bold mb-[1vh] text-[#a855f7] cyber-text-glow flex-shrink-0">GLOBAL MATCH RECORDS</h2>

                    <div className="overflow-hidden flex-1 w-full relative">
                        <table className="w-full h-full text-left border-collapse table-fixed">
                            <thead className="text-[#00f2ea] border-b border-[#00f2ea33] h-[10%]">
                                <tr>
                                    <th className="p-[0.5vh] md:px-[2vh] text-[1.5vh] md:text-[2.2vh] w-1/3">WINNER</th>
                                    <th className="p-[0.5vh] md:px-[2vh] text-[1.5vh] md:text-[2.2vh] w-1/3">LOSER</th>
                                    <th className="p-[0.5vh] md:px-[2vh] text-center text-[1.5vh] md:text-[2.2vh] w-1/3">DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matches.map((item, index) => (
                                    <tr key={index} className="border-b border-[#00f2ea11] hover:bg-[#ffffff05] transition-colors text-[1.2vh] md:text-[2vh] h-[9%]">
                                        <td className="p-[0.5vh] md:px-[2vh] text-[#39ff14] font-bold font-mono truncate">{item.winner_nick}</td>
                                        <td className="p-[0.5vh] md:px-[2vh] text-red-400 font-mono truncate">{item.winner_nick === item.player1_nick ? item.player2_nick : item.player1_nick}</td>
                                        <td className="p-[0.5vh] md:px-[2vh] text-[#00f2ea] text-right opacity-80 whitespace-nowrap">
                                            <span className="md:hidden">{new Date(item.played_at).toLocaleDateString()}</span>
                                            <span className="hidden md:inline">{new Date(item.played_at).toLocaleString()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="h-[8vh] flex items-center justify-between mt-[1vh] flex-shrink-0 border-t border-[#a855f733] pt-[1vh]">
                        <button
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page === 1 || isFetching}
                            className={`bg-[#020617] border border-[#00f2ea] text-[#00f2ea] px-[2vh] py-[0.5vh] rounded font-bold transition-all text-[1.5vh] md:text-[2vh] 
                            ${(page === 1 || isFetching)
                                    ? 'opacity-30 cursor-not-allowed border-gray-600 text-gray-600'
                                    : 'hover:bg-[#00f2ea] hover:text-[#020617]'}`}
                        >
                            &lt; PREV
                        </button>

                        <span className="text-[#a855f7] font-bold text-[1.5vh] uppercase">
                            PAGE {page} / {maxPage || 1}
                        </span>

                        <button
                            onClick={() => setPage(prev => prev + 1)}
                            disabled={page >= maxPage || isFetching}
                            className={`bg-[#020617] border border-[#00f2ea] text-[#00f2ea] px-[2vh] py-[0.5vh] rounded font-bold transition-all text-[1.5vh] md:text-[2vh] 
                                ${(page >= maxPage || isFetching)
                                    ? 'opacity-30 cursor-not-allowed border-gray-600 text-gray-600'
                                    : 'hover:bg-[#00f2ea] hover:text-[#020617]'}`}
                        >
                            NEXT &gt;
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>);
}