const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://192.168.0.104:3000', 'http://192.168.29.43:3000', `${process.env.WEB_PAGE}`],
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

const rooms = {}; // Stores drawing history and chat messages for each room
const lobbies = {};
// {
//   gameId: {
//     players: [],
//     creator: socketId
//   }
// }
const games = {
    /*
    gameId: {
      players: [],
      drawerIndex: 0,
      word: "",
      guessed: [],
      timer: null,
      round: 1
    }
    */
};

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Joining a specific game room
    socket.on("join-lobby", ({ username, avatar, gameId }) => {
        if (!gameId) return;

        socket.join(gameId); // Ensures players are in the correct game room

        if (!lobbies[gameId]) {
            lobbies[gameId] = {
                players: [],
                creator: socket.id // ✅ first person = creator
            };;
        }

        const lobby = lobbies[gameId];

        const player = { socketId: socket.id, username, avatar, gameId };

        if (!lobby.players.some((p) => p.socketId === socket.id)) {
            lobby.players.push(player);
        }

        console.log(`🎮 Player joined: ${username} (${socket.id}) in ${gameId}`);
        console.log(`👑 Creator: ${lobby.creator}`);

        // ✅ Send BOTH players and creator
        io.to(gameId).emit("update-players", {
            players: lobby.players,
            creator: lobby.creator
        });
    });

    socket.on("leave-lobby", ({ socketId, gameId }) => {
        if (!gameId || !lobbies[gameId]) return;

        const lobby = lobbies[gameId];

        lobby.players = lobby.players.filter(
            (player) => player.socketId !== socketId
        );

        // ✅ If creator leaves → assign new creator
        if (lobby.creator === socketId && lobby.players.length > 0) {
            lobby.creator = lobby.players[0].socketId;
            console.log(`👑 New creator: ${lobby.creator}`);
        }

        if (lobby.players.length === 0) {
            delete lobbies[gameId];
        } else {
            io.to(gameId).emit("update-players", {
                players: lobby.players,
                creator: lobby.creator
            });
        }
    });

    // Joining a drawing room
    socket.on("join-room", (roomId) => {
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = { drawings: [], messages: [] };
        }

        socket.emit("load-canvas", rooms[roomId].drawings);

        // 🔥 ADD THIS BLOCK
        if (games[roomId]) {
            const game = games[roomId];

            const drawer = game.players[game.drawerIndex].socketId;

            socket.emit('game-started', {
                drawer,
                wordLength: game.word.length
            });

            if (socket.id === drawer) {
                socket.emit('your-word', game.word);
            }
        }
    });

    function endRound(gameId) {
        const game = games[gameId];
        if (!game) return;

        clearInterval(game.timer); // ✅ ALWAYS clear timer

        // ✅ If no one guessed
        if (game.guessed.length === 0) {
            io.to(gameId).emit("receive-message", {
                sender: "SYSTEM",
                text: `❌ No one guessed the word! It was "${game.word}"`
            });
        }

        // ✅ reveal word to UI
        io.to(gameId).emit('round-ended', {
            word: game.word
        });

        // ✅ reset canvas
        io.to(gameId).emit("reset-canvas");
        io.to(gameId).emit("receive-message", {
            sender: "SYSTEM",
            text: `🧠 The word was: ${game.word}`
        });

        // 🔥 GAME END CHECK
        if (game.round >= game.maxRounds) {
            io.to(gameId).emit("game-ended", {
                players: game.players
            });

            delete games[gameId];
            return;
        }

        // ✅ reset round state
        game.guessed = [];
        game.timeLeft = 60;

        // next drawer
        game.drawerIndex = (game.drawerIndex + 1) % game.players.length;
        game.round++;

        setTimeout(() => {
            startRound(gameId);
        }, 3000);
    }

    function startTimer(gameId) {
        const game = games[gameId];
        let timeLeft = 60;

        game.timeLeft = timeLeft; // ✅ initial value

        io.to(gameId).emit('timer', timeLeft);

        game.timer = setInterval(() => {
            timeLeft--;

            game.timeLeft = timeLeft; // ✅ update every second

            io.to(gameId).emit('timer', timeLeft);

            if (timeLeft <= 0) {
                clearInterval(game.timer);
                endRound(gameId);
            }
        }, 1000);
    }

    function startRound(gameId) {
        const game = games[gameId];
        if (!game) return;

        const WORDS = [
            "cat", "dog", "car", "house", "tree",
            "sun", "moon", "star", "fish", "apple",
            "book", "chair", "table", "phone", "cup",
            "hat", "shoe", "ball", "clock", "cake"
        ];

        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        const drawer = game.players[game.drawerIndex].socketId;

        game.word = word;
        game.guessed = [];

        console.log(`🎯 Round ${game.round} | Word: ${word}`);

        // send round info
        io.to(gameId).emit('game-started', {
            drawer,
            wordLength: word.length,
            round: game.round
        });

        // ✅ send word ONLY ONCE
        io.to(drawer).emit("your-word", word);

        // system message
        io.to(gameId).emit("receive-message", {
            sender: "SYSTEM",
            text: "🎨 New round started!"
        });

        startTimer(gameId);
    }

    socket.on('start-game', ({ gameId }) => {
        const lobby = lobbies[gameId];
        if (!lobby) return;

        // ✅ Only creator can start
        if (socket.id !== lobby.creator) return;

        // ✅ Initialize game
        games[gameId] = {
            players: lobby.players.map(p => ({
                ...p,
                score: 0 // ✅ add score
            })),
            drawerIndex: 0,
            word: "",
            guessed: [],
            round: 1,
            maxRounds: 4, // ✅ round limit
            timer: null
        };

        console.log("🚀 Game starting for:", gameId);

        // 🔥 STEP 3 → NAVIGATION TRIGGER
        io.to(gameId).emit('start-game');

        // 🔥 IMPORTANT DELAY (so clients can join GameArena + room)
        setTimeout(() => {
            startRound(gameId);
        }, 300);
    });

    // Drawing event
    socket.on("draw", ({ roomId, x, y, prevX, prevY, color, width }) => {
        if (!rooms[roomId]) return;

        rooms[roomId].drawings.push({ x, y, prevX, prevY, color, width });
        socket.to(roomId).emit("draw", { x, y, prevX, prevY, color, width });
    });

    // Clearing the canvas
    socket.on("clear-canvas", (roomId) => {
        if (rooms[roomId]) rooms[roomId].drawings = [];
        io.to(roomId).emit("reset-canvas");
    });

    socket.on("send-message", ({ roomId, message, sender }) => {
        const game = games[roomId];
        if (!game) return;

        const isCorrect = message.toLowerCase() === game.word.toLowerCase();

        if (isCorrect) {
            if (!game.guessed.includes(socket.id)) {
                game.guessed.push(socket.id);

                // ✅ give points to guesser
                const player = game.players.find(p => p.socketId === socket.id);
                if (player) {
                    const timeLeft = game.timeLeft || 0;
                    player.score += 50 + timeLeft * 2;
                }

                // ✅ give points to drawer
                const drawer = game.players[game.drawerIndex];
                if (drawer) drawer.score += 50;

                io.to(roomId).emit("receive-message", {
                    sender: "SYSTEM",
                    text: `🎉 ${sender} guessed the word!`
                });

                // ✅ update scores
                io.to(roomId).emit("update-players", {
                    players: game.players,
                    creator: lobbies[roomId]?.creator,
                });

                // 🔥 CHECK IF ALL (except drawer) GUESSED
                const totalGuessers = game.players.length - 1;

                if (game.guessed.length >= totalGuessers) {
                    clearInterval(game.timer);
                    endRound(roomId);
                }
            }
        } else {
            io.to(roomId).emit("receive-message", {
                sender,
                text: message
            });
        }
    });

    socket.on("restart-game", ({ gameId }) => {
        const lobby = lobbies[gameId];
        if (!lobby) return;

        // ✅ Only creator can restart
        if (socket.id !== lobby.creator) return;

        console.log("🔁 Restarting game:", gameId);

        // ✅ Reset game state
        games[gameId] = {
            players: lobby.players.map(p => ({
                ...p,
                score: 0 // reset scores
            })),
            drawerIndex: 0,
            word: "",
            guessed: [],
            round: 1,
            maxRounds: 5,
            timer: null,
            timeLeft: 60
        };

        // ✅ Clear canvas for everyone
        io.to(gameId).emit("reset-canvas");

        io.to(gameId).emit("game-restarting"); // 🔥 notify all clients

        setTimeout(() => {
            startRound(gameId);
        }, 500);
    });

    // Disconnect handling
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);

        for (const gameId in lobbies) {
            const lobby = lobbies[gameId];

            lobby.players = lobby.players.filter(
                player => player.socketId !== socket.id
            );

            // ✅ Handle creator leaving
            if (lobby.creator === socket.id && lobby.players.length > 0) {
                lobby.creator = lobby.players[0].socketId;
                console.log(`👑 New creator after disconnect: ${lobby.creator}`);
            }

            if (lobby.players.length === 0) {
                delete lobbies[gameId];
            } else {
                io.to(gameId).emit("update-players", {
                    players: lobby.players,
                    creator: lobby.creator
                });
            }
        }
    });
});

server.listen(process.env.PORT || 5000, () => {
    console.log("Server is running");
});

app.get("/", (req, res) => {
    res.send("Server is running");
});
