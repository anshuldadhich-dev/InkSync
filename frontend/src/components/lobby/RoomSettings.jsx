import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import { EVENTS } from '../../constants/socketEvents';

export default function RoomSettings({ isHost }) {
  const { state } = useGame();
  const { socket } = useSocket();
  const [draft, setDraft] = useState({ customWords: [], ...state.settings });
  const [customInput, setCustomInput] = useState('');

  // Sync if server pushes a settings update
  useEffect(() => { setDraft(s => ({ customWords: [], ...s, ...state.settings })); }, [state.settings]);

  function update(key, val) {
    const next = { ...draft, [key]: val };
    setDraft(next);
    if (isHost) socket?.emit(EVENTS.HOST_UPDATE_SETTINGS, { settings: next });
  }

  function addCustomWord() {
    const word = customInput.trim();
    if (!word || draft.customWords.includes(word) || draft.customWords.length >= 50) return;
    update('customWords', [...draft.customWords, word]);
    setCustomInput('');
  }

  function removeCustomWord(w) {
    update('customWords', draft.customWords.filter(x => x !== w));
  }

  const Row = ({ label, children }) => (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600 shrink-0">{label}</span>
      {children}
    </div>
  );

  return (
    <div>

      <Row label="Rounds">
        {isHost ? (
          <select
            value={draft.rounds}
            onChange={e => update('rounds', Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        ) : <span className="text-sm font-semibold">{draft.rounds}</span>}
      </Row>

      <Row label="Draw time">
        {isHost ? (
          <select
            value={draft.drawTime}
            onChange={e => update('drawTime', Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            {[30,45,60,80,100,120,150,180].map(n => (
              <option key={n} value={n}>{n}s</option>
            ))}
          </select>
        ) : <span className="text-sm font-semibold">{draft.drawTime}s</span>}
      </Row>

      <Row label="Max players">
        {isHost ? (
          <select
            value={draft.maxPlayers}
            onChange={e => update('maxPlayers', Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            {[2,4,6,8,10,12,16].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        ) : <span className="text-sm font-semibold">{draft.maxPlayers}</span>}
      </Row>

      <Row label="Language">
        {isHost ? (
          <select
            value={draft.language}
            onChange={e => update('language', e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
          </select>
        ) : <span className="text-sm font-semibold capitalize">{draft.language}</span>}
      </Row>

      <Row label="Difficulty">
        {isHost ? (
          <select
            value={draft.difficulty}
            onChange={e => update('difficulty', e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        ) : <span className="text-sm font-semibold capitalize">{draft.difficulty}</span>}
      </Row>

      <Row label="Spectators">
        {isHost ? (
          <input
            type="checkbox"
            checked={draft.allowSpectators}
            onChange={e => update('allowSpectators', e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
        ) : <span className="text-sm font-semibold">{draft.allowSpectators ? 'Yes' : 'No'}</span>}
      </Row>

      {/* Custom words */}
      {isHost && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-1">
            Custom words ({draft.customWords.length}/50) — mixed in with standard words
          </p>
          <div className="flex gap-2">
            <input
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomWord()}
              placeholder="Add word…"
              maxLength={30}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
            />
            <button
              onClick={addCustomWord}
              className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          {draft.customWords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {draft.customWords.map(w => (
                <span
                  key={w}
                  className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                >
                  {w}
                  <button onClick={() => removeCustomWord(w)} className="text-gray-400 hover:text-red-500">✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
