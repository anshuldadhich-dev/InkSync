class Room {
  constructor(code) {
    this.code = code;
    this.players = [];
    this.settings = {
      rounds: 3,
      drawTime: 80,
      maxPlayers: 8,
      language: 'en',
      difficulty: 'normal',
      isPrivate: false,
      allowSpectators: true,
      customWords: [],
    };
    this.phase = 'lobby'; // lobby | choosing | drawing | turn-end | game-end
    this.turn = 0;        // absolute 0-based turn index
    this.round = 0;       // current 1-based round (0 = not started)
    this.drawerIndex = 0;
    this.currentWord = null;
    this.currentHint = null;
    this.wordChoices = null;
    this.guessedPlayers = new Set();
    this.drawOpLog = [];
    this.tickInterval = null;
    this.hintTimers = [];
    this.chooseTimer = null;
    this.timeRemaining = 0;
    this.isLocked = false;
  }

  getHost() {
    return this.players.find(p => p.isHost) || null;
  }

  addPlayer(data) {
    const player = {
      id: data.id,
      name: data.name,
      avatar: data.avatar,
      points: 0,
      isHost: this.players.length === 0,
      isMuted: false,
      ready: false,
      status: 'active',
      reconnectTimer: null,
    };
    this.players.push(player);
    return player;
  }

  removePlayer(socketId) {
    const idx = this.players.findIndex(p => p.id === socketId);
    if (idx === -1) return null;
    const [removed] = this.players.splice(idx, 1);
    if (removed.isHost && this.players.length > 0) {
      this.players[0].isHost = true;
    }
    return removed;
  }

  getPlayer(socketId) {
    return this.players.find(p => p.id === socketId) || null;
  }

  getCurrentDrawer() {
    if (this.players.length === 0) return null;
    return this.players[this.drawerIndex % this.players.length] || null;
  }

  getTotalTurns() {
    return this.settings.rounds * this.players.length;
  }

  isGameOver() {
    return this.turn >= this.getTotalTurns();
  }

  isRoundBoundary() {
    return this.turn > 0 && this.turn % this.players.length === 0;
  }

  getCurrentRound() {
    if (this.players.length === 0) return 1;
    return Math.floor(this.turn / this.players.length) + 1;
  }

  clearTimers() {
    if (this.tickInterval) { clearInterval(this.tickInterval); this.tickInterval = null; }
    if (this.chooseTimer) { clearTimeout(this.chooseTimer); this.chooseTimer = null; }
    this.hintTimers.forEach(t => clearTimeout(t));
    this.hintTimers = [];
  }

  sanitizePlayer(p) {
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      points: p.points,
      isHost: p.isHost,
      isMuted: p.isMuted,
      ready: p.ready,
      status: p.status,
    };
  }

  publicPlayers() {
    return this.players.map(p => this.sanitizePlayer(p));
  }

  toPublicState() {
    const drawer = this.getCurrentDrawer();
    return {
      code: this.code,
      players: this.publicPlayers(),
      settings: this.settings,
      phase: this.phase,
      round: this.getCurrentRound(),
      totalRounds: this.settings.rounds,
      isLocked: this.isLocked,
      currentDrawer: drawer ? { id: drawer.id, name: drawer.name } : null,
      timeRemaining: this.timeRemaining,
      wordHint: this.currentHint,
      wordLength: this.currentWord ? this.currentWord.length : 0,
    };
  }
}

module.exports = Room;
