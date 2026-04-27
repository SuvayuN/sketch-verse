import { useState, useEffect, useRef } from 'react';
import socket from '../socket';

const Chat = ({ roomId, username, isDrawer }) => {
    const inputRef = useRef(null);
    const [messages, setMessages] = useState([]); // Store messages
    const [input, setInput] = useState('');

    useEffect(() => {
        if (!isDrawer && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isDrawer]);

    useEffect(() => {
        if (!isDrawer && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isDrawer]);

    useEffect(() => {
        if (!roomId) {
            console.error('Room ID is missing!');
            return;
        }

        console.log('Joining room:', roomId);
        socket.emit('join-room', roomId); // Join chat room

        // Load previous messages
        socket.on('load-messages', loadedMessages => {
            console.log('Loaded messages:', loadedMessages);
            setMessages(loadedMessages || []);
        });

        // Listen for new messages
        socket.on('receive-message', message => {
            console.log('Received message:', message);
            setMessages(prevMessages => [...prevMessages, message]); // Update messages in real-time
        });

        return () => {
            socket.off('load-messages');
            socket.off('receive-message');
        };
    }, [roomId]); // Ensure effect runs when `roomId` changes

    useEffect(() => {
        const chat = document.getElementById("chat-container");
        if (chat) chat.scrollTop = chat.scrollHeight;
    }, [messages]);

    const sendMessage = () => {
        if (!input.trim() || isDrawer) return;

        socket.emit('send-message', {
            roomId,
            message: input.trim(),
            sender: username
        });
        // }

        setInput('');
    };

    return (
        <div className="fixed bottom-0 right-0 w-[20%] h-full bg-gray-900 text-white flex flex-col rounded-t-lg shadow-lg">
            {/* Chat messages */}
            <div className="flex-1 overflow-auto p-2 space-y-2">
                {isDrawer && (
                    <div className="text-center text-yellow-400 text-sm">
                        You are drawing. Chat disabled.
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`p-2 rounded-lg ${msg.sender === 'SYSTEM'
                            ? 'bg-green-600 text-center font-bold'
                            : 'bg-gray-700'
                            }`}
                    >
                        <strong>{msg.sender}:</strong> {msg.text}
                    </div>
                ))}
            </div>

            {/* Input box & send button */}
            <div className="flex p-2 bg-gray-800">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={isDrawer ? "You are drawing..." : "Type a message..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={isDrawer}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault(); // prevents newline / form submit
                            sendMessage();
                        }
                    }}
                    className="p-2 text-black rounded-lg flex-1 disabled:opacity-50"
                />
                <button
                    onClick={sendMessage}
                    disabled={isDrawer}
                    className="bg-blue-500 p-2 rounded-lg ml-2 disabled:bg-gray-500"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
