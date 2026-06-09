import { useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { EVENTS } from '../constants/socketEvents';

export function useChat(myId) {
  const [input, setInput] = useState('');
  const { socket } = useSocket();
  const { state } = useGame();

  const phase = state.phase;
  const currentDrawer = state.currentDrawer;
  const isDrawer = currentDrawer && currentDrawer.id === myId;
  const myPlayer = state.players.find(p => p.id === myId);
  const alreadyGuessed = state.chats.some(
    c => c.type === 'correct' && c.player && c.player.id === myId
  );

  const canType = !isDrawer &&
    phase === 'drawing' &&
    !alreadyGuessed &&
    myPlayer && !myPlayer.isMuted;

  const sendMessage = useCallback((e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit(EVENTS.CHAT_GUESS, { text: input.trim() });
    setInput('');
  }, [input, socket]);

  return { input, setInput, sendMessage, canType, alreadyGuessed };
}
