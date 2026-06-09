import React from 'react';
import { useGame } from '../../context/GameContext';

export default function WordBar({ myId }) {
  const { state } = useGame();
  const { phase, currentDrawer, wordHint, wordLength, timeRemaining, settings, round, totalRounds, revealedWord } = state;

  const isDrawer = currentDrawer?.id === myId;
  const drawTime = settings?.drawTime || 80;
  const pct = drawTime > 0 ? (timeRemaining / drawTime) * 100 : 0;
  const timerColor = pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444';

  // SVG circular timer constants
  const R = 17;
  const circumference = 2 * Math.PI * R;
  const dash = circumference * (pct / 100);

  return (
    <div style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px', background: '#fff', borderRadius: 10,
      border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      flexShrink: 0,
    }}>

      {/* Round info */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', flexShrink: 0, minWidth: 80 }}>
        {round > 0 ? `Round ${round} / ${totalRounds}` : ''}
      </div>

      {/* Centre — word / hint */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        {(phase === 'lobby' || phase === 'started') && (
          <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>Waiting for game…</span>
        )}

        {phase === 'choosing' && currentDrawer && (
          <span style={{ fontSize: 14, fontWeight: 700, color: '#6B7280' }}>
            {isDrawer ? 'Choose a word to draw!' : `${currentDrawer.name} is choosing a word…`}
          </span>
        )}

        {phase === 'drawing' && (
          isDrawer ? (
            <span style={{ fontSize: 20, fontWeight: 900, color: '#3B82F6', letterSpacing: 2 }}>
              {state.selectedWord || 'Draw!'}
            </span>
          ) : (
            <span style={{
              fontSize: 24, fontWeight: 900, letterSpacing: '0.25em', color: '#1F2937',
              fontFamily: 'monospace',
            }}>
              {wordHint || '_ '.repeat(wordLength || 1).trim()}
            </span>
          )
        )}

        {(phase === 'turn-end' || phase === 'round-end') && revealedWord && (
          <span style={{ fontSize: 17, fontWeight: 800, color: '#3B82F6' }}>
            The word was: <em style={{ fontStyle: 'italic' }}>{revealedWord}</em>
          </span>
        )}

        {(phase === 'turn-end' || phase === 'round-end') && !revealedWord && (
          <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>
            {phase === 'round-end' ? 'Round complete!' : 'Turn over!'}
          </span>
        )}

        {phase === 'game-end' && (
          <span style={{ fontSize: 17, fontWeight: 800, color: '#F59E0B' }}>Game Over!</span>
        )}
      </div>

      {/* Timer — SVG ring, only during drawing phase */}
      <div style={{ flexShrink: 0, minWidth: 80, display: 'flex', justifyContent: 'flex-end' }}>
        {phase === 'drawing' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
              {/* Track */}
              <circle cx="20" cy="20" r={R} fill="none" stroke="#E5E7EB" strokeWidth="3" />
              {/* Progress */}
              <circle
                cx="20" cy="20" r={R}
                fill="none"
                stroke={timerColor}
                strokeWidth="3"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
                style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }}
              />
              <text
                x="20" y="25"
                textAnchor="middle"
                fontSize="11"
                fontWeight="800"
                fill={timerColor}
                fontFamily="Nunito, Inter, sans-serif"
              >
                {timeRemaining}
              </text>
            </svg>
          </div>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </div>

    </div>
  );
}
