import { useState, useEffect, useRef } from 'react';

// --- HELPERS ---
const BOARD_SIZE = 10;
const createEmptyBoard = () => Array(BOARD_SIZE * BOARD_SIZE).fill(null);

export default function Battle({ socket, roomCode, shipConfig, onLeave, nick }) {
    // --- STATE ---
    const [phase, setPhase] = useState('placement'); // placement, waiting, battle, game_over
    const [myShips, setMyShips] = useState([]);
    const [myBoard, setMyBoard] = useState(createEmptyBoard()); // Enemy shots on my board
    const [enemyBoard, setEnemyBoard] = useState(createEmptyBoard()); // My shots on enemy board
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [result, setResult] = useState(null); // 'VICTORY' or 'DEFEAT'
    const [enemySunkShips, setEnemySunkShips] = useState([]);

    // Placement State
    const [draggedShip, setDraggedShip] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [selectedShipId, setSelectedShipId] = useState(null);
    const [globalRotation, setGlobalRotation] = useState(0);

    // Refs for event listeners to avoid stale closures
    const draggedShipRef = useRef(draggedShip);
    const dragOverIndexRef = useRef(dragOverIndex);
    const selectedShipIdRef = useRef(selectedShipId);
    const myShipsRef = useRef(myShips);
    const globalRotationRef = useRef(globalRotation);
    const phaseRef = useRef(phase);

    useEffect(() => { draggedShipRef.current = draggedShip; }, [draggedShip]);
    useEffect(() => { dragOverIndexRef.current = dragOverIndex; }, [dragOverIndex]);
    useEffect(() => { selectedShipIdRef.current = selectedShipId; }, [selectedShipId]);
    useEffect(() => { myShipsRef.current = myShips; }, [myShips]);
    useEffect(() => { globalRotationRef.current = globalRotation; }, [globalRotation]);
    useEffect(() => { phaseRef.current = phase; }, [phase]);

    // Derived states
    const shipCategories = Object.entries(shipConfig)
        .map(([size, count]) => ({ size: parseInt(size), maxCount: count }))
        .sort((a, b) => b.size - a.size);

    const allShipsDeployed = shipCategories.every(({ size, maxCount }) => {
        return myShips.filter(s => s.size === size).length === maxCount;
    });

    // --- INIT ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'r' || e.key === 'R') {
                handleRotateRef();
            }
            if (e.key === 'Backspace' || e.key === 'Delete') {
                handleDeleteRef();
            }
        };

        const handleGlobalPointerUp = () => {
            // Cancel drag if we drop outside the board
            if (draggedShipRef.current && dragOverIndexRef.current === null) {
                setDraggedShip(null);
            }
        };

        const handleGlobalPointerDown = (e) => {
            // Multi-touch for Mobile: If we tap a second finger while dragging
            if (draggedShipRef.current) {
                handleRotateRef();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('pointerup', handleGlobalPointerUp);
        window.addEventListener('pointerdown', handleGlobalPointerDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('pointerup', handleGlobalPointerUp);
            window.removeEventListener('pointerdown', handleGlobalPointerDown);
        };
    }, []);

    const handleDeleteRef = () => {
        if (selectedShipIdRef.current) {
            handleRemoveShip(selectedShipIdRef.current);
        }
    };

    const handleRotateRef = () => {
        const currentDragged = draggedShipRef.current;
        const currentSelected = selectedShipIdRef.current;
        const currentShips = myShipsRef.current;

        if (currentDragged) {
            setDraggedShip(prev => ({ ...prev, rotation: prev.rotation + 90 }));
            setGlobalRotation(prev => prev + 90);
            return;
        }

        if (!currentSelected) {
            setGlobalRotation(prev => prev + 90);
            return;
        }

        const ship = currentShips.find(s => s.id === currentSelected);
        if (!ship) return;

        const newRotation = ship.rotation + 90;
        setMyShips(prev => prev.map(s => s.id === ship.id ? { ...s, rotation: newRotation } : s));
    };

    // --- SOCKET LISTENERS ---
    useEffect(() => {
        socket.on('battle_start', (data) => {
            setPhase('battle');
            setIsMyTurn(data.turn === socket.id);
        });
        socket.on('shot_result', (data) => {
            const { x, y, result, shooter, next_turn, sunk_sizes } = data;
            const index = y * BOARD_SIZE + x;
            if (shooter === socket.id) {
                setEnemyBoard(prev => { const newBoard = [...prev]; newBoard[index] = result; return newBoard; });
                if (result === 'hit' && data.sunk_sizes) setEnemySunkShips(data.sunk_sizes);
            } else {
                setMyBoard(prev => { const newBoard = [...prev]; newBoard[index] = result; return newBoard; });
            }
            setIsMyTurn(next_turn === socket.id);
        });
        socket.on('game_over', (data) => {
            setPhase('game_over');
            setResult(data.winner === socket.id ? 'VICTORY' : 'DEFEAT');
        });
        socket.on('error', (data) => {
            alert(data.message);
            setPhase('placement');
        });
        socket.on('player_disconnected', (data) => {
            if (data.forfeit) {
                setTimeout(() => alert("ENEMY RETREATED: " + data.message), 100);
            } else if (!data.silent) {
                setTimeout(() => {
                    alert("SIGNAL LOST: " + data.message + "\nReturning to Lobby.");
                    if (onLeave) onLeave();
                }, 100);
            }
        });
        return () => {
            socket.off('battle_start');
            socket.off('shot_result');
            socket.off('game_over');
            socket.off('error');
            socket.off('player_disconnected');
        };
    }, [socket]);

    // --- ACTIONS ---
    const isPlacementValid = (x, y, size, rotation, ignoreShipId = null) => {
        let x1, y1, x2, y2;
        const rot = (rotation % 360 + 360) % 360;

        if (rot === 0) { x1 = x; y1 = y; x2 = x + size - 1; y2 = y; }
        else if (rot === 90) { x1 = x; y1 = y; x2 = x; y2 = y + size - 1; }
        else if (rot === 180) { x1 = x - size + 1; y1 = y; x2 = x; y2 = y; }
        else if (rot === 270) { x1 = x; y1 = y - size + 1; x2 = x; y2 = y; }

        if (x1 < 0 || x2 >= BOARD_SIZE || y1 < 0 || y2 >= BOARD_SIZE) return false;

        const checkRect = { x1: x1 - 1, y1: y1 - 1, x2: x2 + 1, y2: y2 + 1 };

        for (let s of myShips) {
            if (s.id === ignoreShipId) continue;
            let sx1, sy1, sx2, sy2;
            const srot = (s.rotation % 360 + 360) % 360;
            if (srot === 0) { sx1 = s.x; sy1 = s.y; sx2 = s.x + s.size - 1; sy2 = s.y; }
            else if (srot === 90) { sx1 = s.x; sy1 = s.y; sx2 = s.x; sy2 = s.y + s.size - 1; }
            else if (srot === 180) { sx1 = s.x - s.size + 1; sy1 = s.y; sx2 = s.x; sy2 = s.y; }
            else if (srot === 270) { sx1 = s.x; sy1 = s.y - s.size + 1; sx2 = s.x; sy2 = s.y; }

            if (checkRect.x1 <= sx2 && checkRect.x2 >= sx1 &&
                checkRect.y1 <= sy2 && checkRect.y2 >= sy1) {
                return false;
            }
        }
        return true;
    }

    // CUSTOM DRAG-AND-DROP HANDLERS (Replaces HTML5 Native D&D)
    const handlePointerDown = (e, ship, source = 'yard') => {
        if (e.button !== 0) return; // Only trigger on left click
        e.preventDefault();
        e.stopPropagation();
        if (e.target.releasePointerCapture) {
            e.target.releasePointerCapture(e.pointerId); // Allows pointer events to pass through to grid behind it
        }

        const initialRotation = source === 'board' ? ship.rotation : globalRotationRef.current;
        setDraggedShip({ ...ship, source, rotation: initialRotation });
        setSelectedShipId(null);

        if (source === 'board') {
            setDragOverIndex(ship.y * BOARD_SIZE + ship.x);
        } else {
            setDragOverIndex(null);
        }
    };

    const handlePointerEnter = (index) => {
        if (draggedShipRef.current) {
            setDragOverIndex(index);
        }
    };

    const handlePointerUp = (index) => {
        if (phase !== 'placement' || !draggedShipRef.current) {
            // If they clicked on a placed ship quickly but didn't drag it anywhere, select it
            if (!draggedShipRef.current && phase === 'placement') {
                // Find if a ship is here (handled by the ship overlay click)
            }
            return;
        }

        const x = index % BOARD_SIZE;
        const y = Math.floor(index / BOARD_SIZE);
        const { size, id, source, rotation: placementRotation } = draggedShipRef.current;

        if (isPlacementValid(x, y, size, placementRotation, source === 'board' ? id : null)) {
            if (source === 'board') {
                const newShip = { x, y, size, rotation: placementRotation, id };
                setMyShips(prev => prev.map(s => s.id === id ? newShip : s));
                setSelectedShipId(id);
            } else {
                const newId = `ship-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const newShip = { x, y, size, rotation: placementRotation, id: newId };
                setMyShips(prev => [...prev, newShip]);
                setSelectedShipId(newId);
            }
        }

        setDraggedShip(null);
        setDragOverIndex(null);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        if (phase === 'placement') handleRotateRef();
    };

    const handleMarkRadar = (e, index) => {
        e.preventDefault();
        e.stopPropagation();
        if (phase !== 'battle') return;

        setEnemyBoard(prev => {
            const newBoard = [...prev];
            if (newBoard[index] === null) newBoard[index] = 'marked';
            else if (newBoard[index] === 'marked') newBoard[index] = null;
            return newBoard;
        });
    };

    const handleRotate = () => { handleRotateRef(); };

    const handleRemoveShip = (shipId) => {
        if (phase !== 'placement') return;
        setMyShips(myShips.filter(s => s.id !== shipId));
        setSelectedShipId(null);
    };

    const handleConfirmPlacement = () => {
        const shipsForBackend = myShips.map(s => {
            const rot = (s.rotation % 360 + 360) % 360;
            let finalX = s.x;
            let finalY = s.y;
            let finalVertical = (rot === 90 || rot === 270);
            if (rot === 180) finalX = s.x - s.size + 1;
            if (rot === 270) finalY = s.y - s.size + 1;
            return { size: s.size, x: finalX, y: finalY, vertical: finalVertical };
        });

        socket.emit('place_ships', { room_id: roomCode, ships: shipsForBackend });
        setSelectedShipId(null);
        setPhase('waiting');
    };

    const handleFire = (index) => {
        if (phase !== 'battle' || !isMyTurn || (enemyBoard[index] === 'hit' || enemyBoard[index] === 'miss')) return;
        const x = index % BOARD_SIZE;
        const y = Math.floor(index / BOARD_SIZE);
        socket.emit('fire_shot', { room_id: roomCode, x, y });
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-6xl relative">
            {/* Top Area */}
            <div className="absolute top-0 left-0 w-full flex justify-between items-start px-4">
                <button
                    onClick={onLeave}
                    className="text-[#00f2ea] flex items-center gap-2 hover:text-white transition-colors text-sm font-bold tracking-widest"
                >
                    &larr; ABORT MISSION
                </button>
                {nick && (
                    <div className="text-right">
                        <span className="text-gray-500 text-[10px] tracking-widest">OPERATOR</span>
                        <div className="text-[#a855f7] font-bold tracking-widest text-sm">{nick.toUpperCase()}</div>
                    </div>
                )}
            </div>

            <h1 className="text-3xl md:text-4xl cyber-text-glow font-bold text-[#00f2ea] mt-12 md:mt-8 text-center px-2">
                {phase === 'placement' && "DEPLOY YOUR FLEET"}
                {phase === 'waiting' && "WAITING FOR OPPONENT..."}
                {phase === 'battle' && (isMyTurn ? "YOUR TURN - FIRE!" : "ENEMY TURN - EVADE!")}
                {phase === 'game_over' && result}
            </h1>

            <div className="flex flex-col lg:flex-row gap-8 w-full justify-center items-center lg:items-start" onContextMenu={handleContextMenu}>
                {/* MY BOARD */}
                <div className="cyber-panel p-4 flex flex-col items-center">
                    <h2 className="text-[#39ff14] mb-2 font-bold">MY FLEET</h2>
                    <div
                        className="grid grid-cols-10 grid-rows-10 gap-1 w-[85vw] max-w-[300px] h-[85vw] max-h-[300px] md:max-w-none md:max-h-none md:w-[400px] md:h-[400px] relative mx-auto"
                        onPointerLeave={() => { if (draggedShip) setDragOverIndex(null); }}
                    >
                        {/* Render Drop Zones / Grid */}
                        {myBoard.map((cell, i) => (
                            <div
                                key={`cell-${i}`}
                                onPointerEnter={() => phase === 'placement' ? handlePointerEnter(i) : null}
                                onPointerUp={() => phase === 'placement' ? handlePointerUp(i) : null}
                                className={`
                                    border border-[#39ff1433] flex items-center justify-center text-xs overflow-hidden
                                    bg-[#00000055]
                                    ${cell === 'hit' ? 'text-red-500' : ''}
                                    ${cell === 'miss' ? 'bg-gray-500 opacity-50' : ''}
                                `}
                            >
                                {cell === 'hit' && 'X'}
                                {cell === 'miss' && 'o'}
                            </div>
                        ))}

                        {/* Drag Preview */}
                        {phase === 'placement' && draggedShip && dragOverIndex !== null && (
                            () => {
                                const previewX = dragOverIndex % BOARD_SIZE;
                                const previewY = Math.floor(dragOverIndex / BOARD_SIZE);
                                const previewRotation = draggedShip.rotation;
                                const isValid = isPlacementValid(previewX, previewY, draggedShip.size, previewRotation, draggedShip.source === 'board' ? draggedShip.id : null);
                                const cellWidth = 100 / BOARD_SIZE;
                                const width = cellWidth * draggedShip.size;
                                const height = cellWidth;
                                const left = previewX * cellWidth;
                                const top = previewY * cellWidth;

                                return (
                                    <div
                                        className={`absolute pointer-events-none border-2 border-dashed transition-transform duration-200
                                            ${isValid ? 'bg-[#39ff14] border-white opacity-50' : 'bg-red-500 border-red-900 opacity-60 animate-pulse'}
                                        `}
                                        style={{
                                            width: `calc(${width}% - 4px)`,
                                            height: `calc(${height}% - 4px)`,
                                            left: `calc(${left}% + 2px)`,
                                            top: `calc(${top}% + 2px)`,
                                            transform: `rotate(${previewRotation}deg)`,
                                            transformOrigin: `${50 / draggedShip.size}% 50%`
                                        }}
                                    />
                                );
                            }
                        )()}

                        {/* Render Placed Ships As Overlays */}
                        {myShips.map(ship => {
                            const { x, y, size, rotation, id } = ship;
                            const cellWidth = 100 / BOARD_SIZE;
                            const width = cellWidth * size;
                            const height = cellWidth;
                            const left = x * cellWidth;
                            const top = y * cellWidth;
                            const isSelected = selectedShipId === id;
                            const isDragged = draggedShip && draggedShip.id === id;
                            const isValid = isPlacementValid(x, y, size, rotation, id);

                            return (
                                <div
                                    key={`placed-${id}`}
                                    onPointerDown={(e) => phase === 'placement' ? handlePointerDown(e, ship, 'board') : null}
                                    className={`
                                        absolute shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-200
                                        ${!isValid ? 'bg-red-500 animate-pulse border-2 border-red-900 shadow-[0_0_15px_red] z-20'
                                            : (isSelected ? 'bg-[#ff9900] z-10 shadow-[0_0_15px_#ff9900]' : 'bg-[#39ff14]')}
                                        ${phase === 'placement' ? 'cursor-pointer hover:brightness-125' : ''}
                                        ${isDragged ? 'opacity-20 grayscale blur-[1px] pointer-events-none' : ''}
                                    `}
                                    style={{
                                        width: `calc(${width}% - 4px)`,
                                        height: `calc(${height}% - 4px)`,
                                        left: `calc(${left}% + 2px)`,
                                        top: `calc(${top}% + 2px)`,
                                        transform: `rotate(${rotation}deg) scale(${isSelected ? 1.05 : 1})`,
                                        transformOrigin: `${50 / size}% 50%`,
                                        touchAction: 'none'
                                    }}
                                >
                                    {/* Render Hits directly on the ship */}
                                    {phase !== 'placement' && Array.from({ length: size }).map((_, i) => {
                                        const srot = (rotation % 360 + 360) % 360;
                                        let hx = x, hy = y;
                                        if (srot === 0) hx += i;
                                        else if (srot === 90) hy += i;
                                        else if (srot === 180) hx -= i;
                                        else if (srot === 270) hy -= i;

                                        const isHit = myBoard[hy * BOARD_SIZE + hx] === 'hit';

                                        if (!isHit) return null;

                                        return (
                                            <div
                                                key={`hit-${id}-${i}`}
                                                className="absolute text-red-500 font-black text-xl md:text-2xl drop-shadow-[0_0_5px_red] flex items-center justify-center"
                                                style={{
                                                    width: `${100 / size}%`,
                                                    height: '100%',
                                                    left: `${(i / size) * 100}%`,
                                                    top: 0
                                                }}
                                            >
                                                X
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {/* ENEMY FLEET TRACKER (MOVED HERE) */}
                    {phase !== 'placement' && phase !== 'waiting' && (
                        <div className="cyber-panel p-4 flex flex-col items-center mt-4">
                            <h2 className="text-[#ff9900] mb-2 font-bold text-sm tracking-widest">ENEMY FLEET</h2>
                            <div className="flex flex-wrap gap-4 justify-center">
                                {shipCategories.map(({ size, maxCount }) => {
                                    const sunkCount = enemySunkShips.filter(s => s === size).length;
                                    const aliveCount = maxCount - sunkCount;

                                    return (
                                        <div key={`enemy-ship-${size}`} className="flex flex-col items-center">
                                            <div className={`flex gap-[2px] mb-1 transition-all ${aliveCount <= 0 ? 'opacity-30 scale-90' : ''}`}>
                                                {Array.from({ length: size }).map((_, i) => (
                                                    <div key={i} className={`w-3 h-3 md:w-4 md:h-4 border border-black ${aliveCount > 0 ? 'bg-gray-500' : 'bg-red-600 shadow-[0_0_5px_red]'}`} />
                                                ))}
                                            </div>
                                            <span className={`text-xs font-bold font-mono transition-all ${aliveCount > 0 ? 'text-gray-400' : 'text-red-500 line-through decoration-[2px] opacity-70'}`}>
                                                x{aliveCount}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ENEMY BOARD */}
                {phase !== 'placement' && phase !== 'waiting' && (
                    <div className="flex flex-col gap-4">
                        <div className="cyber-panel p-4">
                            <h2 className="text-red-500 mb-2 font-bold">RADAR (Right-Click to Mark)</h2>
                            <div className="grid grid-cols-10 grid-rows-10 gap-1 w-[85vw] max-w-[300px] h-[85vw] max-h-[300px] md:max-w-none md:max-h-none md:w-[400px] md:h-[400px] mx-auto">
                                {enemyBoard.map((cell, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleFire(i)}
                                        onContextMenu={(e) => handleMarkRadar(e, i)}
                                        className={`
                                             border border-[#ff000033] flex items-center justify-center cursor-crosshair text-xs overflow-hidden transition-all
                                            ${cell === 'hit' ? 'bg-red-500 shadow-[0_0_15px_red]' : 'hover:bg-[#ff000022]'}
                                            ${cell === 'miss' ? 'bg-gray-600' : ''}
                                            ${cell === 'marked' ? 'bg-[#eab308] border-[#eab308] shadow-[0_0_10px_#eab308]' : ''}
                                            ${!cell ? 'bg-[#00000055]' : ''}
                                        `}
                                    >
                                        {cell === 'hit' && 'X'}
                                        {cell === 'miss' && 'o'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* PLACEMENT CONTROLS & YARD */}
                {phase === 'placement' && (
                    <div className="flex flex-col items-center gap-6 w-full lg:w-[450px]">
                        {/* Ship Yard */}
                        <div className="cyber-panel p-4 flex flex-col items-center w-full min-h-[120px]">
                            <h3 className="text-[#00f2ea] text-sm tracking-widest mb-4">AVAILABLE SHIPS</h3>
                            <div className="flex flex-wrap gap-4 justify-center items-end">
                                {shipCategories.map(({ size, maxCount }) => {
                                    const placedCount = myShips.filter(s => s.size === size).length;
                                    const leftCount = maxCount - placedCount;
                                    const isAvailable = leftCount > 0;

                                    return (
                                        <div key={`yard-${size}`} className="flex items-center gap-3">
                                            <div
                                                onPointerDown={(e) => {
                                                    if (isAvailable && phase === 'placement') {
                                                        handlePointerDown(e, { size }, 'yard');
                                                    }
                                                }}
                                                className={`
                                                    shadow-[0_0_8px_#00f2ea] flex transition-transform
                                                    ${isAvailable ? 'bg-[#00f2ea] cursor-grab active:cursor-grabbing hover:scale-105' : 'bg-gray-600 grayscale opacity-50 cursor-not-allowed'}
                                                `}
                                                style={{
                                                    width: `${size * 25}px`,
                                                    height: '25px',
                                                    background: `repeating-linear-gradient(
                                                        to right,
                                                        ${isAvailable ? '#00f2ea' : '#4b5563'},
                                                        ${isAvailable ? '#00f2ea' : '#4b5563'} 23px,
                                                        transparent 23px,
                                                        transparent 25px
                                                    )`,
                                                    touchAction: 'none'
                                                }}
                                            />
                                            <span className={`text-sm font-bold font-mono ${isAvailable ? 'text-white' : 'text-gray-500'}`}>x{leftCount}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col gap-4 items-stretch w-full">
                            <button onClick={handleRotate} className="cyber-button group relative">
                                ROTATE (R / Right Click)
                                {selectedShipId ? (
                                    <span className="ml-2 text-red-500 font-bold text-xs uppercase">Selected</span>
                                ) : (
                                    <span className="ml-2 text-[#a855f7] font-bold text-xs uppercase">
                                        Next: {globalRotation % 180 === 0 ? 'HORIZONTAL' : 'VERTICAL'}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => selectedShipId && handleRemoveShip(selectedShipId)}
                                disabled={!selectedShipId}
                                className={`cyber-button ${!selectedShipId ? 'opacity-50 cursor-not-allowed' : 'text-red-500 border-red-500 hover:bg-red-500 hover:text-white'}`}
                            >
                                REMOVE SHIP (DEL)
                            </button>

                            <button
                                onClick={handleConfirmPlacement}
                                disabled={!(allShipsDeployed && myShips.every(s => isPlacementValid(s.x, s.y, s.size, s.rotation, s.id)))}
                                className={`cyber-button ${(allShipsDeployed && myShips.every(s => isPlacementValid(s.x, s.y, s.size, s.rotation, s.id))) ? 'bg-[#39ff14] text-black shadow-[0_0_15px_#39ff14]' : 'opacity-50 cursor-not-allowed'}`}
                            >
                                CONFIRM DEPLOYMENT
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* GAME OVER MODAL */}
            {phase === 'game_over' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4">
                    <div className={`cyber-panel p-8 md:p-12 flex flex-col items-center gap-6 text-center max-w-md w-full border-2 
                        ${result === 'VICTORY' ? 'border-[#39ff14] shadow-[0_0_30px_rgba(57,255,20,0.2)]' : 'border-red-500 shadow-[0_0_30px_rgba(255,0,0,0.2)]'}
                    `}>
                        <h2 className={`text-5xl md:text-6xl font-black tracking-tighter cyber-text-glow ${result === 'VICTORY' ? 'text-[#39ff14]' : 'text-red-500'}`}>
                            {result}
                        </h2>
                        <p className="text-gray-400 text-sm tracking-widest mb-4">
                            {result === 'VICTORY' ? "MISSION ACCOMPLISHED." : "ALL SHIPS LOST."}
                        </p>
                        <button onClick={onLeave} className="cyber-button w-full text-lg py-4 hover:scale-105 transition-transform">
                            RETURN TO LOBBY / ABORT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
