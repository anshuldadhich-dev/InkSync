const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingTimeout: 60000,
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

const __dirname1 = path.resolve();
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname1, './frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname1, 'frontend', 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('InkSync API running'));
}

// ── Word bank ─────────────────────────────────────────────────────────────────

const WORDS = [
  'apple', 'guitar', 'elephant', 'pizza', 'ocean', 'rainbow', 'castle', 'dragon',
  'astronaut', 'bicycle', 'volcano', 'lighthouse', 'penguin', 'tornado', 'submarine',
  'waterfall', 'diamond', 'umbrella', 'cactus', 'butterfly', 'ladder', 'clock', 'bridge',
  'robot', 'treasure', 'mushroom', 'compass', 'lantern', 'hammer', 'crown',
  'snowflake', 'firework', 'anchor', 'candle', 'telescope', 'balloon', 'magnet',
  'porcupine', 'jellyfish', 'skyscraper', 'pyramid', 'boomerang', 'pretzel',
  'igloo', 'sphinx', 'mitten', 'trophy', 'windmill', 'binoculars', 'helicopter',
  'sandwich', 'sunflower', 'basketball', 'strawberry', 'handshake', 'watermelon',
  'skateboard', 'lightning', 'parachute', 'flamingo', 'ninja', 'pirate', 'mermaid',
];

