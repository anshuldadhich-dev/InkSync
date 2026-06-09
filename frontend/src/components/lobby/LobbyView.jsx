import React, { useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import { EVENTS } from '../../constants/socketEvents';
import RoomSettings from './RoomSettings';

// ── Icons ─────────────────────────────────────────────────────────────────────

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const UnlockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 019.9-1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const StarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// ── Avatar ────────────────────────────────────────────────────────────────────

function PlayerAvatar({ avatar, name, size = 36 }) {
  const initial = name ? name[0].toUpperCase() : '?';
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: avatar && avatar.startsWith('#') ? avatar : '#6B7280',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontSize: size * 0.42,
        flexShrink: 0, userSelect: 'none',
        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.15)',
      }}
    >
      {initial}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LobbyView({ myId, roomCode }) {
  const { state } = useGame();
  const { socket } = useSocket();
  const myPlayer = state.players.find(p => p.id === myId);
  const amHost = myPlayer?.isHost;
  const activeCount = state.players.filter(p => p.status === 'active').length;
  const canStart = amHost && activeCount >= 2;

  const shareLink = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

  const copyLink = useCallback(() => {
    navigator.clipboard?.writeText(shareLink).catch(() => {});
  }, [shareLink]);

  const copyCode = useCallback(() => {
    navigator.clipboard?.writeText(roomCode).catch(() => {});
  }, [roomCode]);

  function toggleReady() {
    if (!myId || !socket) return;
    socket.emit(EVENTS.ROOM_READY, { ready: !myPlayer?.ready });
  }

  function startGame() {
    socket?.emit(EVENTS.HOST_START_GAME);
  }

  function lockRoom() {
    socket?.emit(EVENTS.HOST_LOCK_ROOM, { locked: !state.isLocked });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 50%, #fce7f3 100%)' }}
    >
      <div className="w-full max-w-2xl flex flex-col gap-5">

        {/* Room header */}
        <div className="rounded-2xl overflow-hidden shadow-md" style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.13)' }}>
          {/* Gradient top bar */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">InkSync</h1>
                {state.isLocked && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white bg-opacity-20 text-white font-bold px-2 py-0.5 rounded-full border border-white border-opacity-30">
                    <LockIcon /> Locked
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-blue-200">Room</span>
                <span
                  className="text-lg font-extrabold tracking-widest text-white"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
                >
                  {roomCode}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <CopyIcon /> Copy Code
              </button>
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <LinkIcon /> Share Link
              </button>
              {amHost && (
                <button
                  onClick={lockRoom}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{
                    background: state.isLocked ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)',
                    color: '#fff',
                    border: `1.5px solid ${state.isLocked ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)'}`,
                  }}
                >
                  {state.isLocked ? <UnlockIcon /> : <LockIcon />}
                  {state.isLocked ? 'Unlock' : 'Lock Room'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Players list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5" style={{ boxShadow: '0 4px 20px rgba(99,102,241,0.08)' }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#8b5cf6' }}>
            Players — {activeCount} / {state.settings.maxPlayers}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {state.players.map(pl => (
              <LobbyPlayerCard key={pl.id} pl={pl} isMe={pl.id === myId} />
            ))}
            {Array.from({ length: Math.max(0, state.settings.maxPlayers - state.players.length) }).slice(0, 4).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-2 p-2 rounded-xl border-2 border-dashed border-gray-200"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                <span className="text-sm text-gray-300">Waiting…</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <RoomSettings isHost={amHost} />

        {/* Actions */}
        <div className="flex gap-3">
          {!amHost && (
            <button
              onClick={toggleReady}
              className="flex-1 py-3 rounded-xl font-bold text-base transition-all"
              style={myPlayer?.ready
                ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }
                : { background: '#fff', border: '2px solid #10b981', color: '#059669' }
              }
            >
              {myPlayer?.ready ? 'Ready!' : 'Ready?'}
            </button>
          )}
          {amHost && (
            <button
              onClick={startGame}
              disabled={!canStart}
              className="flex-1 py-3 rounded-xl font-bold text-base text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: canStart ? '0 4px 15px rgba(99,102,241,0.4)' : 'none' }}
            >
              {activeCount < 2 ? 'Need 2+ players' : 'Start Game'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Player card ───────────────────────────────────────────────────────────────

function LobbyPlayerCard({ pl, isMe }) {
  const accentColor = pl.avatar && pl.avatar.startsWith('#') ? pl.avatar : '#6B7280';

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${
        pl.status === 'disconnected' ? 'opacity-40' : ''
      }`}
      style={
        pl.ready
          ? { borderColor: '#10b981', background: '#f0fdf4' }
          : isMe
          ? { borderColor: accentColor, background: accentColor + '12' }
          : { borderColor: '#e5e7eb', background: '#fff' }
      }
    >
      <div className="relative shrink-0">
        <PlayerAvatar avatar={pl.avatar} name={pl.name} size={36} />
        {pl.ready && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <CheckIcon />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          {pl.isHost && (
            <span className="text-yellow-500 shrink-0"><StarIcon /></span>
          )}
          <span className="text-sm font-semibold text-gray-800 truncate">
            {pl.name}{isMe ? ' (you)' : ''}
          </span>
        </div>
        <div className="text-xs" style={{ color: pl.ready ? '#10b981' : '#9ca3af' }}>
          {pl.ready ? 'Ready' : 'Waiting'}
        </div>
      </div>
    </div>
  );
}
