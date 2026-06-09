import React, { useState, useEffect } from "react";
import "../App.css";
import { useNavigate, useSearchParams } from "react-router-dom";

const AVATAR_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function HomeScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode,      setMode]      = useState("create"); // 'create' | 'join'
  const [username,  setUsername]  = useState("");
  const [language,  setLanguage]  = useState("en");
  const [color,     setColor]     = useState(AVATAR_COLORS[0]);
  const [roomCode,  setRoomCode]  = useState(() => makeCode());
  const [joinCode,  setJoinCode]  = useState("");
  const [error,     setError]     = useState("");
  const [copied,    setCopied]    = useState(false);

  // Pre-fill room code from share link (?room=ABC123)
  useEffect(() => {
    const shared = searchParams.get('room');
    if (shared) {
      setMode('join');
      setJoinCode(shared.toUpperCase().slice(0, 6));
    }
  }, []);

  const initial = username.trim() ? username.trim()[0].toUpperCase() : "?";

  const switchMode = (next) => {
    setError("");
    setMode(next);
    if (next === "create" && !roomCode) setRoomCode(makeCode());
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = () => {
    const code = mode === "create" ? roomCode : joinCode.trim().toUpperCase();
    if (!username.trim()) { setError("Please enter your name."); return; }
    if (!code)            { setError(mode === "join" ? "Please enter a room code." : "Room code missing."); return; }
    setError("");
    localStorage.setItem("username", username.trim());
    navigate("/play", {
      state: {
        username: username.trim(),
        avatar:   color,
        roomCode: code,
        language,
        isCreating: mode === 'create',
      },
    });
  };

  return (
    <div className="lobby-page">
      <div className="lobby-card">

        {/* Header */}
        <div className="lobby-header">
          <div className="lobby-logo-icon"><PenIcon /></div>
          <div>
            <div className="lobby-title">InkSync</div>
            <div className="lobby-tagline">Draw. Guess. Have fun.</div>
          </div>
        </div>

        {/* Body */}
        <div className="lobby-body">

          {/* Avatar */}
          <div className="avatar-section">
            <div className="avatar-circle lg" style={{ background: color }}>
              {initial}
            </div>
            <div className="avatar-colors">
              {AVATAR_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-dot${color === c ? " active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Name + Language */}
          <div className="field-group">
            <div className="field">
              <label htmlFor="name-input">Your Name</label>
              <input
                id="name-input"
                className="field-input"
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoComplete="off"
                autoFocus
              />
            </div>
            <div className="field" style={{ maxWidth: 130 }}>
              <label htmlFor="lang-select">Language</label>
              <select
                id="lang-select"
                className="field-input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
              </select>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="room-tabs">
            <button
              className={`room-tab${mode === "create" ? " active" : ""}`}
              onClick={() => switchMode("create")}
            >
              Create Room
            </button>
            <button
              className={`room-tab${mode === "join" ? " active" : ""}`}
              onClick={() => switchMode("join")}
            >
              Join Room
            </button>
          </div>

          {/* Create mode */}
          {mode === "create" && (
            <div className="create-room-box">
              <div className="create-room-label">Your room code — share this to invite players</div>
              <div className="code-display-row">
                <span className="generated-code">{roomCode}</span>
                <button
                  className="code-action-btn"
                  onClick={handleCopy}
                  title="Copy code"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  className="code-action-btn"
                  onClick={() => setRoomCode(makeCode())}
                  title="Generate new code"
                >
                  <RefreshIcon />
                  New
                </button>
              </div>
            </div>
          )}

          {/* Join mode */}
          {mode === "join" && (
            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="join-input">Room Code</label>
              <input
                id="join-input"
                className="field-input room-input-mono"
                type="text"
                placeholder="e.g. A1B2C3"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                maxLength={6}
                autoComplete="off"
              />
            </div>
          )}

          {/* Error */}
          {error && <p className="field-error">{error}</p>}

          {/* Play button */}
          <button className="play-btn" onClick={handleSubmit}>
            <PlayIcon />
            {mode === "create" ? "Create & Play" : "Join & Play"}
          </button>
        </div>
      </div>
    </div>
  );
}
