import React from 'react';
import { useGame } from '../../context/GameContext';

export default function WordBar({ myId }) {
  const { state } = useGame();
  const { phase, currentDrawer, wordHint, wordLength, timeRemaining, settings, round, totalRounds, revealedWord } = state;

  const isDrawer = currentDrawer?.id === myId;
  const drawTime = settings?.drawTime || 80;
  const pct = drawTime > 0 ? (timeRemaining / drawTime) * 100 : 0;
  const timerColor = pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="w-full flex items-center gap-4 px-4 py-3 bg-white rounded-xl"
      style={{
        borderTop: '3px solid transparent',
        borderImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899) 1',
        boxShadow: '0 2px 12px rgba(99,102,241,0.1)',
      }}
    >
      {/* Round info */}
      <div className="text-sm font-bold text-gray-500 shrink-0">
        {round > 0 ? `Round ${round}/${totalRounds}` : ''}
      </div>

      {/* Centre — word / hint */}
      <div className="flex-1 text-center">
        {(phase === 'lobby' || phase === 'started') && (
          <span className="text-gray-400 text-sm">Waiting…</span>
        )}
        {phase === 'choosing' && currentDrawer && (
          <span className="text-sm font-semibold text-gray-600">
            {isDrawer ? 'Choose a word!' : `${currentDrawer.name} is choosing a word…`}
          </span>
        )}
        {phase === 'drawing' && (
          <div>
            {isDrawer ? (
              <span className="text-lg font-extrabold text-blue-700 tracking-widest uppercase">
                {/* Drawer sees the actual word (stored in PlayScreen via wordChoices selection) */}
                {state.selectedWord || 'Draw!'}
              </span>
            ) : (
              <span className="text-xl font-extrabold tracking-[0.25em] text-gray-800">
                {wordHint || '_ '.repeat(wordLength).trim()}
              </span>
            )}
          </div>
        )}
        {(phase === 'turn-end' || phase === 'round-end') && revealedWord && (
          <span className="text-base font-bold text-purple-700">
            The word was: <em>{revealedWord}</em>
          </span>
        )}
        {phase === 'game-end' && (
          <span className="text-base font-bold text-yellow-600">Game Over!</span>
        )}
      </div>

      {/* Timer bar */}
      {phase === 'drawing' && (
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="relative w-28 h-4 bg-gray-200 rounded-full overflow-hidden"
            title={`${timeRemaining}s remaining`}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, backgroundColor: timerColor }}
            />
          </div>
          <span className="text-sm font-bold tabular-nums" style={{ color: timerColor, minWidth: 28 }}>
            {timeRemaining}s
          </span>
        </div>
      )}
    </div>
  );
}
