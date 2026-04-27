import React from 'react';
import socket from '../socket';
import { useEffect, useState } from 'react';
import Canvas from '../components/Canvas';
import Chat from '../components/Chat';
import LobbySidebar from '../components/LobbySidebar';

const GameArina = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');
    const username = urlParams.get('username') || 'Anonymous';
    const avatar = decodeURIComponent(urlParams.get('avatar') || '../assets/iconsAvatar/luffy.jpg');
    document.title = 'Sketch Verse | Game Arena';

    const [word, setWord] = useState('');
    const [isDrawer, setIsDrawer] = useState(false);
    const [socketId, setSocketId] = useState(null);
    const [time, setTime] = useState(60);
    const [round, setRound] = useState(1);
    const [players, setPlayers] = useState([]);
    const [winner, setWinner] = useState(null);
    const [creator, setCreator] = useState(null);
    const [currentDrawer, setCurrentDrawer] = useState(null);

    useEffect(() => {
        if (socket.connected) {
            setSocketId(socket.id);
        }

        socket.on("connect", () => {
            setSocketId(socket.id);
        });

        return () => socket.off("connect");
    }, []);

    useEffect(() => {
        socket.on("update-word", ({ maskedWord }) => {
            if (!isDrawer) {
                setWord(maskedWord);
            }
        });

        return () => socket.off("update-word");
    }, [isDrawer]);

    useEffect(() => {
        socket.on("update-players", ({ creator }) => {
            setCreator(creator);
        });

        return () => socket.off("update-players");
    }, []);

    useEffect(() => {
        if (!roomId) return;

        socket.emit('join-room', roomId);
    }, [roomId]);

    useEffect(() => {
        const handlePlayersUpdate = ({ players }) => {
            setPlayers(players || []);
        };

        socket.on("update-players", handlePlayersUpdate);

        return () => socket.off("update-players", handlePlayersUpdate);
    }, []);

    useEffect(() => {
        if (!socketId) return;

        const handleGameStart = ({ drawer, wordLength, round }) => {
            console.log("MY SOCKET:", socketId);
            console.log("DRAWER:", drawer);

            setCurrentDrawer(drawer);
            setIsDrawer(socketId === drawer);
            setWord("_ ".repeat(wordLength));
            setRound(round);
        };

        const handleYourWord = (actualWord) => {
            setWord(actualWord);
        };

        socket.on('game-started', handleGameStart);
        socket.on('your-word', handleYourWord);

        return () => {
            socket.off('game-started', handleGameStart);
            socket.off('your-word', handleYourWord);
        };
    }, [socketId]);

    useEffect(() => {
        socket.on("game-ended", ({ players }) => {
            const sorted = [...players].sort((a, b) => b.score - a.score);
            setPlayers(players);
            setWinner(sorted[0]);
        });

        return () => socket.off("game-ended");
    }, []);

    useEffect(() => {
        socket.on("timer", setTime);
        return () => socket.off("timer");
    }, []);

    useEffect(() => {
        socket.on("game-restarting", () => {
            setWinner(null);
        });

        return () => socket.off("game-restarting");
    }, []);

    return (
        <div className="flex w-full h-screen bg-gray-900">
            <LobbySidebar
                roomId={roomId}
                username={username}
                avatar={avatar}
                currentDrawer={currentDrawer}
                className="w-[20%] fixed left-0 top-0 h-full"
            />
            <div className="ml-[20%] w-[60%] flex flex-col items-center justify-start h-screen p-4 gap-3">
                <div className="flex flex-col items-center gap-1">
                    <div className="text-lg text-blue-400">
                        Round {round}
                    </div>

                    {isDrawer ? (
                        <div className="text-xl font-bold text-green-400">
                            Word: {word}
                        </div>
                    ) : (
                        <div className="text-xl text-gray-400">
                            Guess the word...
                        </div>
                    )}

                    <div className="text-xl text-yellow-400">
                        ⏱ {time}s
                    </div>
                </div>
                <div className="w-full max-w-5xl flex justify-center">
                    <div className="w-full aspect-[16/9] bg-white rounded-lg overflow-hidden shadow-2xl">
                        <Canvas
                            className="w-full h-full"
                            roomId={roomId}
                            username={username}
                            avatar={avatar}
                            isDrawer={isDrawer}
                        />
                    </div>
                </div>
            </div>
            <Chat roomId={roomId} username={username} avatar={avatar} isDrawer={isDrawer} />
            {winner && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                    <div className="bg-gray-900 p-6 rounded-xl text-center shadow-2xl w-96">

                        <h2 className="text-2xl text-yellow-400 font-bold mb-4">🏆 Leaderboard</h2>

                        {/* Leaderboard */}
                        {[...(players || [])]
                            .sort((a, b) => b.score - a.score)
                            .map((p, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between text-white px-4 py-1"
                                >
                                    <span>
                                        {i === 0 && "🥇"}
                                        {i === 1 && "🥈"}
                                        {i === 2 && "🥉"} {p.username}
                                    </span>
                                    <span>{p.score}</span>
                                </div>
                            ))}

                        <div className="flex gap-3 mt-4 justify-center">
                            {/* Play Again (host only) */}
                            {socket.id === creator ? (
                                <button
                                    onClick={() => {
                                        socket.emit("restart-game", { gameId: roomId });
                                    }}
                                    className="bg-blue-500 px-4 py-2 rounded"
                                >
                                    Play Again
                                </button>
                            ) : (
                                <div className="text-gray-400 text-sm">
                                    Waiting for host...
                                </div>
                            )}

                            {/* Exit */}
                            <button
                                onClick={() => window.location.href = "/"}
                                className="bg-red-500 px-4 py-2 rounded"
                            >
                                Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameArina;
