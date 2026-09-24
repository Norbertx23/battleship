import { useCallback, useEffect, useRef, useState } from 'react';
import useSocket from './useSocket';
import { useLocalStorage } from './useLocalStorage';

export default function useLobbySocket() {
    const socket = useSocket();

    const [view, setView] = useState('menu');
    const [guestNick] = useState(() => 'Player_' + Math.floor(Math.random() * 1000));
    const [nick, setNick] = useLocalStorage('bs_nick', guestNick);
    const [gameCode, setGameCode] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [shipConfig, setShipConfig] = useState({ '4': 1, '3': 2, '2': 2, '1': 4 });
    const [resumeState, setResumeState] = useState(null);
    const [resumeKey, setResumeKey] = useState(0);

    const viewRef = useRef(view);
    const activeRoomRef = useRef('');
    const nickRef = useRef(nick);

    useEffect(() => {
        viewRef.current = view;
    }, [view]);

    useEffect(() => {
        activeRoomRef.current = roomCode || gameCode;
    }, [roomCode, gameCode]);

    useEffect(() => {
        nickRef.current = nick;
    }, [nick]);

    useEffect(() => {
        const handleSession = (data) => {
            if (data.room_id && data.token) {
                sessionStorage.setItem('bs_token_' + data.room_id, data.token);
            }
        };
        const handleRoomCreated = (data) => {
            console.log('Room Created Event Received:', data);
            setRoomCode(data.room_id);
            setView('room_created');
        };
        const handleGameStart = (data) => {
            console.log('GAME STARTED! Config:', data.config);
            setResumeState(null);
            setShipConfig(data.config);
            setResumeKey(prev => prev + 1);
            setView('game');
        };
        const handleGameResumed = (data) => {
            console.log('GAME RESUMED!', data);
            setShipConfig(data.config);
            setRoomCode(data.room_id);
            setGameCode(data.room_id);
            if (data.nick) setNick(data.nick);
            if (data.phase === 'lobby') {
                setResumeState(null);
                setView('room_created');
                return;
            }
            setResumeState(data);
            setResumeKey(prev => prev + 1);
            setView('game');
        };
        const handleConnect = () => {
            const activeRoom = activeRoomRef.current;
            if (viewRef.current === 'menu' || !activeRoom) return;
            const token = sessionStorage.getItem('bs_token_' + activeRoom);
            if (!token) return;
            console.log('Reconnected - rejoining room', activeRoom);
            socket.emit('join_room', { room_id: activeRoom, nick: nickRef.current, config: {}, token, rejoin: true });
        };
        const handleRejoinFailed = (data) => {
            const activeRoom = activeRoomRef.current;
            if (activeRoom) sessionStorage.removeItem('bs_token_' + activeRoom);
            alert('SIGNAL LOST: ' + data.message + '\nReturning to Lobby.');
            setResumeState(null);
            setRoomCode('');
            setGameCode('');
            setView('menu');
        };
        const handleError = (data) => alert(data.message);
        const handlePlayerDisconnected = (data) => {
            if (viewRef.current !== 'menu' && !data.silent) {
                alert('SIGNAL LOST: ' + data.message + '\nReturning to Lobby.');
                setView('menu');
                setRoomCode('');
            }
        };

        socket.on('connect', handleConnect);
        socket.on('rejoin_failed', handleRejoinFailed);
        socket.on('session', handleSession);
        socket.on('room_created', handleRoomCreated);
        socket.on('game_start', handleGameStart);
        socket.on('game_resumed', handleGameResumed);
        socket.on('error', handleError);
        socket.on('player_disconnected', handlePlayerDisconnected);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('rejoin_failed', handleRejoinFailed);
            socket.off('session', handleSession);
            socket.off('room_created', handleRoomCreated);
            socket.off('game_start', handleGameStart);
            socket.off('game_resumed', handleGameResumed);
            socket.off('error', handleError);
            socket.off('player_disconnected', handlePlayerDisconnected);
        };
    }, [socket, setNick]);

    const createRoom = useCallback(() => {
        console.log('Creating room with ship config:', shipConfig);
        socket.emit('create_room', { nick, config: shipConfig });
    }, [socket, nick, shipConfig]);

    const joinRoom = useCallback(() => {
        const code = gameCode.trim().toUpperCase();
        setGameCode(code);
        const token = sessionStorage.getItem('bs_token_' + code) || undefined;
        socket.emit('join_room', { room_id: code, nick, config: {}, token });
    }, [socket, gameCode, nick]);

    const leaveRoom = useCallback(() => {
        const activeRoom = roomCode || gameCode;
        if (activeRoom) {
            socket.emit('leave_room', { room_id: activeRoom });
            sessionStorage.removeItem('bs_token_' + activeRoom);
        }
        setView('menu');
        setRoomCode('');
        setGameCode('');
        setResumeState(null);
    }, [socket, roomCode, gameCode]);

    return {
        socket,
        view,
        setView,
        nick,
        setNick,
        guestNick,
        gameCode,
        setGameCode,
        roomCode,
        shipConfig,
        setShipConfig,
        resumeState,
        resumeKey,
        createRoom,
        joinRoom,
        leaveRoom,
    };
}
