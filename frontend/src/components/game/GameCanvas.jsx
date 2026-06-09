import React from 'react';
import DrawingToolbar from './DrawingToolbar';
import { useCanvas } from '../../hooks/useCanvas';

const CANVAS_W = 800;
const CANVAS_H = 600;

export default function GameCanvas({ isDrawer }) {
  const {
    canvasRef,
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    startPaint, paint, endPaint,
    clearCanvas, fillCanvas, undo, redo,
  } = useCanvas(isDrawer);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Canvas fills available height */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseDown={startPaint}
          onMouseMove={paint}
          onMouseUp={endPaint}
          onMouseLeave={endPaint}
          onTouchStart={startPaint}
          onTouchMove={paint}
          onTouchEnd={endPaint}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            backgroundColor: '#ffffff',
            border: '1.5px solid #E5E7EB',
            borderRadius: 8,
            cursor: isDrawer
              ? (tool === 'eraser' ? 'cell' : 'crosshair')
              : 'default',
            touchAction: 'none',
          }}
        />
      </div>

      {/* Horizontal toolbar — always rendered, disabled for non-drawers */}
      <DrawingToolbar
        isDrawer={isDrawer}
        tool={tool} setTool={setTool}
        color={color} setColor={setColor}
        brushSize={brushSize} setBrushSize={setBrushSize}
        onClear={clearCanvas}
        onFill={fillCanvas}
        onUndo={undo}
        onRedo={redo}
      />

    </div>
  );
}
