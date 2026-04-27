import React, { useState, useEffect } from 'react';
import socket from '../socket';
import GameCard from '../components/GameCard';

// LobbySidebar component displays the list of players in the lobby with their avatars and points.
const LobbySidebar = ({ roomId, username, avatar, currentDrawer }) => {
    // State to store players' information.
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        if (!roomId) return;

        // ✅ JOIN LOBBY (IMPORTANT)
        socket.emit('join-lobby', {
            username,
            avatar,
            gameId: roomId
        });

        socket.off('update-players');

        const handleUpdatePlayers = ({ players, creator, guessed }) => {
            setPlayers(players || []);
        };

        socket.on('update-players', handleUpdatePlayers);

        return () => {
            socket.off('update-players', handleUpdatePlayers);
        };
    }, [roomId, username, avatar]);
    return (
        // Sidebar container with styling and scrollable player list.
        <div className="w-[20%] p-4 bg-gray-800 text-white rounded-r-xl shadow-lg h-full fixed left-0 top-0 flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-4 text-center">Lobby</h2>
            <p className="text-center text-sm text-gray-400">Room ID: {roomId}</p>
            <div className="flex flex-col gap-3 mt-4 overflow-y-auto">
                {Array.isArray(players) &&
                    players.map((player, index) => {
                        const isDrawer = player.socketId === currentDrawer;
                        return (
                            <div
                                key={index}
                                className={`m-2 p-2 rounded transition-all duration-300
                ${isDrawer ? "border-2 border-yellow-400 bg-yellow-500/20" : ""}
            `}
                            >
                                <GameCard
                                    image={player.avatar}
                                    photoWidth={100}
                                    userName={player.username}
                                    usersPoints={player.score || 0}
                                />

                                {isDrawer && (
                                    <div className="text-yellow-400 text-center text-xs mt-1">
                                        🎨 Drawing
                                    </div>
                                )}
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
};

export default LobbySidebar;
