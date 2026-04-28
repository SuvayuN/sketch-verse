import React, { useEffect, useState } from 'react';
import socket from '../socket';
import MultiDrawCanvas from '../components/MultiDrawCanvas';

const Multidraw = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSlow, setIsSlow] = useState(false);

    useEffect(() => {
        document.title = 'Sketch Verse | Draw Together';

        // ✅ initial check
        if (socket.connected) {
            setIsConnected(true);
        }

        // ✅ listeners
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

    // 🔥 detect slow Render wake-up
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!socket.connected) {
                setIsSlow(true);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    // 🎯 LOADER
    if (!isConnected) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-lime-500"></div>
                    <p className="text-lg">Connecting to server...</p>

                    {isSlow && (
                        <p className="text-sm text-gray-400">
                            Server is waking up (Render free tier)...
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // 🎨 CANVAS (only after connection)
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    return (
        <MultiDrawCanvas
            className="h-screen w-screen border-0 margin-0"
            width={canvasWidth}
            height={canvasHeight}
        />
    );
};

export default Multidraw;