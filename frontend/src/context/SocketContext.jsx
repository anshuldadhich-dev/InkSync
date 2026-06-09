import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const ENDPOINT =
  process.env.REACT_APP_NODE_ENV === 'production'
    ? 'https://skribblay-you.onrender.com/'
    : 'http://localhost:3001/';

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(ENDPOINT, { autoConnect: false });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    socketRef.current = s;
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  function connect() { socketRef.current?.connect(); }
  function disconnect() { socketRef.current?.disconnect(); }

  return (
    <SocketContext.Provider value={{ socket, connected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be inside SocketProvider');
  return ctx;
}
