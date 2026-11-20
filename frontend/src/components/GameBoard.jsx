import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RotateCw, Trash2, X } from 'lucide-react';
import CodeField from './CodeField';
import { useNotice } from '../notice/useNotice';
import PaperLayout from './layout/PaperLayout';
import BoardFrame from './board/BoardFrame';
import { cellClasses } from './board/cellClasses';

const BOARD_SIZE = 10;
const createEmptyBoard = () => Array(BOARD_SIZE * BOARD_SIZE).fill(null);

const COLS = 'ABCDEFGHIJ';
const cellLabel = (i) => `${COLS[i % BOARD_SIZE]}${Math.floor(i / BOARD_SIZE) + 1}`;
const BOARD_WIDTH = 'w-full max-w-100 md:w-100 md:portrait:w-80';

const overlayCells = (ship) => {
    const rot = (ship.rotation % 360 + 360) % 360;
    return Array.from({ length: ship.size }, (_, i) => {
        const x = ship.x + (rot === 0 ? i : rot === 180 ? -i : 0);
        const y = ship.y + (rot === 90 ? i : rot === 270 ? -i : 0);
        return y * BOARD_SIZE + x;
    });
};

const getShipCells = (ships) => {
    const cells = new Set();
    (ships || []).forEach(ship => {
        for (let i = 0; i < ship.size; i++) {
            const cx = ship.x + (ship.vertical ? 0 : i);
            const cy = ship.y + (ship.vertical ? i : 0);
            cells.add(cy * BOARD_SIZE + cx);
        }
    });
    return cells;
};

const resumeShipsToOverlay = (ships) => (ships || []).map((s, i) => ({
    x: s.x,
    y: s.y,
    size: s.size,
    rotation: s.vertical ? 90 : 0,
    id: `resume-${i}-${s.x}-${s.y}`,
}));

const boardFromShots = (shots) => {
    const board = createEmptyBoard();
    (shots || []).forEach(s => { board[s.y * BOARD_SIZE + s.x] = s.result; });
    return board;
};

