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
    <div className="relative flex items-start gap-2 w-full h-full">
      {/* Floating vertical toolbar — only visible for the drawer */}
      {isDrawer && (
        <div className="flex-shrink-0 h-full overflow-y-auto">
          <DrawingToolbar
            tool={tool} setTool={setTool}
            color={color} setColor={setColor}
            brushSize={brushSize} setBrushSize={setBrushSize}
            onClear={clearCanvas}
            onFill={fillCanvas}
            onUndo={undo}
            onRedo={redo}
          />
        </div>
      )}

      {/* Canvas — fills height; aspect-ratio is maintained by the browser */}
      <div className="relative flex-1" style={{ minWidth: 0, minHeight: 0 }}>
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
            maxHeight: '100%',
            display: 'block',
            backgroundColor: 'white',
            border: '2px solid #d1d5db',
            borderRadius: 8,
            cursor: isDrawer
              ? tool === 'eraser' ? 'cell'
                : tool === 'fill' ? 'crosshair'
                : 'crosshair'
              : 'default',
            touchAction: 'none',
          }}
        />
      </div>
    </div>
  );
}
