import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MatchHistory() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:8000/stats/recent-matches')
            .then(response => response.json())
            .then(data => {
                setMatches(data);
                setLoading(true); //tylko do testu wygladu
            })
            .catch(error => console.log(error));

    }, []);

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
            ) : (<div>

            </div>)}
        </div>
    </div>);
}