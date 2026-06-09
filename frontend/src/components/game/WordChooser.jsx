import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import { EVENTS } from '../../constants/socketEvents';

export default function WordChooser({ myId, onWordSelected }) {
  const { state } = useGame();
  const { socket } = useSocket();
  const { phase, currentDrawer, wordChoices } = state;

  const isMyTurn = currentDrawer?.id === myId;
  const visible = phase === 'choosing' && isMyTurn && wordChoices.length > 0;

  function pick(word) {
    socket?.emit(EVENTS.TURN_WORD_SELECTED, { word });
    if (onWordSelected) onWordSelected(word);
  }

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-50 rounded-xl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
        <h2 className="text-xl font-extrabold text-gray-800">Choose a word to draw!</h2>
        <div className="flex flex-col gap-3 w-full">
          {wordChoices.map((word, i) => (
            <button
              key={i}
              onClick={() => pick(word)}
              className="w-full py-3 px-6 text-lg font-bold rounded-xl border-2 border-blue-300 text-blue-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all"
            >
              {word}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">A word will be auto-selected in 15s</p>
      </div>
    </div>
  );
}
