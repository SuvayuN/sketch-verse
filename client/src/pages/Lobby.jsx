import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import GameCard from '../components/GameCard';

const Lobby = () => {
    const navigate = useNavigate();

    // Parse the query parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username') || 'Anonymous'; // Default to 'Anonymous' if no username is provided
    const avatar = decodeURIComponent(urlParams.get('avatar')) || '../assets/iconsAvatar/luffy.jpg'; // Default avatar if not provided
    const initialGameId = urlParams.get('roomId') && urlParams.get('roomId').trim() ? urlParams.get('roomId') : null; // Get the roomId if available and not empty

    // State variables for gameId, players list, creator status, and socket ID
    const [gameId, setGameId] = useState(initialGameId);
    const [players, setPlayers] = useState([]);
    const [isCreator, setIsCreator] = useState(false);
    const [socketId, setSocketId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [copied, setCopied] = useState(false);

    // Effect to generate a new gameId if it's not provided in the URL
    useEffect(() => {
        if (!gameId) {
            // Generate a random 6-digit game ID if one doesn't exist
            const newGameId = Math.floor(100000 + Math.random() * 900000).toString();
            setGameId(newGameId); // Set the newly generated gameId
            setIsCreator(true); // Mark as the creator of the game

            // Update URL to preserve gameId on refresh
            window.history.replaceState({}, '', `?roomId=${newGameId}&username=${username}&avatar=${encodeURIComponent(avatar)}`);
        }
    }, [gameId, username, avatar]); // This effect runs only when gameId is initially undefined

    useEffect(() => {
        if (socket.connected) {
            setIsConnected(true);
        }

        socket.on("connect", () => {
            setIsConnected(true);
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
        };
    }, []);

    useEffect(() => {
        if (!isConnected) return;

        socket.emit('join-lobby', {
            username,
            avatar,
            gameId
        });

    }, [isConnected, gameId, username, avatar]);

    // Effect to handle joining the lobby for both creator and players
    useEffect(() => {
        if (gameId && socketId) {
            console.log(`🚀 Joining lobby: gameId=${gameId}, username=${username}`);

            // Remove any existing listeners first to avoid duplicates
            socket.off('update-players');

            // Set up listener BEFORE emitting to ensure we catch the response
            const handleUpdatePlayers = ({ players, creator }) => {
                setPlayers(players || []);
                setIsCreator(socket.id === creator); // ✅ THIS fixes your issue
            };

            socket.on('update-players', handleUpdatePlayers);

            // Cleanup function to leave the lobby and remove listeners
            return () => {
                socket.emit('leave-lobby', { socketId, gameId });
                socket.off('update-players', handleUpdatePlayers); // Remove the 'update-players' event listener
            };
        }
    }, [socketId, gameId, username, avatar]); // Dependencies: socketId, gameId, username, avatar

    // Effect to handle socket connection and set the socket ID
    useEffect(() => {
        const handleConnect = () => {
            console.log('✅ Socket connected:', socket.id);
            setSocketId(socket.id); // Set the socket ID when the connection is established
        };

        // Check if already connected
        if (socket.connected) {
            setSocketId(socket.id);
        }

        socket.on('connect', handleConnect);

        // Cleanup function to remove the 'connect' event listener when the component is unmounted
        return () => {
            socket.off('connect', handleConnect);
        };
    }, []); // Empty dependency array to run this effect once on mount

    useEffect(() => {
        const handleStartGame = () => {
            navigate(`/gamearena?roomId=${gameId}&username=${username}&avatar=${encodeURIComponent(avatar)}`);
        };

        socket.on('start-game', handleStartGame);

        return () => {
            socket.off('start-game', handleStartGame);
        };
    }, [gameId, username, avatar, navigate]);

    // Function to navigate to the game arena page with necessary parameters
    const createRoom = useCallback(() => {
        socket.emit('start-game', { gameId });
    }, [gameId]); // Callback dependency to ensure the values are up to date

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-lime-500"></div>
                    <p className="text-lg">Connecting to server...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center bg-gray-900 text-white p-4">
            <h1 className="text-3xl font-bold mb-4">GameID: {gameId}</h1>
            <div className="w-80 p-4 bg-gray-800 rounded-2xl shadow-lg">
                {/* Map through players and render their game cards */}
                {players.map((player, index) => (
                    <GameCard key={index} className="mb-2" image={player.avatar} photoWidth={80} photoHeight={80} userName={player.username} />
                ))}
            </div>
            <button
                onClick={() => {
                    navigator.clipboard.writeText(gameId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }}
                className="text-wrap my-5 mb-5 px-8 py-2 font-kota text-xl rounded-3xl bg-lime-500 text-black hover:bg-green-700 hover:text-white active:scale-90"
            >
                {copied ? "Copied!" : "Share Code"}
            </button>

            {/* Show "Start Game" button only if the current user is the creator */}
            {isCreator && (
                <div className="flex justify-center">
                    <button
                        onClick={createRoom} // Trigger the navigation to game arena when clicked
                        className="text-wrap mb-5 px-8 py-2 font-kota text-xl rounded-3xl bg-lime-500 text-black hover:bg-green-700 hover:text-white active:scale-90">
                        Start Game
                    </button>
                </div>
            )}
        </div>
    );
};

export default Lobby;
