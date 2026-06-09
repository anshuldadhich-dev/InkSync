const { EVENTS } = require('../constants/events');
const { calcDrawerPoints } = require('./ScoreEngine');

const WORD_BANKS = {
  en: require('../words/en'),
};

function getWordBank(language) {
  return WORD_BANKS[language] || WORD_BANKS.en;
}

function getRandomWords(language, count = 3) {
  const bank = getWordBank(language);
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildHintReveal(word, revealedIndices) {
  return word
    .split('')
    .map((ch, i) => {
      if (ch === ' ') return ' ';
      return revealedIndices.includes(i) ? ch : '_';
    })
    .join(' ');
}

function scheduleHints(room, roomCode, io) {
  const word = room.currentWord;
  const eligibleIdxs = word
    .split('')
    .reduce((acc, ch, i) => { if (ch !== ' ') acc.push(i); return acc; }, [])
    .sort(() => Math.random() - 0.5);

  const revealPerHint = Math.max(1, Math.floor(eligibleIdxs.length / 3));
  const revealed = [];

  [0.35, 0.65].forEach((ratio, i) => {
    const delay = Math.floor(room.settings.drawTime * ratio * 1000);
    const timer = setTimeout(() => {
      if (room.phase !== 'drawing') return;
      const batch = eligibleIdxs.splice(0, revealPerHint);
      revealed.push(...batch);
      room.currentHint = buildHintReveal(word, revealed);
      room.players.forEach(p => {
        if (!room.getCurrentDrawer() || p.id !== room.getCurrentDrawer().id) {
          io.to(p.id).emit(EVENTS.TURN_HINT, { hint: room.currentHint });
        }
      });
    }, delay);
    room.hintTimers.push(timer);
  });
}

function startTurn(room, roomCode, io, roomManager) {
  if (!room || room.players.length === 0) return;

  if (room.isGameOver()) {
    endGame(room, roomCode, io, roomManager);
    return;
  }

  room.drawerIndex = room.turn % room.players.length;

  const newRound = room.getCurrentRound();
  if (room.round !== newRound) {
    room.round = newRound;
    io.to(roomCode).emit(EVENTS.ROUND_START, {
      round: newRound,
      total: room.settings.rounds,
    });
  }

  const drawer = room.getCurrentDrawer();
  if (!drawer) { endGame(room, roomCode, io, roomManager); return; }

  room.phase = 'choosing';
  room.guessedPlayers.clear();
  room.drawOpLog = [];
  room.currentWord = null;
  room.currentHint = null;

  const sources = room.settings.customWords.length > 0
    ? [...getWordBank(room.settings.language), ...room.settings.customWords]
    : getWordBank(room.settings.language);
  const shuffled = [...sources].sort(() => Math.random() - 0.5);
  room.wordChoices = shuffled.slice(0, 3);

  io.to(roomCode).emit(EVENTS.TURN_START, {
    drawer: { id: drawer.id, name: drawer.name },
    round: room.round,
    turn: room.turn,
  });

  io.to(drawer.id).emit(EVENTS.TURN_WORD_CHOICES, room.wordChoices);

  io.to(roomCode).emit(EVENTS.TURN_CHOOSING, {
    drawer: { id: drawer.id, name: drawer.name },
    timeout: 15000,
  });

  room.chooseTimer = setTimeout(() => {
    if (room.phase === 'choosing' && !room.currentWord) {
      selectWord(room, roomCode, io, roomManager, room.wordChoices[0]);
    }
  }, 15000);
}

function selectWord(room, roomCode, io, roomManager, word) {
  if (room.chooseTimer) { clearTimeout(room.chooseTimer); room.chooseTimer = null; }

  room.currentWord = word;
  room.phase = 'drawing';
  room.currentHint = word.split('').map(c => c === ' ' ? ' ' : '_').join(' ');
  room.timeRemaining = room.settings.drawTime;

  const drawer = room.getCurrentDrawer();

  io.to(roomCode).emit(EVENTS.TURN_DRAWING_START, {
    drawer: drawer ? { id: drawer.id, name: drawer.name } : null,
    wordLength: word.length,
    hint: room.currentHint,
    drawTime: room.settings.drawTime,
  });

  scheduleHints(room, roomCode, io);

  room.tickInterval = setInterval(() => {
    room.timeRemaining = Math.max(0, room.timeRemaining - 1);
    io.to(roomCode).emit(EVENTS.TURN_TICK, { remaining: room.timeRemaining });
    if (room.timeRemaining <= 0) {
      clearInterval(room.tickInterval);
      room.tickInterval = null;
      endTurn(room, roomCode, io, roomManager);
    }
  }, 1000);
}

function endTurn(room, roomCode, io, roomManager) {
  if (room.phase === 'turn-end' || room.phase === 'lobby' || room.phase === 'game-end') return;

  room.clearTimers();
  room.phase = 'turn-end';

  const drawer = room.getCurrentDrawer();
  const totalGuessers = room.players.filter(p => drawer ? p.id !== drawer.id : true).length;
  const drawerPoints = calcDrawerPoints(room.guessedPlayers.size, totalGuessers);

  if (drawer) drawer.points += drawerPoints;

  io.to(roomCode).emit(EVENTS.TURN_END, {
    word: room.currentWord,
    drawer: drawer ? { id: drawer.id, name: drawer.name } : null,
    drawerPoints,
    scores: room.publicPlayers(),
  });

  setTimeout(() => {
    room.turn++;
    room.drawerIndex = room.turn % room.players.length;

    if (room.isGameOver()) {
      endGame(room, roomCode, io, roomManager);
      return;
    }

    if (room.isRoundBoundary()) {
      const completedRound = room.turn / room.players.length;
      io.to(roomCode).emit(EVENTS.ROUND_END, {
        round: completedRound,
        scores: room.publicPlayers(),
      });
      setTimeout(() => startTurn(room, roomCode, io, roomManager), 4000);
    } else {
      startTurn(room, roomCode, io, roomManager);
    }
  }, 4000);
}

function endGame(room, roomCode, io, roomManager) {
  room.clearTimers();
  room.phase = 'game-end';

  const finalScores = [...room.players]
    .sort((a, b) => b.points - a.points)
    .map(p => room.sanitizePlayer(p));

  io.to(roomCode).emit(EVENTS.GAME_END, {
    winner: finalScores[0] || null,
    finalScores,
  });

  // Return to lobby after 12 seconds
  setTimeout(() => {
    room.phase = 'lobby';
    room.turn = 0;
    room.round = 0;
    room.drawerIndex = 0;
    room.currentWord = null;
    room.currentHint = null;
    room.guessedPlayers.clear();
    room.drawOpLog = [];
    room.players.forEach(p => { p.points = 0; p.ready = false; });
    io.to(roomCode).emit(EVENTS.ROOM_STATE, room.toPublicState());
  }, 12000);
}

module.exports = { startTurn, selectWord, endTurn, endGame };
