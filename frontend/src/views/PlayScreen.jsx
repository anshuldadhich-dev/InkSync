import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { EVENTS } from '../constants/socketEvents';
import LobbyView from '../components/lobby/LobbyView';
import WordBar from '../components/game/WordBar';
import GameCanvas from '../components/game/GameCanvas';
import ChatPanel from '../components/game/ChatPanel';
import PlayerList from '../components/game/PlayerList';
import WordChooser from '../components/game/WordChooser';
import EndGameSummary from '../components/game/EndGameSummary';

// HomeScreen sends a hex color as avatar; convert to an inline SVG data URL
// so every <img src={avatar}> renders correctly.
function resolveAvatar(colorOrUrl, initial) {
  if (!colorOrUrl) colorOrUrl = '#6366f1';
  if (colorOrUrl.startsWith('data:') || colorOrUrl.startsWith('http')) return colorOrUrl;
  const letter = (initial || '?')[0].toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="32" fill="${colorOrUrl}"/><text x="32" y="46" text-anchor="middle" font-size="28" font-weight="bold" fill="white" font-family="sans-serif">${letter}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default function PlayScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state || {};

  const { socket, connect, disconnect } = useSocket();
  const { state, dispatch } = useGame();
  const { phase, currentDrawer, roomError } = state;

  const [myId, setMyId] = useState(null);
  const roomCode = userData.roomCode || '';
  const avatar = useMemo(
    () => resolveAvatar(userData.avatar, userData.username),
    [userData.avatar, userData.username]
  );

  // Guard: redirect home if missing required data
  useEffect(() => {
    const stored = localStorage.getItem('username');
    if (!stored || !userData.username || !userData.avatar || !userData.roomCode) {
      navigate('/');
    }
  }, []);

  // Connect socket, then join room once connected
  useEffect(() => {
    if (!socket || !userData.username) return;

    function joinRoom() {
      setMyId(socket.id);
      socket.emit(EVENTS.ROOM_JOIN, {
        username: userData.username,
        avatar,
        roomCode: userData.roomCode,
        isCreating: !!userData.isCreating,
      });
    }

    connect();
    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();

    return () => { socket.off('connect', joinRoom); };
  }, [socket]);

  // Handle reconnect
  useEffect(() => {
    if (!socket) return;
    function onReconnect() {
      setMyId(socket.id);
      socket.emit(EVENTS.ROOM_JOIN, {
        username: userData.username,
        avatar,
        roomCode: userData.roomCode,
      });
    }
    socket.on('reconnect', onReconnect);
    return () => socket.off('reconnect', onReconnect);
  }, [socket]);

  // Cleanup on unmount / page close
  useEffect(() => {
    const cleanup = () => {
      localStorage.removeItem('username');
      disconnect();
    };
    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []);

  // Store the word the drawer selected so WordBar can show it
  function handleWordSelected(word) {
    dispatch({ type: 'ROOM_STATE', payload: { selectedWord: word } });
  }

  // Handle room errors (kicked, locked, full, etc.)
  useEffect(() => {
    if (roomError) {
      alert(roomError.message || 'Room error.');
      dispatch({ type: 'CLEAR_ERROR' });
      navigate('/');
    }
  }, [roomError]);

  const isDrawer = !!(currentDrawer && currentDrawer.id === myId);
  const inGame = phase !== 'lobby' && phase !== 'game-end';

  // ── Lobby phase ──────────────────────────────────────────────────────────────
  if (!myId || phase === 'lobby') {
    return <LobbyView myId={myId} roomCode={roomCode} />;
  }

  // ── Game phase ───────────────────────────────────────────────────────────────
  return (
    <div
      className="w-screen overflow-hidden"
      style={{
        height: '100dvh',
        display: 'flex', flexDirection: 'column', gap: 6, padding: 6,
        background: '#F4F6F8',
        boxSizing: 'border-box',
      }}
    >
      {/* Word hint + timer bar */}
      <WordBar myId={myId} />

      {/* Three-column game layout; collapses to one column on narrow screens */}
      <div
        className="flex-1 game-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 220px',
          gap: 6,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Player list */}
        <PlayerList myId={myId} showHostControls={inGame} />

        {/* Canvas column */}
        <div className="relative" style={{ minHeight: 0, overflow: 'hidden' }}>
          <GameCanvas isDrawer={isDrawer} />

          {/* Word chooser (drawer only) */}
          <WordChooser myId={myId} onWordSelected={handleWordSelected} />

          {/* "Choosing" overlay for non-drawers */}
          {phase === 'choosing' && currentDrawer && currentDrawer.id !== myId && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-80 rounded-xl pointer-events-none">
              <p className="text-gray-600 text-lg font-semibold">
                {currentDrawer.name} is choosing a word…
              </p>
            </div>
          )}

          {/* Turn / round end overlay */}
          {(phase === 'turn-end' || phase === 'round-end') && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-85 rounded-xl pointer-events-none">
              <div className="text-center px-4">
                {state.revealedWord && (
                  <p className="text-2xl font-extrabold mb-1" style={{ color: '#3B82F6' }}>
                    The word was: <em>{state.revealedWord}</em>
                  </p>
                )}
                {phase === 'round-end' && (
                  <p className="text-lg font-bold text-gray-600 mt-1">Round complete!</p>
                )}
                <p className="text-sm text-gray-400 mt-2">Next turn starting…</p>
              </div>
            </div>
          )}

          {/* End game summary */}
          <EndGameSummary myId={myId} />
        </div>

        {/* Chat / guesses */}
        <ChatPanel myId={myId} />
      </div>

      {/* Inline responsive override — grid collapses on small screens */}
      <style>{`
        @media (max-width: 860px) {
          .game-grid {
            grid-template-columns: 1fr !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
