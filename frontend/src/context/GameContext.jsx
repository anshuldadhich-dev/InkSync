import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { EVENTS } from '../constants/socketEvents';

const GameContext = createContext(null);

const DEFAULT_SETTINGS = {
  rounds: 3,
  drawTime: 80,
  maxPlayers: 8,
  language: 'en',
  difficulty: 'normal',
  isPrivate: false,
  allowSpectators: true,
  customWords: [],
};

const initialState = {
  players: [],
  settings: { ...DEFAULT_SETTINGS },
  phase: 'lobby',       // lobby | choosing | drawing | turn-end | round-end | game-end
  round: 0,
  totalRounds: 3,
  currentDrawer: null,
  timeRemaining: 0,
  wordHint: null,
  wordLength: 0,
  wordChoices: [],      // Only populated for the current drawer
  revealedWord: null,   // Shown at turn end
  chats: [],
  isLocked: false,
  gameResult: null,     // { winner, finalScores }
  roomError: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'ROOM_STATE':
      return { ...state, ...action.payload, chats: state.chats };

    case 'PLAYERS_UPDATED':
      return { ...state, players: action.payload };

    case 'SETTINGS_UPDATED':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload.settings },
        isLocked: action.payload.isLocked ?? state.isLocked,
      };

    case 'GAME_STARTED':
      return {
        ...state,
        phase: 'started',
        players: action.payload.players || state.players,
        settings: action.payload.settings || state.settings,
        chats: [],
        gameResult: null,
        revealedWord: null,
      };

    case 'ROUND_START':
      return { ...state, round: action.payload.round, totalRounds: action.payload.total };

    case 'TURN_START':
      return {
        ...state,
        phase: 'choosing',
        currentDrawer: action.payload.drawer,
        wordChoices: [],
        wordHint: null,
        revealedWord: null,
      };

    case 'WORD_CHOICES':
      return { ...state, wordChoices: action.payload };

    case 'TURN_CHOOSING':
      return { ...state, phase: 'choosing', currentDrawer: action.payload.drawer };

    case 'TURN_DRAWING_START':
      return {
        ...state,
        phase: 'drawing',
        wordHint: action.payload.hint,
        wordLength: action.payload.wordLength,
        timeRemaining: action.payload.drawTime,
        wordChoices: [],
      };

    case 'TURN_TICK':
      return { ...state, timeRemaining: action.payload.remaining };

    case 'TURN_HINT':
      return { ...state, wordHint: action.payload.hint };

    case 'TURN_END':
      return {
        ...state,
        phase: 'turn-end',
        players: action.payload.scores || state.players,
        revealedWord: action.payload.word,
        timeRemaining: 0,
      };

    case 'ROUND_END':
      return { ...state, phase: 'round-end', players: action.payload.scores || state.players };

    case 'GAME_END':
      return { ...state, phase: 'game-end', gameResult: action.payload };

    case 'SCORE_UPDATE':
      return { ...state, players: action.payload.players };

    case 'CHAT_MESSAGE': {
      const msg = { type: 'message', id: Date.now() + Math.random(), ...action.payload };
      return { ...state, chats: [msg, ...state.chats].slice(0, 100) };
    }

    case 'CHAT_CORRECT': {
      const msg = { type: 'correct', id: Date.now() + Math.random(), ...action.payload };
      return { ...state, chats: [msg, ...state.chats].slice(0, 100) };
    }

    case 'ROOM_ERROR':
      return { ...state, roomError: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, roomError: null };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handlers = {
      [EVENTS.ROOM_STATE]:         (d) => dispatch({ type: 'ROOM_STATE', payload: d }),
      [EVENTS.ROOM_PLAYERS_UPDATED]: (d) => dispatch({ type: 'PLAYERS_UPDATED', payload: d }),
      [EVENTS.ROOM_SETTINGS_UPDATED]: (d) => dispatch({ type: 'SETTINGS_UPDATED', payload: d }),
      [EVENTS.GAME_STARTED]:       (d) => dispatch({ type: 'GAME_STARTED', payload: d }),
      [EVENTS.ROUND_START]:        (d) => dispatch({ type: 'ROUND_START', payload: d }),
      [EVENTS.TURN_START]:         (d) => dispatch({ type: 'TURN_START', payload: d }),
      [EVENTS.TURN_WORD_CHOICES]:  (d) => dispatch({ type: 'WORD_CHOICES', payload: d }),
      [EVENTS.TURN_CHOOSING]:      (d) => dispatch({ type: 'TURN_CHOOSING', payload: d }),
      [EVENTS.TURN_DRAWING_START]: (d) => dispatch({ type: 'TURN_DRAWING_START', payload: d }),
      [EVENTS.TURN_TICK]:          (d) => dispatch({ type: 'TURN_TICK', payload: d }),
      [EVENTS.TURN_HINT]:          (d) => dispatch({ type: 'TURN_HINT', payload: d }),
      [EVENTS.TURN_END]:           (d) => dispatch({ type: 'TURN_END', payload: d }),
      [EVENTS.ROUND_END]:          (d) => dispatch({ type: 'ROUND_END', payload: d }),
      [EVENTS.GAME_END]:           (d) => dispatch({ type: 'GAME_END', payload: d }),
      [EVENTS.SCORE_UPDATE]:       (d) => dispatch({ type: 'SCORE_UPDATE', payload: d }),
      [EVENTS.CHAT_MESSAGE]:       (d) => dispatch({ type: 'CHAT_MESSAGE', payload: d }),
      [EVENTS.CHAT_CORRECT_GUESS]: (d) => dispatch({ type: 'CHAT_CORRECT', payload: d }),
      [EVENTS.ROOM_ERROR]:         (d) => dispatch({ type: 'ROOM_ERROR', payload: d }),
      [EVENTS.ROOM_FULL]:          () => dispatch({ type: 'ROOM_ERROR', payload: { message: 'Room is full.' } }),
      [EVENTS.ROOM_LOCKED]:        () => dispatch({ type: 'ROOM_ERROR', payload: { message: 'Room is locked.' } }),
      [EVENTS.GAME_IN_PROGRESS]:   () => dispatch({ type: 'ROOM_ERROR', payload: { message: 'Game already in progress.' } }),
      [EVENTS.ROOM_KICKED]:        () => dispatch({ type: 'ROOM_ERROR', payload: { message: 'You were kicked from the room.' } }),
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => { Object.keys(handlers).forEach(event => socket.off(event)); };
  }, [socket]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
