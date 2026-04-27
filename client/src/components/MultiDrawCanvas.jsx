import React, { useEffect, useRef, useState, useCallback } from 'react';
import CanvasTool from './CanvasTool';
import socket from '../socket';
import { useParams } from 'react-router-dom';

const Canvas = ({ className, width = 800, height = 500 }) => {
    const { roomId } = useParams();
    const [darkMode, setDarkMode] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [penColor, setPenColor] = useState(darkMode ? '#FFFFFF' : '#23272f');
    const [penWidth, setPenWidth] = useState(10);
    const [history, setHistory] = useState([]);
    const [step, setStep] = useState(-1);
    const [tool, setTool] = useState('pen');

    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const lastX = useRef(null);
    const lastY = useRef(null);

    const drawLine = (ctx, x1, y1, x2, y2) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };

    const restoreCanvas = useCallback(
        dataURL => {
            const img = new Image();
            img.src = dataURL;
            img.onload = () => {
                ctxRef.current.clearRect(0, 0, width, height);
                ctxRef.current.drawImage(img, 0, 0);
            };
        },
        [width, height],
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = darkMode ? '#23272f' : 'white';
        setPenColor(darkMode ? '#FFFFFF' : '#23272f');
        ctx.fillRect(0, 0, width, height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctxRef.current = ctx;

        socket.emit('join-room', roomId);

        socket.on('draw', ({ x, y, prevX, prevY, color, width }) => {
            ctxRef.current.strokeStyle = color;
            ctxRef.current.lineWidth = width;
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(prevX, prevY);
            ctxRef.current.lineTo(x, y);
            ctxRef.current.stroke();
        });

        try {
            const savedHistory = JSON.parse(localStorage.getItem(`${roomId}History`)) || [];
            const savedStep = JSON.parse(localStorage.getItem(`${roomId}Step`)) || -1;
            setHistory(savedHistory);
            setStep(savedStep);
            if (savedHistory.length > 0 && savedStep >= 0) {
                restoreCanvas(savedHistory[savedStep]);
            }
        } catch (error) {
            console.error('Failed to load from localStorage', error);
        }

        socket.on('reset-canvas', () => {
            ctxRef.current.fillStyle = darkMode ? '#23272f' : 'white';
            ctxRef.current.fillRect(0, 0, width, height);
            setHistory([]);
            setStep(-1);
            localStorage.removeItem(`${roomId}History`);
            localStorage.removeItem(`${roomId}Step`);
        });

        return () => {
            socket.off('draw');
        };
    }, [darkMode, width, height, roomId, restoreCanvas]);

    const getTouchPos = (canvas, touchEvent) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: touchEvent.touches[0].clientX - rect.left,
            y: touchEvent.touches[0].clientY - rect.top,
        };
    };

    const startDrawing = e => {
        const { offsetX, offsetY } = e.nativeEvent;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
        lastX.current = offsetX;
        lastY.current = offsetY;
    };

    const startDrawingTouch = e => {
        e.preventDefault();
        const { x, y } = getTouchPos(canvasRef.current, e);
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x, y);
        setIsDrawing(true);
        lastX.current = x;
        lastY.current = y;
    };

    const draw = e => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const ctx = ctxRef.current;

        ctx.strokeStyle = tool === 'eraser' ? (darkMode ? '#23272f' : '#FFF') : penColor;
        ctx.lineWidth = penWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        drawLine(ctx, lastX.current, lastY.current, offsetX, offsetY);

        socket.emit('draw', {
            roomId,
            x: offsetX,
            y: offsetY,
            prevX: lastX.current,
            prevY: lastY.current,
            color: ctx.strokeStyle,
            width: ctx.lineWidth,
        });

        lastX.current = offsetX;
        lastY.current = offsetY;
    };

    const drawTouch = e => {
        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = getTouchPos(canvasRef.current, e);
        const ctx = ctxRef.current;

        ctx.strokeStyle = tool === 'eraser' ? (darkMode ? '#23272f' : '#FFF') : penColor;
        ctx.lineWidth = penWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        drawLine(ctx, lastX.current, lastY.current, x, y);

        socket.emit('draw', {
            roomId,
            x,
            y,
            prevX: lastX.current,
            prevY: lastY.current,
            color: ctx.strokeStyle,
            width: ctx.lineWidth,
        });

        lastX.current = x;
        lastY.current = y;
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        ctxRef.current.closePath();
        setIsDrawing(false);
        saveHistory();
        lastX.current = null;
        lastY.current = null;
    };

    const saveHistory = () => {
        try {
            const newHistory = [...history.slice(0, step + 1), canvasRef.current.toDataURL()];
            setHistory(newHistory);
            setStep(newHistory.length - 1);
            localStorage.setItem(`${roomId}History`, JSON.stringify(newHistory));
            localStorage.setItem(`${roomId}Step`, JSON.stringify(newHistory.length - 1));
        } catch (error) {
            console.error('Failed to save to localStorage', error);
        }
    };

    const undo = () => {
        if (step <= 0) return;
        setStep(step - 1);
        restoreCanvas(history[step - 1]);
    };

    const redo = () => {
        if (step >= history.length - 1) return;
        setStep(step + 1);
        restoreCanvas(history[step + 1]);
    };

    const resetCanvas = () => {
        // Clear the canvas
        ctxRef.current.fillStyle = darkMode ? '#23272f' : 'white';
        ctxRef.current.fillRect(0, 0, width, height);

        // Remove drawing history
        setHistory([]);
        setStep(-1);

        // Emit reset-canvas event to all connected clients
        socket.emit('reset-canvas', {
            roomId,
        });

        // Remove local storage history
        localStorage.removeItem(`${roomId}History`);
        localStorage.removeItem(`${roomId}Step`);
    };

    return (
        <div className={` ${className} flex justify-center items-center`}>
            <CanvasTool
                className="absolute top-0 z-5"
                tool={tool}
                setTool={setTool}
                penColor={penColor}
                setPenColor={setPenColor}
                penWidth={penWidth}
                setPenWidth={setPenWidth}
                undo={undo}
                redo={redo}
                resetCanvas={resetCanvas}
                darkModeToggle={() => setDarkMode(!darkMode)}
            />
            <canvas
                className={`${className} border shadow-lg`}
                ref={canvasRef}
                width={width}
                height={height}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawingTouch}
                onTouchMove={drawTouch}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}></canvas>
        </div>
    );
};

export default Canvas;