export default function Battle({ socket, roomCode, shipConfig, onLeave, nick, opponent, resumeState }) {
    const { t } = useTranslation();
    const { notify } = useNotice();
    const twoFingerAtRef = useRef(0);
    const [phase, setPhase] = useState(() => (resumeState && resumeState.phase) ? resumeState.phase : (resumeState ? 'battle' : 'placement'));
    const [myShips, setMyShips] = useState(() => resumeState ? resumeShipsToOverlay(resumeState.my_ships) : []);
    const [myBoard, setMyBoard] = useState(() => resumeState ? boardFromShots(resumeState.enemy_shots) : createEmptyBoard());
    const [enemyBoard, setEnemyBoard] = useState(() => resumeState ? boardFromShots(resumeState.my_shots) : createEmptyBoard());
    const [isMyTurn, setIsMyTurn] = useState(() => resumeState ? !!resumeState.my_turn : false);
    const [result, setResult] = useState(null);
    const [enemySunkShips, setEnemySunkShips] = useState(() => resumeState ? (resumeState.enemy_sunk_sizes || []) : []);
    const [enemyShips, setEnemyShips] = useState([]);
    const [sunkMessage, setSunkMessage] = useState(null);
    const [opponentHitMessage, setOpponentHitMessage] = useState(null);
    const [isMarkMode, setIsMarkMode] = useState(false);
    const [playAgain, setPlayAgain] = useState('idle');
    const [graceInfo, setGraceInfo] = useState(null);
    const [draggedShip, setDraggedShip] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [selectedShipId, setSelectedShipId] = useState(null);
    const [globalRotation, setGlobalRotation] = useState(0);

    const draggedShipRef = useRef(draggedShip);
    const dragOverIndexRef = useRef(dragOverIndex);
    const selectedShipIdRef = useRef(selectedShipId);
    const myShipsRef = useRef(myShips);
    const globalRotationRef = useRef(globalRotation);
    const phaseRef = useRef(phase);
    const dragPointerIdRef = useRef(null);
    const dragPointerTypeRef = useRef(null);
    const opponentHitTimerRef = useRef(null);

    useEffect(() => { draggedShipRef.current = draggedShip; }, [draggedShip]);
    useEffect(() => { dragOverIndexRef.current = dragOverIndex; }, [dragOverIndex]);
    useEffect(() => { selectedShipIdRef.current = selectedShipId; }, [selectedShipId]);
    useEffect(() => { myShipsRef.current = myShips; }, [myShips]);
    useEffect(() => { globalRotationRef.current = globalRotation; }, [globalRotation]);
    useEffect(() => { phaseRef.current = phase; }, [phase]);

    const shipCategories = Object.entries(shipConfig)
        .map(([size, count]) => ({ size: parseInt(size), maxCount: count }))
        .sort((a, b) => b.size - a.size);

    const allShipsDeployed = shipCategories.every(({ size, maxCount }) => {
        return myShips.filter(s => s.size === size).length === maxCount;
    });

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
            if (draggedShipRef.current && dragOverIndexRef.current === null) {
                setDraggedShip(null);
            }
        };

        const handleGlobalPointerDown = (e) => {
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

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [phase]);

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
                if (result === 'hit' && data.sunk_sizes) {
                    setEnemySunkShips(prev => {
                        if (data.sunk_sizes.length > prev.length) {
                            setSunkMessage(true);
                            setTimeout(() => setSunkMessage(null), 3000);
                        }
                        return data.sunk_sizes;
                    });
                }
            } else {
                setMyBoard(prev => { const newBoard = [...prev]; newBoard[index] = result; return newBoard; });
                if (result === 'hit') {
                    setOpponentHitMessage(cellLabel(index));
                    if (opponentHitTimerRef.current) clearTimeout(opponentHitTimerRef.current);
                    opponentHitTimerRef.current = setTimeout(() => setOpponentHitMessage(null), 3000);
                }
            }
            setIsMyTurn(next_turn === socket.id);
        });
        socket.on('game_over', (data) => {
            setGraceInfo(null);
            setPhase('game_over');
            setResult(data.winner === socket.id ? 'VICTORY' : 'DEFEAT');
            if (data.enemy_ships) setEnemyShips(data.enemy_ships);
        });
        socket.on('opponent_disconnected', (data) => {
            setGraceInfo({ nick: data.nick, secondsLeft: data.grace || 60 });
        });
        socket.on('opponent_reconnected', () => {
            setGraceInfo(null);
        });
        const handleError = (data) => {
            notify(data);
            setPhase('placement');
        };
        socket.on('error', handleError);
        const handlePlayAgainPending = () => setPlayAgain('asked');
        socket.on('play_again_pending', handlePlayAgainPending);
        const handlePlayerDisconnected = (data) => {
            if (data.opponent_left) setPlayAgain('unavailable');
            if (data.forfeit) {
                setTimeout(() => {
                    notify({ ...data, tone: 'info' });
                    if (onLeave) onLeave();
                }, 100);
            } else if (!data.silent) {
                setTimeout(() => {
                    notify(data);
                    if (onLeave) onLeave();
                }, 100);
            }
        };
        socket.on('player_disconnected', handlePlayerDisconnected);
        return () => {
            if (opponentHitTimerRef.current) clearTimeout(opponentHitTimerRef.current);
            socket.off('battle_start');
            socket.off('shot_result');
            socket.off('game_over');
            socket.off('opponent_disconnected');
            socket.off('opponent_reconnected');
            socket.off('error', handleError);
            socket.off('player_disconnected', handlePlayerDisconnected);
            socket.off('play_again_pending', handlePlayAgainPending);
        };
    }, [socket, notify]);

    const isPaused = graceInfo !== null;
    useEffect(() => {
        if (!isPaused) return;
        const timer = setInterval(() => {
            setGraceInfo(prev => {
                if (!prev) return prev;
                return { ...prev, secondsLeft: Math.max(0, prev.secondsLeft - 1) };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isPaused]);

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

    const handlePointerDown = (e, ship, source = 'yard') => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.target.releasePointerCapture) {
            e.target.releasePointerCapture(e.pointerId);
        }

        const initialRotation = source === 'board' ? ship.rotation : globalRotationRef.current;
        setDraggedShip({ ...ship, source, rotation: initialRotation });
        setSelectedShipId(null);
        dragPointerIdRef.current = e.pointerId;
        dragPointerTypeRef.current = e.pointerType;

        if (source === 'board') {
            setDragOverIndex(ship.y * BOARD_SIZE + ship.x);
        } else {
            setDragOverIndex(null);
        }
    };

    const handlePointerEnter = (e, index) => {
        if (e.pointerType !== 'mouse' && !e.isPrimary) return;
        if (dragPointerTypeRef.current !== null && e.pointerType !== dragPointerTypeRef.current) return;

        if (dragPointerIdRef.current !== null && e.pointerId !== dragPointerIdRef.current) {
            return;
        }
        if (draggedShipRef.current) {
            setDragOverIndex(index);
        }
    };

    const handleGridPointerLeave = (e) => {
        if (e.pointerType !== 'mouse' && !e.isPrimary) return;
        if (dragPointerTypeRef.current !== null && e.pointerType !== dragPointerTypeRef.current) return;
        if (dragPointerIdRef.current !== null && e.pointerId !== dragPointerIdRef.current) return;
        if (draggedShipRef.current) setDragOverIndex(null);
    };

    const handlePointerUp = (e, index) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();

            if (e.pointerType !== 'mouse' && !e.isPrimary) return;
            if (dragPointerTypeRef.current !== null && e.pointerType !== dragPointerTypeRef.current) return;

            if (dragPointerIdRef.current !== null && e.pointerId !== dragPointerIdRef.current) {
                return;
            }
        }

        if (phase !== 'placement' || !draggedShipRef.current) {
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
        dragPointerIdRef.current = null;
        dragPointerTypeRef.current = null;
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

    const handleFireOrMark = (e, index) => {
        if (phase !== 'battle') return;
        if (graceInfo) return;

        if (isMarkMode) {
            handleMarkRadar(e, index);
        } else {
            if (!isMyTurn) return;
            if (enemyBoard[index] === 'hit' || enemyBoard[index] === 'miss') return;
            const x = index % BOARD_SIZE;
            const y = Math.floor(index / BOARD_SIZE);
            socket.emit('fire_shot', { room_id: roomCode, x, y });
        }
    };


    const handleClearBoard = () => {
        if (phase !== 'placement') return;
        setMyShips([]);
        setSelectedShipId(null);
    };

    const handleRadarClick = (e, index) => {
        if (Date.now() - twoFingerAtRef.current < 600) return;
        handleFireOrMark(e, index);
    };

    const handleRadarTouch = (e, index) => {
        if (e.touches && e.touches.length === 2) {
            twoFingerAtRef.current = Date.now();
            handleMarkRadar(e, index);
        }
    };

    const handlePlayAgain = () => {
        socket.emit('play_again', { room_id: roomCode });
        setPlayAgain('waiting');
    };

    const opponentName = opponent || t('game.opponentFallback');
    const enemyShipCells = phase === 'game_over' ? getShipCells(enemyShips) : null;
    const myShipCells = new Set(myShips.flatMap(overlayCells));
    const allValid = myShips.every(s => isPlacementValid(s.x, s.y, s.size, s.rotation, s.id));
    const canConfirm = allShipsDeployed && allValid;
    const shipsLeft = shipCategories.reduce((sum, { size, maxCount }) => sum + maxCount - myShips.filter(s => s.size === size).length, 0);

    const myCellKind = (i) => {
        if (phase === 'placement') return 'empty';
        const cell = myBoard[i];
        if (myShipCells.has(i)) return cell === 'hit' ? 'shipHit' : 'ship';
        if (cell === 'hit') return 'hit';
        if (cell === 'miss') return 'miss';
        return 'empty';
    };

    const enemyCellKind = (i) => {
        const cell = enemyBoard[i];
        if (cell === 'hit') return phase === 'game_over' ? 'sunk' : 'hit';
        if (enemyShipCells && enemyShipCells.has(i)) return 'ghost';
        if (cell === 'miss') return 'miss';
        if (cell === 'marked') return 'mark';
        return 'empty';
    };

    const playAgainLabel = {
        idle: t('gameOver.again'),
        waiting: t('gameOver.waiting', { nick: opponentName }),
        asked: t('gameOver.accept'),
        unavailable: t('gameOver.unavailable'),
    }[playAgain];
    const playAgainHint = { idle: '', waiting: t('gameOver.sent'), asked: t('gameOver.wants', { nick: opponentName }), unavailable: '' }[playAgain];
    const playAgainDisabled = playAgain === 'waiting' || playAgain === 'unavailable';

    const title = {
        placement: t('deploy.title'),
        waiting: t('deploy.waiting'),
        battle: isMyTurn ? t('battle.turn') : t('battle.enemyTurn'),
    }[phase];

    const status = sunkMessage
        ? t('battle.sunk')
        : opponentHitMessage ? t('battle.opponentHit', { cell: opponentHitMessage }) : null;

    const players = (
        <span className="flex flex-wrap items-center gap-x-1.5 text-base text-pencil">
            <span className="max-w-[12ch] truncate font-bold text-ink-dark" title={nick}>{nick}</span>
            {opponent && <><span className="font-hand text-2xl text-pen">vs</span><span className="max-w-[12ch] truncate font-bold text-ink-dark" title={opponent}>{opponent}</span></>}
            {roomCode && <><span>· {t('game.room')}</span><CodeField code={roomCode} revealable size="sm" /></>}
        </span>
    );

    const note = 'flex flex-col items-center gap-3.5 bg-white p-3 sm:p-5.5 note-shadow';
    const h2Hand = 'm-0 self-start font-hand text-3xl font-bold';

    const myBoardSection = (
        <section className={`${note} -rotate-[0.4deg]`}>
            <h2 className={h2Hand}>{t('game.myFleet')}</h2>
            <div data-slot="board-width" className={BOARD_WIDTH}>
                <BoardFrame
                    label={t('game.myFleet')}
                    boardProps={{
                        onPointerLeave: handleGridPointerLeave,
                        style: phase === 'placement' ? { touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' } : undefined,
                    }}
                >
                    {myBoard.map((_, i) => (
                        <div
                            key={`cell-${i}`}
                            data-state={myCellKind(i)}
                            onPointerEnter={(e) => phase === 'placement' ? handlePointerEnter(e, i) : null}
                            onPointerUp={(e) => phase === 'placement' ? handlePointerUp(e, i) : null}
                            className={cellClasses(myCellKind(i))}
                        />
                    ))}

                    {phase === 'placement' && draggedShip && dragOverIndex !== null && (() => {
                        const px = dragOverIndex % BOARD_SIZE;
                        const py = Math.floor(dragOverIndex / BOARD_SIZE);
                        const valid = isPlacementValid(px, py, draggedShip.size, draggedShip.rotation, draggedShip.source === 'board' ? draggedShip.id : null);
                        const cw = 100 / BOARD_SIZE;
                        return (
                            <div
                                className={`pointer-events-none absolute border-2 border-dashed ${valid ? 'border-ink bg-ink/25' : 'border-pen bg-pen/30'}`}
                                style={{
                                    width: `${cw * draggedShip.size}%`,
                                    height: `${cw}%`,
                                    left: `${px * cw}%`,
                                    top: `${py * cw}%`,
                                    transform: `rotate(${draggedShip.rotation}deg)`,
                                    transformOrigin: `${50 / draggedShip.size}% 50%`,
                                }}
                            />
                        );
                    })()}

                    {phase === 'placement' && myShips.map(ship => {
                        const { x, y, size, rotation, id } = ship;
                        const cw = 100 / BOARD_SIZE;
                        const isSelected = selectedShipId === id;
                        const isDragged = draggedShip && draggedShip.id === id;
                        const valid = isPlacementValid(x, y, size, rotation, id);
                        return (
                            <div
                                key={`placed-${id}`}
                                data-ship={id}
                                onPointerDown={(e) => handlePointerDown(e, ship, 'board')}
                                className={`absolute cursor-pointer select-none transition-transform duration-200
                                    ${!valid ? 'z-20 bg-pen/30 shadow-[inset_0_0_0_2px_var(--color-pen)]'
                                        : isSelected ? 'z-10 bg-ship shadow-[inset_0_0_0_3px_var(--color-pen)]' : 'bg-ship shadow-[inset_0_0_0_2px_var(--color-ink)]'}
                                    ${isDragged ? 'pointer-events-none opacity-25' : ''}`}
                                style={{
                                    width: `${cw * size}%`,
                                    height: `${cw}%`,
                                    left: `${x * cw}%`,
                                    top: `${y * cw}%`,
                                    transform: `rotate(${rotation}deg)`,
                                    transformOrigin: `${50 / size}% 50%`,
                                    touchAction: 'none',
                                    WebkitTouchCallout: 'none',
                                    userSelect: 'none',
                                }}
                            />
                        );
                    })}
                </BoardFrame>
            </div>
        </section>
    );

    const radarSection = (
        <section className={`${note} rotate-[0.6deg]`}>
            <div className="flex flex-wrap items-center justify-between gap-3 self-stretch">
                <h2 className="m-0 font-hand text-3xl font-bold">{phase === 'game_over' ? t('gameOver.theirFleet') : t('battle.theirSea')}</h2>
                {phase === 'battle' && (
                    <button
                        type="button"
                        onClick={() => setIsMarkMode(v => !v)}
                        aria-pressed={isMarkMode}
                        className={`sketch-border whitespace-nowrap min-h-10 cursor-pointer border-ink-dark px-4 text-sm font-extrabold text-ink-dark ${isMarkMode ? 'bg-highlight' : 'bg-white'}`}
                    >
                        {isMarkMode ? t('battle.markOn') : t('battle.markOff')}
                    </button>
                )}
            </div>
            <div data-slot="board-width" className={BOARD_WIDTH}>
                <BoardFrame label={t('battle.theirSea')}>
                    {enemyBoard.map((_, i) => {
                        const kind = enemyCellKind(i);
                        if (phase === 'game_over') return <div key={i} data-state={kind} className={cellClasses(kind)} />;
                        return (
                            <button
                                key={i}
                                type="button"
                                aria-label={cellLabel(i)}
                                data-state={kind}
                                onClick={(e) => handleRadarClick(e, i)}
                                onContextMenu={(e) => handleMarkRadar(e, i)}
                                onTouchStart={(e) => handleRadarTouch(e, i)}
                                className={cellClasses(kind, { interactive: true })}
                            />
                        );
                    })}
                </BoardFrame>
            </div>
        </section>
    );

    const fleetAside = (
        <aside className="flex max-w-70 flex-[1_1_13.75rem] -rotate-1 flex-col gap-2.5 bg-white p-5.5 note-shadow">
            <h2 className="m-0 mb-1 font-hand text-3xl font-bold">{t('battle.afloat')}</h2>
            {shipCategories.flatMap(({ size, maxCount }) => {
                const sunk = enemySunkShips.filter(s => s === size).length;
                return Array.from({ length: maxCount }, (_, k) => {
                    const isSunk = k < sunk;
                    return (
                        <div key={`${size}-${k}`} className="flex items-center justify-between gap-2.5 text-base">
                            <span className={isSunk ? 'text-placeholder line-through decoration-pen decoration-2' : ''}>{t('battle.shipName', { n: size })}</span>
                            <span aria-hidden="true" className="flex gap-0.5">
                                {Array.from({ length: size }).map((__, p) => (
                                    <span key={p} className={`size-3.5 border-[1.5px] border-ink ${isSunk ? 'bg-[#F4C9C2]' : 'bg-ship'}`} />
                                ))}
                            </span>
                        </div>
                    );
                });
            })}
            <p className="m-0 mt-2.5 font-hand text-2xl leading-tight text-pencil">{t('battle.tip')}</p>
        </aside>
    );

    const legendAside = (
        <aside className="flex max-w-65 flex-[1_1_12.5rem] -rotate-1 flex-col gap-2.5 bg-white p-5 text-sm text-[#4A4843] note-shadow">
            <h2 className="m-0 font-hand text-2xl font-bold text-ink-dark">{t('gameOver.key')}</h2>
            <div className="flex items-center gap-2.5"><span className={`${cellClasses('sunk')} w-6 border border-gridline`} />{t('gameOver.sunk')}</div>
            <div className="flex items-center gap-2.5"><span className={`${cellClasses('miss')} w-6 border border-gridline`} />{t('gameOver.miss')}</div>
            <div className="flex items-center gap-2.5"><span className={`${cellClasses('ghost')} w-6`} />{t('gameOver.never')}</div>
        </aside>
    );

    const shipyard = (
        <aside className="flex max-w-90 flex-[1_1_18.75rem] flex-col gap-5">
            <section className="relative flex rotate-[0.6deg] flex-col gap-2 bg-white px-5 pt-6 pb-5 note-shadow">
                <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-24 -ml-12 -rotate-3 bg-[rgba(244,217,120,0.75)]" />
                <h2 className="m-0 mb-1.5 font-hand text-3xl font-bold text-ink">{t('deploy.shipyard')}</h2>
                {shipCategories.map(({ size, maxCount }) => {
                    const left = maxCount - myShips.filter(s => s.size === size).length;
                    const available = left > 0;
                    return (
                        <div key={`yard-${size}`} className={`flex items-center gap-3.5 px-3.5 py-2.5 ${available ? '' : 'opacity-45'}`}>
                            <div
                                onPointerDown={(e) => { if (available) handlePointerDown(e, { size }, 'yard'); }}
                                className={`flex gap-0.5 ${available ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'}`}
                                style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
                            >
                                {Array.from({ length: size }).map((_, i) => (
                                    <span key={i} className="size-5 bg-ship shadow-[inset_0_0_0_2px_var(--color-ink)]" />
                                ))}
                            </div>
                            <span className="flex-grow text-base font-extrabold">{t('deploy.mast', { n: size })}</span>
                            <span className={`font-hand text-2xl font-bold ${available ? 'text-ink' : 'text-pencil'}`}>{available ? `× ${left}` : t('deploy.done')}</span>
                        </div>
                    );
                })}
                <div className="mt-2 flex flex-wrap gap-2.5">
                    <button type="button" onClick={handleRotate} className="sketch-border whitespace-nowrap inline-flex min-h-11 flex-[1_1_7.5rem] cursor-pointer items-center justify-center gap-2 border-ink-dark bg-white text-base font-extrabold text-ink-dark">
                        <RotateCw size={18} aria-hidden="true" />{globalRotation % 180 === 0 ? t('deploy.rotH') : t('deploy.rotV')}
                    </button>
                    <button type="button" onClick={() => selectedShipId && handleRemoveShip(selectedShipId)} disabled={!selectedShipId} className="sketch-border whitespace-nowrap inline-flex min-h-11 flex-[1_1_7.5rem] cursor-pointer items-center justify-center gap-2 border-pen-dark bg-white text-base font-extrabold text-pen-dark disabled:cursor-not-allowed disabled:opacity-40">
                        <X size={18} aria-hidden="true" />{t('deploy.remove')}
                    </button>
                    <button type="button" onClick={handleClearBoard} className="sketch-border whitespace-nowrap inline-flex min-h-11 flex-[1_1_7.5rem] cursor-pointer items-center justify-center gap-2 border-pen-dark bg-white text-base font-extrabold text-pen-dark">
                        <Trash2 size={18} aria-hidden="true" />{t('deploy.clear')}
                    </button>
                </div>
            </section>

            <ul className="m-0 flex list-none flex-col gap-2 px-1 text-sm text-[#4A4843]">
                <li>{t('deploy.tip1')}</li>
                <li><kbd className="rounded-md border-[1.5px] border-ink-dark bg-white px-1.5 text-sm font-extrabold">R</kbd> {t('deploy.tip2')}</li>
                <li>{t('deploy.tip3')}</li>
            </ul>

            <button
                type="button"
                onClick={handleConfirmPlacement}
                disabled={!canConfirm}
                className={`sketch-border whitespace-nowrap min-h-14 text-lg font-extrabold text-white ${canConfirm ? 'cursor-pointer border-ink bg-ink' : 'cursor-not-allowed border-disabled bg-disabled'}`}
            >
                {canConfirm ? t('deploy.ready') : t('deploy.notReady')}
            </button>
        </aside>
    );

    return (
        <PaperLayout withNav={false} withFooter={false} headerRight={players} gap="gap-4" padding="pt-5 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <button type="button" onClick={onLeave} className="inline-flex min-h-11 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-bold text-ink-dark">
                    <ArrowLeft size={20} aria-hidden="true" />{phase === 'game_over' ? t('gameOver.back') : t('game.leave')}
                </button>
                {phase === 'placement' && <span className="font-hand text-2xl text-pencil">{shipsLeft === 0 ? t('deploy.allPlaced') : t('deploy.left', { n: shipsLeft })}</span>}
            </div>

            {phase === 'game_over' ? (
                <section className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <h1 className={`m-0 font-hand text-6xl md:text-8xl leading-[1.1] font-bold underline decoration-pen decoration-wavy decoration-[3px] underline-offset-[16px] ${result === 'VICTORY' ? 'text-ink' : 'text-pen-dark'}`}>
                            {result === 'VICTORY' ? t('gameOver.won') : t('gameOver.lost')}
                        </h1>
                        <p className="m-0 mt-4 max-w-115 text-lg text-[#4A4843]">
                            {result === 'VICTORY' ? t('gameOver.wonSub', { nick: opponentName }) : t('gameOver.lostSub', { nick: opponentName })}
                        </p>
                    </div>
                    <div className="flex min-w-65 flex-col gap-3">
                        <button
                            type="button"
                            onClick={handlePlayAgain}
                            disabled={playAgainDisabled}
                            className={`sketch-border whitespace-nowrap min-h-14 px-7 text-lg font-extrabold text-white ${playAgainDisabled ? 'cursor-not-allowed border-disabled bg-disabled' : playAgain === 'asked' ? 'cursor-pointer border-pen bg-pen' : 'cursor-pointer border-ink bg-ink'}`}
                        >
                            {playAgainLabel}
                        </button>
                        <span role="status" className="min-h-6.5 font-hand text-2xl text-pencil">{playAgainHint}</span>
                    </div>
                </section>
            ) : (
                <h1 className="m-0 text-center font-hand text-5xl leading-none font-bold text-ink">{title}</h1>
            )}

            {phase === 'battle' && (
                <div data-slot="battle-status" role="status" className="flex min-h-11 items-center justify-center">
                    {status && (
                        <span className="-rotate-1 bg-white px-4.5 py-1 font-hand text-2xl text-pen-dark shadow-[0_6px_16px_-10px_rgba(60,40,10,0.4)]">{status}</span>
                    )}
                </div>
            )}

            <main className="flex flex-wrap items-start justify-center gap-8" onContextMenu={handleContextMenu}>
                {myBoardSection}
                {(phase === 'battle' || phase === 'game_over') && radarSection}
                {phase === 'battle' && fleetAside}
                {phase === 'game_over' && legendAside}
                {(phase === 'placement' || phase === 'waiting') && (phase === 'placement' ? shipyard : (
                    <aside role="status" className="flex max-w-90 flex-[1_1_18.75rem] items-center justify-center p-6 font-hand text-3xl text-pencil">{t('deploy.waiting')}</aside>
                ))}
            </main>

            {graceInfo && phase === 'battle' && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-paper/85 px-4">
                    <div role="alertdialog" aria-live="assertive" className="flex w-full max-w-md -rotate-1 flex-col items-center gap-4 bg-white p-8 text-center note-shadow">
                        <p className="m-0 font-hand text-3xl font-bold text-pen-dark">{t('battle.paused', { nick: graceInfo.nick || opponentName, s: graceInfo.secondsLeft })}</p>
                        {roomCode && <CodeField code={roomCode} revealable size="sm" />}
                    </div>
                </div>
            )}
        </PaperLayout>
    );
}
