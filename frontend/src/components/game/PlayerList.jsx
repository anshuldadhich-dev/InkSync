import React from 'react';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import { EVENTS } from '../../constants/socketEvents';

const StarIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const PenTinyIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

function AvatarCircle({ avatar, name, size = 36 }) {
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

export default function PlayerList({ myId, showHostControls }) {
  const { state } = useGame();
  const { socket } = useSocket();
  const myPlayer = state.players.find(p => p.id === myId);
  const amHost = myPlayer?.isHost;

  function kick(id)               { socket?.emit(EVENTS.HOST_KICK,     { playerId: id }); }
  function mute(id, muted)        { socket?.emit(EVENTS.HOST_MUTE,     { playerId: id, muted }); }
  function transfer(id)           { socket?.emit(EVENTS.HOST_TRANSFER, { playerId: id }); }

  const sorted = [...state.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-100 uppercase tracking-wide">
        Players ({state.players.length}/{state.settings.maxPlayers})
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map((pl, rank) => (
          <PlayerRow
            key={pl.id}
            pl={pl}
            rank={rank}
            isMe={pl.id === myId}
            isDrawing={state.currentDrawer?.id === pl.id}
            amHost={amHost && showHostControls}
            onKick={() => kick(pl.id)}
            onMute={() => mute(pl.id, !pl.isMuted)}
            onTransfer={() => transfer(pl.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerRow({ pl, rank, isMe, isDrawing, amHost, onKick, onMute, onTransfer }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 last:border-0 ${
        isDrawing ? 'bg-yellow-50' : isMe ? 'bg-blue-50' : ''
      } ${pl.status === 'disconnected' ? 'opacity-40' : ''}`}
    >
      <span className="text-xs font-bold text-gray-300 w-4 shrink-0 text-right">
        {rank + 1}
      </span>

      <AvatarCircle avatar={pl.avatar} name={pl.name} size={34} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          {pl.isHost && (
            <span className="text-yellow-500 shrink-0"><StarIcon /></span>
          )}
          {isDrawing && (
            <span className="text-blue-500 shrink-0"><PenTinyIcon /></span>
          )}
          {pl.isMuted && (
            <span className="text-xs bg-red-100 text-red-500 font-bold px-1 rounded leading-none">muted</span>
          )}
          <span className={`text-sm font-medium truncate ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>
            {pl.name}{isMe ? ' (you)' : ''}
          </span>
        </div>
        <div className="text-xs text-gray-400 font-semibold">{pl.score ?? 0} pts</div>
      </div>

      {amHost && !pl.isHost && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onMute}
            title={pl.isMuted ? 'Unmute' : 'Mute'}
            className="text-xs px-1.5 py-0.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-100 leading-snug"
          >
            {pl.isMuted ? 'un' : 'M'}
          </button>
          <button
            onClick={onKick}
            title="Kick"
            className="text-xs px-1.5 py-0.5 rounded border border-red-200 text-red-400 hover:bg-red-50 leading-snug font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
