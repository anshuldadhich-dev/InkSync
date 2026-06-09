import React from 'react';

const BASIC_COLORS = [
  '#000000','#FFFFFF','#EF4444','#F97316','#EAB308','#22C55E',
  '#3B82F6','#8B5CF6','#EC4899','#6B7280','#92400E','#164E63',
  '#D97706','#15803D','#1D4ED8','#7C3AED',
];

const TOOL_BTN =
  'flex items-center justify-center w-9 h-9 rounded-lg border-2 text-sm font-bold transition-all cursor-pointer select-none';

function ToolBtn({ active, onClick, title, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`${TOOL_BTN} ${
        active
          ? 'border-blue-500 bg-blue-100 text-blue-700'
          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

const PenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const EraserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16l10-10 7 7-2.5 2.5"/>
    <path d="M6.5 17.5l4-4"/>
  </svg>
);

const LineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="4" y1="20" x2="20" y2="4"/>
  </svg>
);

const FillIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 2.5l5 5-10 10-7-1-1-7 10-10z"/>
    <path d="M22 17.5c0 1.5-1.5 3-3 3s-3-1.5-3-3 3-5 3-5 3 3.5 3 5z" fill="currentColor"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 14 4 9 9 4"/>
    <path d="M20 20v-7a4 4 0 00-4-4H4"/>
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 14 20 9 15 4"/>
    <path d="M4 20v-7a4 4 0 014-4h12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

export default function DrawingToolbar({
  tool, setTool,
  color, setColor,
  brushSize, setBrushSize,
  onClear, onFill, onUndo, onRedo,
}) {
  return (
    <div
      className="flex flex-col gap-2 p-2 bg-white border border-gray-200 rounded-xl shadow-md"
      style={{ minWidth: 52 }}
    >
      <ToolBtn active={tool === 'pen'}    onClick={() => setTool('pen')}    title="Pen"><PenIcon /></ToolBtn>
      <ToolBtn active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Eraser"><EraserIcon /></ToolBtn>
      <ToolBtn active={tool === 'line'}   onClick={() => setTool('line')}   title="Straight line"><LineIcon /></ToolBtn>
      <ToolBtn active={false}             onClick={onFill}                  title="Fill"><FillIcon /></ToolBtn>

      <div className="w-full border-t border-gray-200" />

      <ToolBtn active={false} onClick={onUndo}  title="Undo (Ctrl+Z)"><UndoIcon /></ToolBtn>
      <ToolBtn active={false} onClick={onRedo}  title="Redo (Ctrl+Y)"><RedoIcon /></ToolBtn>
      <ToolBtn active={false} onClick={onClear} title="Clear canvas"><TrashIcon /></ToolBtn>

      <div className="w-full border-t border-gray-200" />

      {/* Color swatches */}
      <div className="grid grid-cols-4 gap-1">
        {BASIC_COLORS.map(c => (
          <button
            key={c}
            title={c}
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className={`w-6 h-6 rounded border-2 cursor-pointer transition-transform hover:scale-110 ${
              color === c ? 'border-blue-500 scale-110' : 'border-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Custom color */}
      <div className="flex justify-center mt-1">
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          title="Custom color"
          className="w-8 h-8 rounded cursor-pointer border border-gray-300"
        />
      </div>

      <div className="w-full border-t border-gray-200" />

      {/* Brush size */}
      <div className="flex flex-col items-center gap-1">
        <div
          style={{
            width:  Math.min(28, brushSize * 2 + 4),
            height: Math.min(28, brushSize * 2 + 4),
            borderRadius: '50%',
            backgroundColor: color === '#FFFFFF' ? '#9CA3AF' : color,
          }}
        />
        <input
          type="range" min={1} max={50} value={brushSize}
          onChange={e => setBrushSize(Number(e.target.value))}
          className="w-10 cursor-pointer"
          style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 80 }}
          title={`Brush: ${brushSize}`}
        />
        <span className="text-xs text-gray-400">{brushSize}</span>
      </div>
    </div>
  );
}
