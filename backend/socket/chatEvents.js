const { EVENTS } = require('../constants/events');
const { isRateLimited } = require('../middleware/rateLimiter');
const { calcGuesserPoints } = require('../game/ScoreEngine');
const { endTurn } = require('../game/GameEngine');

module.exports = function chatEvents(socket, io, roomManager) {
  socket.on(EVENTS.CHAT_GUESS, ({ text } = {}) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = roomManager.get(roomCode);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player || player.isMuted) return;
    if (isRateLimited(socket.id)) return;

    const sanitized = String(text || '').trim().substring(0, 150);
    if (!sanitized) return;

    const drawer = room.getCurrentDrawer();
    const isDrawer = drawer && drawer.id === socket.id;

    // Drawer cannot type guesses during drawing
    if (room.phase === 'drawing' && isDrawer) return;

    const alreadyGuessed = room.guessedPlayers.has(socket.id);
    const isDrawing = room.phase === 'drawing';

    if (isDrawing && !alreadyGuessed && room.currentWord) {
      const correct = sanitized.toLowerCase() === room.currentWord.toLowerCase();
      if (correct) {
        const position = room.guessedPlayers.size;
        const points = calcGuesserPoints(room.settings.drawTime, room.timeRemaining, position);
        player.points += points;
        room.guessedPlayers.add(socket.id);

        io.to(roomCode).emit(EVENTS.CHAT_CORRECT_GUESS, {
          player: room.sanitizePlayer(player),
          points,
          position,
        });
        io.to(roomCode).emit(EVENTS.SCORE_UPDATE, { players: room.publicPlayers() });

        const totalGuessers = room.players.filter(p => drawer ? p.id !== drawer.id : true).length;
        if (room.guessedPlayers.size >= totalGuessers) {
          endTurn(room, roomCode, io, roomManager);
        }
        return;
      }
    }

    // Players who already guessed correctly see their own chat but others don't see their word leaks
    // Broadcast regular message to everyone in room
    io.to(roomCode).emit(EVENTS.CHAT_MESSAGE, {
      player: { id: player.id, name: player.name },
      text: sanitized,
    });
  });
};
