const { EVENTS } = require('../constants/events');
const { startTurn, endGame } = require('../game/GameEngine');

const VALID_LANGUAGES = ['en', 'fr', 'es', 'de', 'it'];
const VALID_DIFFICULTIES = ['easy', 'normal', 'hard'];

module.exports = function hostEvents(socket, io, roomManager) {
  function getHostRoom() {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return null;
    const room = roomManager.get(roomCode);
    if (!room) return null;
    const host = room.getHost();
    if (!host || host.id !== socket.id) return null;
    return room;
  }

  socket.on(EVENTS.HOST_START_GAME, () => {
    const room = getHostRoom();
    if (!room) return;
    if (room.phase !== 'lobby') return;
    const active = room.players.filter(p => p.status === 'active');
    if (active.length < 2) {
      socket.emit('room:error', { message: 'Need at least 2 players.' });
      return;
    }
    const roomCode = socket.data.roomCode;
    room.phase = 'game';
    room.turn = 0;
    room.round = 0;
    room.drawerIndex = 0;
    room.players.forEach(p => { p.points = 0; p.ready = false; });
    io.to(roomCode).emit(EVENTS.GAME_STARTED, {
      settings: room.settings,
      players: room.publicPlayers(),
    });
    startTurn(room, roomCode, io, roomManager);
  });

  socket.on(EVENTS.HOST_END_GAME, () => {
    const room = getHostRoom();
    if (!room) return;
    endGame(room, socket.data.roomCode, io, roomManager);
  });

  socket.on(EVENTS.HOST_KICK, ({ playerId } = {}) => {
    const room = getHostRoom();
    if (!room || !playerId) return;
    const target = room.getPlayer(playerId);
    if (!target || target.isHost) return;
    const roomCode = socket.data.roomCode;

    io.to(playerId).emit(EVENTS.ROOM_KICKED, {});
    const targetSocket = io.sockets.sockets.get(playerId);
    if (targetSocket) { targetSocket.leave(roomCode); targetSocket.data.roomCode = null; }
    room.removePlayer(playerId);
    io.to(roomCode).emit(EVENTS.ROOM_PLAYERS_UPDATED, room.publicPlayers());
  });

  socket.on(EVENTS.HOST_TRANSFER, ({ playerId } = {}) => {
    const room = getHostRoom();
    if (!room || !playerId) return;
    const currentHost = room.getHost();
    const newHost = room.getPlayer(playerId);
    if (!newHost || !currentHost) return;
    currentHost.isHost = false;
    newHost.isHost = true;
    const roomCode = socket.data.roomCode;
    io.to(roomCode).emit(EVENTS.ROOM_HOST_CHANGED, { newHostId: playerId });
    io.to(roomCode).emit(EVENTS.ROOM_PLAYERS_UPDATED, room.publicPlayers());
  });

  socket.on(EVENTS.HOST_MUTE, ({ playerId, muted } = {}) => {
    const room = getHostRoom();
    if (!room || !playerId) return;
    const target = room.getPlayer(playerId);
    if (!target) return;
    target.isMuted = Boolean(muted);
    io.to(socket.data.roomCode).emit(EVENTS.ROOM_PLAYERS_UPDATED, room.publicPlayers());
  });

  socket.on(EVENTS.HOST_LOCK_ROOM, ({ locked } = {}) => {
    const room = getHostRoom();
    if (!room) return;
    room.isLocked = Boolean(locked);
    io.to(socket.data.roomCode).emit(EVENTS.ROOM_SETTINGS_UPDATED, {
      settings: room.settings,
      isLocked: room.isLocked,
    });
  });

  socket.on(EVENTS.HOST_UPDATE_SETTINGS, ({ settings } = {}) => {
    const room = getHostRoom();
    if (!room || room.phase !== 'lobby') return;
    const s = settings || {};
    room.settings = {
      rounds:          Math.min(10, Math.max(1, parseInt(s.rounds) || 3)),
      drawTime:        Math.min(180, Math.max(30, parseInt(s.drawTime) || 80)),
      maxPlayers:      Math.min(16, Math.max(2, parseInt(s.maxPlayers) || 8)),
      language:        VALID_LANGUAGES.includes(s.language) ? s.language : 'en',
      difficulty:      VALID_DIFFICULTIES.includes(s.difficulty) ? s.difficulty : 'normal',
      isPrivate:       Boolean(s.isPrivate),
      allowSpectators: Boolean(s.allowSpectators !== false),
      customWords:     Array.isArray(s.customWords)
        ? s.customWords.slice(0, 50).map(w => String(w).trim().substring(0, 30)).filter(Boolean)
        : [],
    };
    io.to(socket.data.roomCode).emit(EVENTS.ROOM_SETTINGS_UPDATED, {
      settings: room.settings,
      isLocked: room.isLocked,
    });
  });
};
