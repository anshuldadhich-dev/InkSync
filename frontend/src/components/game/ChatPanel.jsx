import React, { useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useChat } from '../../hooks/useChat';

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

export default function ChatPanel({ myId }) {
  const { state } = useGame();
  const { input, setInput, sendMessage, canType } = useChat(myId);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [state.chats.length]);

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-100 uppercase tracking-wide">
        Chat &amp; Guesses
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto flex flex-col-reverse gap-1 px-2 py-2"
        style={{ minHeight: 0 }}
      >
        {state.chats.map(chat => (
          <ChatRow key={chat.id} chat={chat} myId={myId} />
        ))}
      </div>

      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-2 py-2 border-t border-gray-100"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={canType ? 'Type your guess…' : '—'}
          disabled={!canType}
          className={`flex-1 text-sm px-3 py-2 rounded-lg border ${
            canType
              ? 'border-blue-300 focus:outline-none focus:border-blue-500 bg-white'
              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!canType || !input.trim()}
          className="p-2 rounded-lg bg-blue-500 text-white disabled:opacity-40 hover:bg-blue-600 transition-colors"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

function ChatRow({ chat, myId }) {
  const isMe = chat.player && chat.player.id === myId;

  if (chat.type === 'correct') {
    return (
      <div className="text-xs rounded-lg px-2 py-1.5 bg-green-50 border border-green-200 text-green-700 font-semibold">
        {isMe
          ? `You guessed it! +${chat.points} pts`
          : `${chat.player?.name} guessed correctly! +${chat.points} pts`}
      </div>
    );
  }

  return (
    <div className={`text-xs flex gap-1 ${isMe ? 'text-blue-700' : 'text-gray-700'}`}>
      <span className="font-semibold shrink-0">{isMe ? 'You' : chat.player?.name}:</span>
      <span className="break-words min-w-0">{chat.text}</span>
    </div>
  );
}
