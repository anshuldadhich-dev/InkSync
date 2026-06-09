import { useRef, useState, useCallback, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { EVENTS } from '../constants/socketEvents';

export function useCanvas(isDrawer) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isPaintingRef = useRef(false);
  const lastPosRef = useRef(null);
  const lineStartRef = useRef(null);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const isDrawerRef = useRef(isDrawer);

  const [tool, setTool] = useState('pen');   // pen | eraser | line | fill
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  const { socket } = useSocket();

  // Keep isDrawer in sync without causing re-renders
  useEffect(() => { isDrawerRef.current = isDrawer; }, [isDrawer]);

  // Initialise context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
  }, []);

  // ---------- helpers ----------

  function getPos(event) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = event.touches ? event.touches[0] : event;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  }

  function applyOp(op) {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    switch (op.type) {
      case 'stroke':
        ctx.beginPath();
        ctx.strokeStyle = op.color;
        ctx.lineWidth = op.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(op.x0, op.y0);
        ctx.lineTo(op.x1, op.y1);
        ctx.stroke();
        break;
      case 'fill':
        ctx.fillStyle = op.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        break;
      case 'clear':
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        break;
      default:
        break;
    }
  }

  function emitOp(op) {
    if (socket && isDrawerRef.current) socket.emit(EVENTS.DRAW_OP, op);
  }

  function saveSnapshot() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStackRef.current.length > 20) undoStackRef.current.shift();
    redoStackRef.current = [];
  }

  // ---------- receive ops from other players ----------

  useEffect(() => {
    if (!socket) return;

    function onOp(op) { applyOp(op); }

    function onSnapshot({ ops }) {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      (ops || []).forEach(applyOp);
    }

    socket.on(EVENTS.DRAW_OP, onOp);
    socket.on(EVENTS.DRAW_SNAPSHOT, onSnapshot);
    socket.on(EVENTS.DRAW_UNDO, onSnapshot); // server sends full snapshot on undo

    return () => {
      socket.off(EVENTS.DRAW_OP, onOp);
      socket.off(EVENTS.DRAW_SNAPSHOT, onSnapshot);
      socket.off(EVENTS.DRAW_UNDO, onSnapshot);
    };
  }, [socket]);

  // Clear canvas when a new turn begins
  useEffect(() => {
    if (!socket) return;
    function onTurnStart() {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      undoStackRef.current = [];
      redoStackRef.current = [];
    }
    socket.on(EVENTS.TURN_START, onTurnStart);
    return () => socket.off(EVENTS.TURN_START, onTurnStart);
  }, [socket]);

  // ---------- pointer event handlers ----------

  const startPaint = useCallback((event) => {
    if (!isDrawerRef.current) return;
    event.preventDefault();
    const pos = getPos(event);
    if (!pos) return;

    if (tool === 'fill') {
      const op = { type: 'fill', color };
      applyOp(op);
      emitOp(op);
      return;
    }

    saveSnapshot();
    isPaintingRef.current = true;
    lastPosRef.current = pos;
    lineStartRef.current = tool === 'line' ? pos : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, color]);

  const paint = useCallback((event) => {
    if (!isDrawerRef.current || !isPaintingRef.current) return;
    event.preventDefault();
    const pos = getPos(event);
    if (!pos) return;

    if (tool === 'line') {
      // Draw live preview by restoring snapshot + preview line
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx && undoStackRef.current.length > 0) {
        ctx.putImageData(undoStackRef.current[undoStackRef.current.length - 1], 0, 0);
      }
      const start = lineStartRef.current || pos;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      return;
    }

    const strokeColor = tool === 'eraser' ? '#FFFFFF' : color;
    const op = {
      type: 'stroke',
      x0: lastPosRef.current.x, y0: lastPosRef.current.y,
      x1: pos.x, y1: pos.y,
      color: strokeColor,
      width: brushSize,
    };
    applyOp(op);
    emitOp(op);
    lastPosRef.current = pos;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, color, brushSize]);

  const endPaint = useCallback((event) => {
    if (!isDrawerRef.current || !isPaintingRef.current) return;
    if (event) event.preventDefault();

    if (tool === 'line' && lineStartRef.current) {
      const pos = event ? getPos(event) : lineStartRef.current;
      if (pos) {
        const op = {
          type: 'stroke',
          x0: lineStartRef.current.x, y0: lineStartRef.current.y,
          x1: pos.x, y1: pos.y,
          color,
          width: brushSize,
        };
        // Restore clean snapshot before committing line
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx && undoStackRef.current.length > 0) {
          ctx.putImageData(undoStackRef.current[undoStackRef.current.length - 1], 0, 0);
        }
        applyOp(op);
        emitOp(op);
      }
      lineStartRef.current = null;
    }

    isPaintingRef.current = false;
    lastPosRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, color, brushSize]);

  // ---------- actions ----------

  function clearCanvas() {
    if (!isDrawerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const op = { type: 'clear' };
    emitOp(op);
  }

  function fillCanvas() {
    if (!isDrawerRef.current) return;
    const op = { type: 'fill', color };
    applyOp(op);
    emitOp(op);
  }

  function undo() {
    if (!isDrawerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || undoStackRef.current.length === 0) return;
    redoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.putImageData(undoStackRef.current.pop(), 0, 0);
    if (socket) socket.emit(EVENTS.DRAW_UNDO, {});
  }

  function redo() {
    if (!isDrawerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || redoStackRef.current.length === 0) return;
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.putImageData(redoStackRef.current.pop(), 0, 0);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (!isDrawerRef.current) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    canvasRef,
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    startPaint, paint, endPaint,
    clearCanvas, fillCanvas, undo, redo,
  };
}
