import { useCallback, useEffect, useRef, useState } from 'react';
import useSocket from './useSocket';

export default function useLobbySocket() {
    const socket = useSocket();

    const [view, setView] = useState('menu');
    const [nick, setNick] = useState(() => 'Player_' + Math.floor(Math.random() * 1000));
    const [gameCode, setGameCode] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [shipConfig, setShipConfig] = useState({ '4': 1, '3': 2, '2': 2, '1': 4 });
    const [resumeState, setResumeState] = useState(null);

    const viewRef = useRef(view);

    useEffect(() => {
        viewRef.current = view;
    }, [view]);

    useEffect(() => {
        const handleSession = (data) => {
            if (data.room_id && data.token) {
                localStorage.setItem('bs_token_' + data.room_id, data.token);
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
            setView('game');
        };
        const handleGameResumed = (data) => {
            console.log('GAME RESUMED!', data);
            setResumeState(data);
            setShipConfig(data.config);
            setRoomCode(data.room_id);
            setGameCode(data.room_id);
            if (data.nick) setNick(data.nick);
            setView('game');
        };
        const handleError = (data) => alert(data.message);
        const handlePlayerDisconnected = (data) => {
            if (viewRef.current !== 'menu' && !data.silent) {
                alert('SIGNAL LOST: ' + data.message + '\nReturning to Lobby.');
                setView('menu');
                setRoomCode('');
            }
        };

        socket.on('session', handleSession);
        socket.on('room_created', handleRoomCreated);
        socket.on('game_start', handleGameStart);
        socket.on('game_resumed', handleGameResumed);
        socket.on('error', handleError);
        socket.on('player_disconnected', handlePlayerDisconnected);

        return () => {
            socket.off('session', handleSession);
            socket.off('room_created', handleRoomCreated);
            socket.off('game_start', handleGameStart);
            socket.off('game_resumed', handleGameResumed);
            socket.off('error', handleError);
            socket.off('player_disconnected', handlePlayerDisconnected);
        };
    }, [socket]);

    const createRoom = useCallback(() => {
        console.log('Creating room with ship config:', shipConfig);
        socket.emit('create_room', { nick, config: shipConfig });
    }, [socket, nick, shipConfig]);

    const joinRoom = useCallback(() => {
        const code = gameCode.trim().toUpperCase();
        setGameCode(code);
        const token = localStorage.getItem('bs_token_' + code) || undefined;
        socket.emit('join_room', { room_id: code, nick, config: {}, token });
    }, [socket, gameCode, nick]);

    const leaveRoom = useCallback(() => {
        const activeRoom = roomCode || gameCode;
        if (activeRoom) {
            socket.emit('leave_room', { room_id: activeRoom });
            localStorage.removeItem('bs_token_' + activeRoom);
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
        gameCode,
        setGameCode,
        roomCode,
        shipConfig,
        setShipConfig,
        resumeState,
        createRoom,
        joinRoom,
        leaveRoom,
    };
}
