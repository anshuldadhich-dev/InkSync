import React, { useCallback, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import { EVENTS } from '../../constants/socketEvents';
import RoomSettings from './RoomSettings';

// ── Icons ─────────────────────────────────────────────────────────────────────

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
  </svg>
);

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const UnlockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 019.9-1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const StarIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── Avatar — handles both data URLs and plain hex colors ──────────────────────

function PlayerAvatar({ avatar, name, size = 36 }) {
  const initial = name ? name[0].toUpperCase() : '?';
  const isUrl = avatar && (avatar.startsWith('data:') || avatar.startsWith('http'));

  if (isUrl) {
    return (
      <img
        src={avatar}
        alt={initial}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatar && avatar.startsWith('#') ? avatar : '#6B7280',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: size * 0.42,
      flexShrink: 0, userSelect: 'none',
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.15)',
    }}>
      {initial}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LobbyView({ myId, roomCode }) {
  const { state } = useGame();
  const { socket } = useSocket();
  const [showSettings, setShowSettings] = useState(false);

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
    <div style={{
      minHeight: '100vh', background: '#F4F6F8',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Room header ─────────────────────────────────────────────────── */}
        <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 10, padding: '14px 18px',
            background: '#3B82F6',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.5, margin: 0 }}>
                  InkSync
                </h1>
                {state.isLocked && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
                    background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700,
                    padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.3)',
                  }}>
                    <LockIcon /> Locked
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Room</span>
                <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, color: '#fff' }}>{roomCode}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <HeaderBtn onClick={copyCode}><CopyIcon /> Copy Code</HeaderBtn>
              <HeaderBtn onClick={copyLink}><LinkIcon /> Share Link</HeaderBtn>
              {amHost && (
                <HeaderBtn
                  onClick={lockRoom}
                  extraStyle={{
                    background: state.isLocked ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)',
                    borderColor: state.isLocked ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)',
                  }}
                >
                  {state.isLocked ? <UnlockIcon /> : <LockIcon />}
                  {state.isLocked ? 'Unlock' : 'Lock Room'}
                </HeaderBtn>
              )}
            </div>
          </div>
        </div>

        {/* ── Players ─────────────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
          padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF' }}>
              Players
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
              {activeCount} / {state.settings.maxPlayers}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 8 }}>
            {state.players.map(pl => (
              <LobbyPlayerCard key={pl.id} pl={pl} isMe={pl.id === myId} />
            ))}
            {Array.from({ length: Math.max(0, state.settings.maxPlayers - state.players.length) })
              .slice(0, 4).map((_, i) => (
                <div key={`empty-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 10,
                  border: '2px dashed #E5E7EB',
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F3F4F6', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#D1D5DB', fontWeight: 600 }}>Waiting…</span>
                </div>
              ))}
          </div>
        </div>

        {/* ── Settings (collapsible) ───────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden',
        }}>
          <button
            onClick={() => setShowSettings(s => !s)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '12px 16px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
              Room Settings
              {!amHost && (
                <span style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', marginLeft: 6 }}>
                  (host only)
                </span>
              )}
            </span>
            <ChevronIcon open={showSettings} />
          </button>
          {showSettings && (
            <div style={{ borderTop: '1px solid #F3F4F6', padding: '4px 16px 14px' }}>
              <RoomSettings isHost={amHost} compact />
            </div>
          )}
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10 }}>
          {!amHost && (
            <button
              onClick={toggleReady}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 12, fontFamily: 'inherit',
                fontSize: 15, fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s',
                ...(myPlayer?.ready
                  ? { background: '#10B981', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }
                  : { background: '#fff', border: '2px solid #10B981', color: '#059669' }
                ),
              }}
            >
              {myPlayer?.ready ? 'Ready!' : 'Ready?'}
            </button>
          )}
          {amHost && (
            <button
              onClick={startGame}
              disabled={!canStart}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 12, fontFamily: 'inherit',
                fontSize: 15, fontWeight: 800, color: '#fff', border: 'none',
                cursor: canStart ? 'pointer' : 'not-allowed',
                background: '#3B82F6',
                boxShadow: canStart ? '0 4px 14px rgba(59,130,246,0.35)' : 'none',
                opacity: canStart ? 1 : 0.45,
                transition: 'all 0.15s',
              }}
            >
              {activeCount < 2 ? 'Need 2+ players' : 'Start Game'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HeaderBtn({ onClick, children, extraStyle = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 12, padding: '5px 11px', borderRadius: 8, fontWeight: 700,
        background: 'rgba(255,255,255,0.18)', color: '#fff',
        border: '1.5px solid rgba(255,255,255,0.3)',
        cursor: 'pointer', fontFamily: 'inherit',
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

function LobbyPlayerCard({ pl, isMe }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 10px', borderRadius: 10, border: '2px solid',
      borderColor: pl.ready ? '#10B981' : isMe ? '#3B82F6' : '#E5E7EB',
      background: pl.ready ? '#F0FDF4' : isMe ? '#EFF6FF' : '#fff',
      opacity: pl.status === 'disconnected' ? 0.4 : 1,
      transition: 'all 0.15s',
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <PlayerAvatar avatar={pl.avatar} name={pl.name} size={34} />
        {pl.ready && (
          <span style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 15, height: 15, borderRadius: '50%', background: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            <CheckIcon />
          </span>
        )}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {pl.isHost && <StarIcon />}
          <span style={{
            fontSize: 13, fontWeight: 700, color: '#1F2937',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {pl.name}{isMe ? ' (you)' : ''}
          </span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: pl.ready ? '#10B981' : '#9CA3AF', marginTop: 1 }}>
          {pl.ready ? 'Ready' : 'Waiting'}
        </div>
      </div>
    </div>
  );
}
