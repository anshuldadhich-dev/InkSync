import React from 'react';

const TOOLBAR_COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6',
  '#EC4899', '#6B7280', '#92400E', '#164E63',
];

// ── SVG icons ─────────────────────────────────────────────────────────────────

const PenIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const EraserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16l10-10 7 7-2.5 2.5"/>
    <path d="M6.5 17.5l4-4"/>
  </svg>
);

const LineIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="4" y1="20" x2="20" y2="4"/>
  </svg>
);

const FillIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 2.5l5 5-10 10-7-1-1-7 10-10z"/>
    <path d="M22 17.5c0 1.5-1.5 3-3 3s-3-1.5-3-3 3-5 3-5 3 3.5 3 5z" fill="currentColor"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 14 4 9 9 4"/>
    <path d="M20 20v-7a4 4 0 00-4-4H4"/>
  </svg>
);

const RedoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 14 20 9 15 4"/>
    <path d="M4 20v-7a4 4 0 014-4h12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function DrawingToolbar({
  isDrawer,
  tool, setTool,
  color, setColor,
  brushSize, setBrushSize,
  onClear, onFill, onUndo, onRedo,
}) {
  const previewSize = Math.max(6, Math.min(24, brushSize * 0.6 + 4));
  const previewColor = color === '#FFFFFF' ? '#9CA3AF' : color;

  return (
    <div className={`game-toolbar${!isDrawer ? ' disabled' : ''}`}>

      {/* Drawing tools */}
      <button className={`tb-tool${tool === 'pen'    ? ' active' : ''}`} onClick={() => setTool('pen')}    title="Pen"><PenIcon /></button>
      <button className={`tb-tool${tool === 'eraser' ? ' active' : ''}`} onClick={() => setTool('eraser')} title="Eraser"><EraserIcon /></button>
      <button className={`tb-tool${tool === 'line'   ? ' active' : ''}`} onClick={() => setTool('line')}   title="Line"><LineIcon /></button>
      <button className="tb-tool" onClick={onFill} title="Fill area"><FillIcon /></button>

      <div className="tb-sep" />

      {/* Color palette */}
      <div className="tb-colors">
        {TOOLBAR_COLORS.map(c => (
          <button
            key={c}
            className={`tb-swatch${color === c ? ' active' : ''}${c === '#FFFFFF' ? ' white-swatch' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
            title={c}
          />
        ))}
        <input
          type="color"
          className="tb-color-input"
          value={color}
          onChange={e => setColor(e.target.value)}
          title="Custom color"
        />
      </div>

      <div className="tb-sep" />

      {/* Brush size */}
      <div className="tb-size-group">
        <span className="tb-size-label">Size</span>
        <input
          type="range" min={1} max={50} value={brushSize}
          onChange={e => setBrushSize(Number(e.target.value))}
          className="tb-range"
          title={`Brush size: ${brushSize}`}
        />
        <div
          className="tb-size-preview"
          style={{
            width: previewSize, height: previewSize,
            background: previewColor,
          }}
        />
      </div>

      <div className="tb-sep" />

      {/* Undo / Redo */}
      <button className="tb-tool" onClick={onUndo} title="Undo (Ctrl+Z)"><UndoIcon /></button>
      <button className="tb-tool" onClick={onRedo} title="Redo (Ctrl+Y)"><RedoIcon /></button>

      {/* Clear — pushed to right */}
      <button className="tb-clear" onClick={onClear} title="Clear canvas"><TrashIcon /></button>

    </div>
  );
}
