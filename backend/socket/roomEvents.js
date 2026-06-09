const { EVENTS } = require('../constants/events');
const { cleanup } = require('../middleware/rateLimiter');

module.exports = function roomEvents(socket, io, roomManager) {
  socket.on(EVENTS.ROOM_JOIN, ({ username, avatar, roomCode } = {}) => {
    if (!roomCode || !username) return;

    const room = roomManager.getOrCreate(roomCode);

    // Reconnect path
    const existing = room.players.find(
      p => p.name === username && p.status === 'disconnected'
    );
    if (existing) {
      if (existing.reconnectTimer) { clearTimeout(existing.reconnectTimer); existing.reconnectTimer = null; }
      existing.id = socket.id;
      existing.status = 'active';
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.emit(EVENTS.ROOM_STATE, room.toPublicState());
      if (room.drawOpLog.length > 0) {
        socket.emit(EVENTS.DRAW_SNAPSHOT, { ops: room.drawOpLog });
      }
      io.to(roomCode).emit(EVENTS.ROOM_PLAYERS_UPDATED, room.publicPlayers());
      return;
    }

    // Guard: locked room
    if (room.isLocked) { socket.emit(EVENTS.ROOM_LOCKED, {}); return; }

    // Guard: game in progress and spectators disabled
    if (room.phase !== 'lobby' && !room.settings.allowSpectators) {
      socket.emit(EVENTS.GAME_IN_PROGRESS, {}); return;
    }

    // Guard: max players
    const active = room.players.filter(p => p.status === 'active');
    if (active.length >= room.settings.maxPlayers) {
      socket.emit(EVENTS.ROOM_FULL, {}); return;
    }

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    room.addPlayer({ id: socket.id, name: username, avatar });

    io.to(roomCode).emit(EVENTS.ROOM_PLAYERS_UPDATED, room.publicPlayers());

    // Mid-game join: send state + canvas snapshot
    if (room.phase !== 'lobby') {
      socket.emit(EVENTS.ROOM_STATE, room.toPublicState());
      if (room.drawOpLog.length > 0) {
        socket.emit(EVENTS.DRAW_SNAPSHOT, { ops: room.drawOpLog });
      }
    }
  });

  socket.on(EVENTS.ROOM_READY, ({ ready } = {}) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = roomManager.get(roomCode);
    if (!room) return;
    const player = room.getPlayer(socket.id);
    if (!player) return;
    player.ready = Boolean(ready);
    io.to(roomCode).emit(EVENTS.ROOM_PLAYERS_UPDATED, room.publicPlayers());
  });

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    cleanup(socket.id);
    if (!roomCode) return;
    const room = roomManager.get(roomCode);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player) return;

    if (room.phase === 'lobby') {
      room.removePlayer(socket.id);
      io.to(roomCode).emit(EVENTS.ROOM_PLAYERS_UPDATED, room.publicPlayers());
      if (room.players.length === 0) roomManager.delete(roomCode);
      return;
    }

    // Game in progress: grace period
    player.status = 'disconnected';
    io.to(roomCode).emit(EVENTS.ROOM_PLAYERS_UPDATED, room.publicPlayers());

    player.reconnectTimer = setTimeout(() => {
      room.removePlayer(socket.id);
      io.to(roomCode).emit(EVENTS.ROOM_PLAYERS_UPDATED, room.publicPlayers());

      const activePlayers = room.players.filter(p => p.status === 'active');
      if (activePlayers.length < 2) {
        const { endGame } = require('../game/GameEngine');
        endGame(room, roomCode, io, roomManager);
      }

      if (room.players.length === 0) roomManager.delete(roomCode);
    }, 30000);
  });
};