function pickWordChoices(n = 3) {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function makeHint(word) {
  return word.split('').map(c => (c === ' ' ? ' ' : '_')).join('');
}

function revealOneChar(hint, word) {
  const hiddenIndices = [];
  for (let i = 0; i < hint.length; i++) {
    if (hint[i] === '_') hiddenIndices.push(i);
  }
  if (hiddenIndices.length === 0) return hint;
  const idx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
  const chars = hint.split('');
  chars[idx] = word[idx];
  return chars.join('');
}

function calcPoints(timeRemaining, drawTime) {
  return Math.max(50, Math.round(100 + (timeRemaining / drawTime) * 400));
}

// ── Per-room state ────────────────────────────────────────────────────────────

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

// rooms[code] = { code, players, settings, phase, round, drawerIndex, word, hint,
//                 drawOps, timeRemaining, isLocked, playersGuessed,
//                 tickInterval, hintInterval, wordChoiceTimeout }
const rooms = {};

function getRoom(code) { return rooms[code]; }

function createRoom(code) {
  rooms[code] = {
    code,
    players: [],
    settings: { ...DEFAULT_SETTINGS },
    phase: 'lobby',
    round: 0,
    drawerIndex: -1,
    word: null,
    hint: null,
    drawOps: [],
    timeRemaining: 0,
    isLocked: false,
    playersGuessed: new Set(),
    tickInterval: null,
    hintInterval: null,
    wordChoiceTimeout: null,
  };
  return rooms[code];
}

function clearTimers(room) {
  if (room.tickInterval)      { clearInterval(room.tickInterval);     room.tickInterval = null; }
  if (room.hintInterval)      { clearInterval(room.hintInterval);     room.hintInterval = null; }
  if (room.wordChoiceTimeout) { clearTimeout(room.wordChoiceTimeout); room.wordChoiceTimeout = null; }
}

function clearReconnectTimer(room, socketId) {
  if (room.reconnectTimers?.[socketId]) {
    clearTimeout(room.reconnectTimers[socketId]);
    delete room.reconnectTimers[socketId];
  }
}

function activePlayers(room) {
  return room.players.filter(p => p.status === 'active');
}

function currentDrawer(room) {
  const active = activePlayers(room);
  if (!active.length) return null;
  return active[room.drawerIndex % active.length];
}

// ── Game flow ─────────────────────────────────────────────────────────────────

function startTurn(room) {
  clearTimers(room);
  room.word = null;
  room.hint = null;
  room.drawOps = [];
  room.playersGuessed = new Set();
  room.phase = 'choosing';

  const active = activePlayers(room);
  if (active.length === 0) return endGame(room);

  room.drawerIndex = (room.drawerIndex + 1) % active.length;
  const drawer = active[room.drawerIndex];

  io.to(room.code).emit('turn:start', {
    drawer: { id: drawer.id, name: drawer.name, avatar: drawer.avatar },
  });

  const choices = pickWordChoices(3);

  const drawerSocket = io.sockets.sockets.get(drawer.id);
  if (drawerSocket) drawerSocket.emit('turn:word-choices', choices);

  room.wordChoiceTimeout = setTimeout(() => {
    if (room.phase === 'choosing' && !room.word) {
      startDrawing(room, choices[0]);
    }
  }, 15000);
}

function startDrawing(room, word) {
  if (room.wordChoiceTimeout) { clearTimeout(room.wordChoiceTimeout); room.wordChoiceTimeout = null; }
  room.word = word;
  room.hint = makeHint(word);
  room.phase = 'drawing';
  room.timeRemaining = room.settings.drawTime;

  io.to(room.code).emit('turn:drawing-start', {
    hint: room.hint,
    wordLength: word.length,
    drawTime: room.settings.drawTime,
  });

  room.tickInterval = setInterval(() => {
    room.timeRemaining -= 1;
    io.to(room.code).emit('turn:tick', { remaining: room.timeRemaining });
    if (room.timeRemaining <= 0) endTurn(room);
  }, 1000);

  const hintEvery = Math.floor(room.settings.drawTime / 4);
  let hintsFired = 0;
  room.hintInterval = setInterval(() => {
    hintsFired++;
    if (hintsFired >= 3) { clearInterval(room.hintInterval); room.hintInterval = null; return; }
    room.hint = revealOneChar(room.hint, room.word);
    io.to(room.code).emit('turn:hint', { hint: room.hint });
  }, hintEvery * 1000);
}

function endTurn(room) {
  clearTimers(room);
  room.phase = 'turn-end';

  io.to(room.code).emit('turn:end', {
    word: room.word,
    scores: room.players.map(p => ({ ...p, playersGuessed: undefined })),
  });

  setTimeout(() => advanceGame(room), 4000);
}

function advanceGame(room) {
  const active = activePlayers(room);
  if (active.length === 0) return endGame(room);

  const nextIndex = (room.drawerIndex + 1) % active.length;

  if (nextIndex === 0) {
    // All active players have drawn this round
    if (room.round >= room.settings.rounds) {
      endGame(room);
    } else {
      room.round++;
      room.phase = 'round-end';
      room.drawerIndex = -1;
      io.to(room.code).emit('round:end', {
        scores: room.players.map(p => ({ ...p })),
      });
      setTimeout(() => {
        io.to(room.code).emit('round:start', { round: room.round, total: room.settings.rounds });
        startTurn(room);
      }, 3000);
    }
  } else {
    startTurn(room);
  }
}

function endGame(room) {
  clearTimers(room);
  room.phase = 'game-end';
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  io.to(room.code).emit('game:end', {
    winner: sorted[0] ? { id: sorted[0].id, name: sorted[0].name, score: sorted[0].score } : null,
    finalScores: sorted,
  });

  // Reset room to lobby after 15s
  setTimeout(() => {
    if (!rooms[room.code]) return;
    room.phase = 'lobby';
    room.round = 0;
    room.drawerIndex = -1;
    room.word = null;
    room.hint = null;
    room.drawOps = [];
    room.playersGuessed = new Set();
    room.players.forEach(p => { p.score = 0; p.ready = false; });
    io.to(room.code).emit('room:players-updated', room.players);
  }, 15000);
}

// ── Socket.io handlers ────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  socket.on('room:join', ({ username, avatar, roomCode, isCreating }) => {
    if (!roomCode || !username) return;

    let room = getRoom(roomCode);
    if (!room) room = createRoom(roomCode);

    if (room.isLocked)                                  { socket.emit('room:locked');           return; }
    if (room.players.length >= room.settings.maxPlayers) { socket.emit('room:full');             return; }
    if (room.phase !== 'lobby')                          { socket.emit('room:game-in-progress'); return; }

    // Rejoin if already present (same socket ID = recovery, or disconnected player with same name)
    const existing = room.players.find(
      p => p.id === socket.id || (p.name === username && p.status === 'disconnected')
    );
    if (existing) {
      // Cancel the grace-period removal timer so they aren't evicted
      clearReconnectTimer(room, existing.id);
      existing.id = socket.id;
      existing.avatar = avatar;
      existing.status = 'active';
    } else {
      // Creator always gets host (even if a joiner snuck in first due to timing).
      // Normal joiner: first in room is host.
      if (isCreating) {
        room.players.forEach(p => { p.isHost = false; });
      }
      const isHost = isCreating || room.players.length === 0;
      room.players.push({
        id: socket.id,
        name: username,
        avatar,
        score: 0,
        ready: false,
        isHost,
        isMuted: false,
        status: 'active',
      });
    }

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    // Send full room state to the joining player
    socket.emit('room:state', {
      players: room.players,
      settings: room.settings,
      phase: room.phase,
      round: room.round,
      totalRounds: room.settings.rounds,
      isLocked: room.isLocked,
    });

    // Notify everyone of updated player list
    io.to(roomCode).emit('room:players-updated', room.players);
    console.log(`[join] ${username} → room ${roomCode} (${room.players.length} players)`);
  });

  socket.on('room:ready', ({ ready }) => {
    const room = getRoom(socket.data.roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = !!ready;
      console.log(`[ready] ${player.name} ready=${player.ready} room=${room.code}`);
      io.to(room.code).emit('room:players-updated', room.players);
    }
  });

  socket.on('host:start-game', () => {
    const room = getRoom(socket.data.roomCode);
    if (!room) return;
    const host = room.players.find(p => p.id === socket.id);
    if (!host?.isHost) return;
    if (activePlayers(room).length < 2) return;

    room.players.forEach(p => { p.score = 0; p.ready = false; });
    room.round = 1;
    room.drawerIndex = -1;

    io.to(room.code).emit('game:started', {
      players: room.players,
      settings: room.settings,
    });
    io.to(room.code).emit('round:start', { round: 1, total: room.settings.rounds });

    setTimeout(() => startTurn(room), 800);
  });

  socket.on('host:end-game', () => {
    const room = getRoom(socket.data.roomCode);
    if (!room) return;
    const host = room.players.find(p => p.id === socket.id);
    if (!host?.isHost) return;
    endGame(room);
  });

  socket.on('host:lock-room', ({ locked }) => {
    const room = getRoom(socket.data.roomCode);
    if (!room) return;
    const host = room.players.find(p => p.id === socket.id);
    if (!host?.isHost) return;
    room.isLocked = !!locked;
    io.to(room.code).emit('room:settings-updated', {
      settings: room.settings,
      isLocked: room.isLocked,
    });
  });

  socket.on('host:update-settings', (payload) => {
    const room = getRoom(socket.data.roomCode);
    if (!room) return;
    const host = room.players.find(p => p.id === socket.id);
    if (!host?.isHost) return;
    const newSettings = payload?.settings ?? payload;
    Object.assign(room.settings, newSettings);
    io.to(room.code).emit('room:settings-updated', {
      settings: room.settings,
      isLocked: room.isLocked,
    });
  });

  socket.on('host:kick', ({ playerId }) => {
    const room = getRoom(socket.data.roomCode);
    if (!room) return;
    const host = room.players.find(p => p.id === socket.id);
    if (!host?.isHost) return;
    const kicked = io.sockets.sockets.get(playerId);
    if (kicked) kicked.emit('room:kicked');
    room.players = room.players.filter(p => p.id !== playerId);
    io.to(room.code).emit('room:players-updated', room.players);
  });

  socket.on('host:transfer', ({ playerId }) => {
    const room = getRoom(socket.data.roomCode);
    if (!room) return;
    const oldHost = room.players.find(p => p.id === socket.id);
    if (!oldHost?.isHost) return;
    const newHost = room.players.find(p => p.id === playerId);
    if (!newHost) return;
    oldHost.isHost = false;
    newHost.isHost = true;
    io.to(room.code).emit('room:host-changed', { hostId: newHost.id });
    io.to(room.code).emit('room:players-updated', room.players);
  });

  socket.on('turn:word-selected', ({ word }) => {
    const room = getRoom(socket.data.roomCode);
    if (!room || room.phase !== 'choosing') return;
    const drawer = currentDrawer(room);
    if (!drawer || drawer.id !== socket.id) return;
    startDrawing(room, word);
  });

  socket.on('chat:guess', ({ text }) => {
    const room = getRoom(socket.data.roomCode);
    if (!room || room.phase !== 'drawing') return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.status !== 'active') return;

    const drawer = currentDrawer(room);
    if (drawer?.id === socket.id) return; // drawer cannot guess
    if (room.playersGuessed.has(socket.id)) return; // already guessed correctly

    const correct = room.word && text.toLowerCase().trim() === room.word.toLowerCase().trim();

    if (correct) {
      room.playersGuessed.add(socket.id);
      const pts = calcPoints(room.timeRemaining, room.settings.drawTime);
      player.score += pts;
      if (drawer) drawer.score += Math.max(10, Math.round(pts * 0.3));

      io.to(room.code).emit('chat:correct-guess', {
        player: { id: player.id, name: player.name },
        points: pts,
      });
      io.to(room.code).emit('score:update', { players: room.players });

      const nonDrawerActive = activePlayers(room).filter(p => p.id !== drawer?.id);
      if (nonDrawerActive.length > 0 && nonDrawerActive.every(p => room.playersGuessed.has(p.id))) {
        endTurn(room);
      }
    } else {
      io.to(room.code).emit('chat:message', {
        player: { id: player.id, name: player.name },
        text,
      });
    }
  });

  socket.on('draw:op', (op) => {
    const room = getRoom(socket.data.roomCode);
    if (!room) return;
    room.drawOps.push(op);
    socket.to(room.code).emit('draw:op', op);
  });

  socket.on('draw:undo', () => {
    const room = getRoom(socket.data.roomCode);
    if (!room) return;
    if (room.drawOps.length > 0) room.drawOps.pop();
    socket.to(room.code).emit('draw:undo', { ops: room.drawOps });
  });

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = getRoom(roomCode);
    if (!room) return;

    console.log(`[disconnect] ${socket.id} from room ${roomCode}`);

    // Capture host status BEFORE modifying the array
    const disconnectingPlayer = room.players.find(p => p.id === socket.id);
    if (!disconnectingPlayer) return;
    const wasHost = !!disconnectingPlayer.isHost;

    // Mark as disconnected (same behaviour in lobby and in-game)
    disconnectingPlayer.status = 'disconnected';
    io.to(roomCode).emit('room:players-updated', room.players);

    // Grace-period: remove the player after 10 s if they haven't reconnected
    room.reconnectTimers = room.reconnectTimers || {};
    room.reconnectTimers[socket.id] = setTimeout(() => {
      room.players = room.players.filter(p => p.id !== socket.id);
      delete room.reconnectTimers[socket.id];

      // Reassign host if host left
      if (wasHost || room.players.every(p => !p.isHost)) {
        const nextHost = activePlayers(room)[0];
        if (nextHost) {
          nextHost.isHost = true;
          io.to(roomCode).emit('room:host-changed', { hostId: nextHost.id });
        }
      }

      io.to(roomCode).emit('room:players-updated', room.players);

      // If no active players remain, clean up
      if (activePlayers(room).length === 0) {
        clearTimers(room);
        delete rooms[roomCode];
        console.log(`[cleanup] room ${roomCode} removed`);
      }
    }, 10000);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`InkSync server listening on port ${PORT}`));
