import React from 'react';
import { useGame } from '../../context/GameContext';

const RANK_COLORS = ['#F59E0B', '#9CA3AF', '#D97706']; // gold, silver, bronze
const RANK_LABELS = ['1st', '2nd', '3rd'];
const RANK_SIZES  = [64, 52, 44];

function AvatarCircle({ avatar, name, size }) {
  const initial = name ? name[0].toUpperCase() : '?';
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: avatar && avatar.startsWith('#') ? avatar : '#6B7280',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontSize: size * 0.40,
        userSelect: 'none',
        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.15)',
      }}
    >
      {initial}
    </div>
  );
}

const TrophyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0012 0V2z"/>
  </svg>
);

const StarIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export default function EndGameSummary({ myId }) {
  const { state } = useGame();
  const { gameResult, phase } = state;

  if (phase !== 'game-end' || !gameResult) return null;

  const { winner, finalScores } = gameResult;
  const isWinner = winner?.id === myId;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black bg-opacity-60 rounded-xl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 flex flex-col items-center gap-6">

        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          {isWinner ? <TrophyIcon /> : <StarIcon />}
          <h2 className="text-2xl font-extrabold text-gray-900">Game Over!</h2>
          {winner && (
            <p className="text-sm text-gray-500">
              {isWinner ? 'You won!' : `${winner.name} wins!`}
            </p>
          )}
        </div>

        {/* Podium — top 3 */}
        <div className="flex items-end justify-center gap-5 w-full">
          {finalScores.slice(0, 3).map((pl, i) => {
            const size = RANK_SIZES[i];
            return (
              <div
                key={pl.id}
                className={`flex flex-col items-center gap-1 ${
                  i === 0 ? 'order-2' : i === 1 ? 'order-1' : 'order-3'
                }`}
              >
                {/* Rank badge */}
                <span
                  className="text-xs font-extrabold px-2 py-0.5 rounded-full"
                  style={{ background: RANK_COLORS[i] + '22', color: RANK_COLORS[i] }}
                >
                  {RANK_LABELS[i]}
                </span>

                {/* Avatar with ring */}
                <div
                  style={{
                    padding: 3,
                    borderRadius: '50%',
                    background: RANK_COLORS[i],
                  }}
                >
                  <AvatarCircle avatar={pl.avatar} name={pl.name} size={size} />
                </div>

                <span className="text-xs font-bold text-gray-800 max-w-[72px] truncate text-center">
                  {pl.id === myId ? 'You' : pl.name}
                </span>
                <span className="text-xs text-gray-400 font-semibold">{pl.score ?? 0} pts</span>
              </div>
            );
          })}
        </div>

        {/* Rest of leaderboard */}
        {finalScores.length > 3 && (
          <div className="w-full border-t pt-4 flex flex-col gap-1">
            {finalScores.slice(3).map((pl, i) => (
              <div key={pl.id} className="flex items-center gap-3 py-1">
                <span className="text-xs text-gray-400 w-5 text-right font-bold">#{i + 4}</span>
                <AvatarCircle avatar={pl.avatar} name={pl.name} size={28} />
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                  {pl.id === myId ? 'You' : pl.name}
                </span>
                <span className="text-sm text-gray-400 font-semibold">{pl.score ?? 0} pts</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400">Returning to lobby…</p>
      </div>
    </div>
  );
}
