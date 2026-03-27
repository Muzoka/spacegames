/* ═══════════════════════════════════════
   SPACEGAMES - Main Client Application
   ═══════════════════════════════════════ */

window.SpaceGames = (() => {
  // ─── State ───
  let socket = null;
  let playerId = null;
  let playerName = localStorage.getItem('sg_playerName') || '';
  let playerAvatar = localStorage.getItem('sg_avatar') || '😎';
  let playerLevel = 1;
  let playerProfile = null;
  let currentRoom = null;
  let isAdmin = false;
  let soundEnabled = localStorage.getItem('sg_sound') !== 'off';
  let lastGameType = null;
  const registeredGames = {};

  // ─── Game Registry ───
  const gameInfo = {
    tictactoe:    { name: 'Tic Tac Toe',    icon: '❌⭕', desc: 'Classic 3x3 grid', min: 2, max: 2, category: 'Strategy' },
    connect4:     { name: 'Connect Four',    icon: '🔴🟡', desc: 'Get 4 in a row',   min: 2, max: 2, category: 'Strategy' },
    chess:        { name: 'Chess',           icon: '♟️♚',  desc: 'The king of games', min: 2, max: 2, category: 'Strategy' },
    rps:          { name: 'Rock Paper Scissors', icon: '🪨📄✂️', desc: 'Best of 5 showdown', min: 2, max: 2, category: 'Quick' },
    trivia:       { name: 'Trivia Battle',   icon: '🧠🎯', desc: '10 questions, be fastest', min: 2, max: 20, category: 'Knowledge' },
    wordscramble: { name: 'Word Scramble',   icon: '🔤🔀', desc: 'Unscramble the word', min: 2, max: 20, category: 'Word' },
    emojiguess:   { name: 'Emoji Guess',     icon: '😎🤔', desc: 'Decode the emojis',  min: 2, max: 20, category: 'Fun' },
    hangman:      { name: 'Hangman',         icon: '🪢💀', desc: 'Guess the word',     min: 2, max: 20, category: 'Word' },
    fastmath:     { name: 'Fast Math',       icon: '🔢⚡', desc: 'Speed arithmetic',   min: 2, max: 20, category: 'Speed' }
  };

  // ─── Sound Effects System ───
  const audioCtx = typeof AudioContext !== 'undefined' ? new AudioContext() : null;

  function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.15;
    const now = audioCtx.currentTime;
    switch (type) {
      case 'move': osc.frequency.value = 600; osc.type = 'sine'; gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); osc.start(now); osc.stop(now + 0.1); break;
      case 'win': osc.type = 'square'; osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.1); osc.frequency.setValueAtTime(784, now + 0.2); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4); osc.start(now); osc.stop(now + 0.4); break;
      case 'lose': osc.type = 'sawtooth'; gain.gain.value = 0.1; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(200, now + 0.3); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4); osc.start(now); osc.stop(now + 0.4); break;
      case 'tick': osc.frequency.value = 800; osc.type = 'sine'; gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05); osc.start(now); osc.stop(now + 0.05); break;
      case 'join': osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(600, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2); osc.start(now); osc.stop(now + 0.2); break;
      case 'achievement': osc.type = 'square'; gain.gain.value = 0.12; osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.15); osc.frequency.setValueAtTime(784, now + 0.3); osc.frequency.setValueAtTime(1047, now + 0.45); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7); osc.start(now); osc.stop(now + 0.7); break;
      default: osc.frequency.value = 500; osc.type = 'sine'; gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); osc.start(now); osc.stop(now + 0.1);
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('sg_sound', soundEnabled ? 'on' : 'off');
    document.getElementById('sound-toggle').textContent = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled) playSound('join');
  }

  // ─── Confetti ───
  function fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#f97316'];
    for (let i = 0; i < 120; i++) {
      particles.push({ x: Math.random() * canvas.width, y: -20, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 4 + 2, size: Math.random() * 8 + 3, color: colors[Math.floor(Math.random() * colors.length)], rotation: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 10 });
    }
    let frame = 0;
    function animate() {
      if (frame > 120) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rotation += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      frame++;
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ─── Initialize ───
  function init() {
    socket = io();
    setupSocketListeners();
    renderHomeGames();
    handleHash();
    window.addEventListener('hashchange', handleHash);
    document.getElementById('sound-toggle').textContent = soundEnabled ? '🔊' : '🔇';
  }

  // ─── Navigation ───
  function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');
    const link = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (link) link.classList.add('active');

    if (page === 'leaderboard') loadLeaderboard('all');
  }

  function handleHash() {
    const hash = location.hash.slice(1);
    if (hash.startsWith('/room/')) {
      const code = hash.split('/')[2];
      if (code && !currentRoom) showJoinRoom(code);
    }
  }

  // ─── Room Management ───
  function showCreateRoom() {
    openModal('Create Room', `
      <div class="input-group">
        <label>Your Name</label>
        <input type="text" id="create-name" value="${playerName}" placeholder="Enter your name" maxlength="20">
      </div>
      <button onclick="SpaceGames.createRoom()" class="btn btn-primary btn-lg">🚀 Create Room</button>
    `);
    setTimeout(() => {
      const input = document.getElementById('create-name');
      if (input && !input.value) input.focus();
    }, 100);
  }

  function showJoinRoom(prefillCode) {
    openModal('Join Room', `
      <div class="input-group">
        <label>Room Code</label>
        <input type="text" id="join-code" value="${prefillCode || ''}" placeholder="XXXXXX" maxlength="6" style="text-transform:uppercase; text-align:center; font-size:1.3rem; letter-spacing:4px; font-family:var(--font-mono);">
      </div>
      <div class="input-group">
        <label>Your Name</label>
        <input type="text" id="join-name" value="${playerName}" placeholder="Enter your name" maxlength="20">
      </div>
      <button onclick="SpaceGames.joinRoom()" class="btn btn-primary btn-lg">🔗 Join Room</button>
    `);
    setTimeout(() => {
      const input = document.getElementById(prefillCode ? 'join-name' : 'join-code');
      if (input && !input.value) input.focus();
    }, 100);
  }

  function createRoom() {
    const name = document.getElementById('create-name').value.trim();
    if (!name) return toast('Please enter your name', 'error');
    playerName = name;
    localStorage.setItem('sg_playerName', name);

    socket.emit('create-room', { playerName: name }, (res) => {
      if (res.error) return toast(res.error, 'error');
      playerId = res.playerId;
      currentRoom = res.room;
      isAdmin = true;
      if (res.profile) { playerProfile = res.profile; playerAvatar = res.profile.avatar; playerLevel = res.profile.level; localStorage.setItem('sg_avatar', playerAvatar); }
      closeModal();
      enterRoom();
      playSound('join');
    });
  }

  function joinRoom() {
    const code = document.getElementById('join-code').value.trim().toUpperCase();
    const name = document.getElementById('join-name').value.trim();
    if (!code) return toast('Please enter room code', 'error');
    if (!name) return toast('Please enter your name', 'error');
    playerName = name;
    localStorage.setItem('sg_playerName', name);

    socket.emit('join-room', { roomCode: code, playerName: name }, (res) => {
      if (res.error) return toast(res.error, 'error');
      playerId = res.playerId;
      currentRoom = res.room;
      isAdmin = currentRoom.admin === playerId;
      if (res.profile) { playerProfile = res.profile; playerAvatar = res.profile.avatar; playerLevel = res.profile.level; localStorage.setItem('sg_avatar', playerAvatar); }
      closeModal();
      enterRoom();
      playSound('join');
    });
  }

  function enterRoom() {
    navigate('room');
    location.hash = '/room/' + currentRoom.code;
    document.getElementById('nav-user').style.display = 'flex';
    document.getElementById('nav-room-code').textContent = currentRoom.code;
    document.getElementById('nav-player-name').textContent = playerName;
    document.getElementById('nav-avatar').textContent = playerAvatar;
    const lvlEl = document.getElementById('nav-level');
    lvlEl.textContent = 'Lv.' + playerLevel;
    lvlEl.className = 'level-badge' + (playerLevel >= 10 ? ' elite' : playerLevel >= 5 ? ' high' : '');
    renderRoom();
  }

  function leaveRoom() {
    socket.emit('leave-room');
    currentRoom = null;
    isAdmin = false;
    playerId = null;
    document.getElementById('nav-user').style.display = 'none';
    location.hash = '';
    navigate('home');
  }

  function renderRoom() {
    if (!currentRoom) return;
    const r = currentRoom;

    document.getElementById('room-title').textContent = isAdmin ? 'Your Room' : 'Room';
    document.getElementById('room-code-big').textContent = r.code;
    document.getElementById('room-player-count').textContent = `${r.players.length} player${r.players.length > 1 ? 's' : ''}`;

    // Players
    const playersHtml = r.players.map(p => `
      <div class="player-tag ${p.id === r.admin ? 'admin' : ''}">
        <span class="pt-avatar">${p.avatar || '😎'}</span>
        <span>${escHtml(p.name)}</span>
        ${p.id === r.admin ? '<span class="admin-badge">ADMIN</span>' : ''}
        ${p.level ? '<span class="pt-level">Lv.' + p.level + '</span>' : ''}
        <span class="score-badge">${p.score} pts</span>
        ${p.id === playerId ? '<span style="color:var(--primary);font-size:0.7rem">(you)</span>' : ''}
        ${isAdmin && p.id !== playerId ? '<span class="pt-kick" onclick="SpaceGames.kickPlayer(\'' + p.id + '\')" title="Kick player">🚫</span>' : ''}
      </div>
    `).join('');
    document.getElementById('room-players').innerHTML = playersHtml;

    // Events section (vote/tournament) - admin only
    const specialSection = document.getElementById('room-special-section');
    if (specialSection) {
      document.getElementById('btn-create-vote').style.display = isAdmin ? '' : 'none';
      document.getElementById('btn-start-tournament').style.display = isAdmin ? '' : 'none';
      if (r.tournament) renderTournamentBracket(r.tournament, 'tournament-display');
    }

    // Games section (admin only)
    const gamesSection = document.getElementById('room-games-section');
    if (isAdmin) {
      gamesSection.style.display = '';
      const gamesHtml = Object.entries(gameInfo).map(([id, g]) => `
        <button class="mini-game-btn" onclick="SpaceGames.startGame('${id}')">
          <span class="mg-icon">${g.icon}</span>
          <span class="mg-name">${g.name}</span>
          <span class="mg-players">${g.min === g.max ? g.min : g.min + '-' + g.max} players</span>
        </button>
      `).join('');
      document.getElementById('room-games-grid').innerHTML = gamesHtml;
    } else {
      gamesSection.style.display = 'none';
    }

    // Debate section (admin only)
    const debateSection = document.getElementById('room-debate-section');
    if (isAdmin) {
      debateSection.style.display = '';
      if (r.debate) {
        document.getElementById('debate-controls').innerHTML = `
          <p style="margin-bottom:12px;color:var(--text-muted)">Active debate: <strong>${r.debate.topic}</strong></p>
          <button class="btn btn-primary" onclick="SpaceGames.openDebate()">Open Debate Dashboard</button>
        `;
      } else {
        document.getElementById('debate-controls').innerHTML = `
          <button class="btn btn-accent" onclick="SpaceGames.showCreateDebate()">Create Debate</button>
        `;
      }
    } else {
      if (r.debate) {
        debateSection.style.display = '';
        document.getElementById('debate-controls').innerHTML = `
          <p style="margin-bottom:12px;color:var(--text-muted)">Active debate: <strong>${r.debate.topic}</strong></p>
          <button class="btn btn-secondary" onclick="SpaceGames.openDebate()">View Debate Dashboard</button>
        `;
      } else {
        debateSection.style.display = 'none';
      }
    }
  }

  function copyRoomCode() {
    if (!currentRoom) return;
    const url = location.origin + '/#/room/' + currentRoom.code;
    navigator.clipboard.writeText(url).then(() => toast('Room link copied!', 'success')).catch(() => {
      navigator.clipboard.writeText(currentRoom.code).then(() => toast('Room code copied!', 'success'));
    });
  }

  // ─── Chat ───
  function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    socket.emit('chat-message', { message: msg });
    input.value = '';
  }

  function addChatMessage(data) {
    const el = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<span class="chat-name">${escHtml(data.playerName)}</span><span class="chat-text">${escHtml(data.message)}</span>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  function addSystemMessage(text) {
    const el = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg system';
    div.textContent = text;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  // ─── Reactions ───
  function sendReaction(emoji) {
    socket.emit('send-reaction', { emoji });
  }

  function showReaction(data) {
    const container = document.getElementById('reaction-container');
    const el = document.createElement('div');
    el.className = 'floating-reaction';
    el.textContent = data.emoji;
    el.style.left = (20 + Math.random() * 60) + '%';
    el.style.bottom = '10%';
    container.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  // ─── Games ───
  function registerGame(id, handler) {
    registeredGames[id] = handler;
  }

  function startGame(gameType) {
    if (!isAdmin || !currentRoom) return;
    const info = gameInfo[gameType];
    if (currentRoom.players.length < info.min) {
      return toast(`Need at least ${info.min} players for ${info.name}`, 'error');
    }
    socket.emit('start-game', { gameType });
  }

  function onGameStarted(data) {
    const { gameType, state, players, gamePlayers } = data;
    const info = gameInfo[gameType];
    if (!info) return;

    navigate('game');
    document.getElementById('game-title').textContent = info.icon + ' ' + info.name;

    const isPlayer = gamePlayers.includes(playerId);
    document.getElementById('game-spectator-bar').style.display = isPlayer ? 'none' : '';
    document.getElementById('btn-end-game').style.display = isAdmin ? '' : 'none';

    // Timer display
    const timerDisp = document.getElementById('game-timer-display');
    if (['trivia', 'wordscramble', 'emojiguess'].includes(gameType)) {
      timerDisp.style.display = 'flex';
    } else {
      timerDisp.style.display = 'none';
    }

    const container = document.getElementById('game-container');
    container.innerHTML = '';

    const handler = registeredGames[gameType];
    if (handler) {
      handler.init(container, { socket, playerId, playerName, isAdmin, gameState: state, players, gamePlayers, gameInfo: info });
    }
  }

  function onGameUpdate(data) {
    const handler = currentRoom && registeredGames[currentRoom.currentGame || ''];
    // We might be in game view even though room.currentGame was cleared
    const activeGame = document.getElementById('page-game').classList.contains('active');
    if (activeGame) {
      // Find the active handler by checking which game was initialized
      for (const [id, h] of Object.entries(registeredGames)) {
        if (h._active) { h.onUpdate(data); break; }
      }
    }
  }

  function onGameOver(data) {
    for (const [id, h] of Object.entries(registeredGames)) {
      if (h._active) { h._active = false; break; }
    }
    showGameOverScreen(data);
  }

  function showGameOverScreen(data) {
    const overlay = document.getElementById('game-over-overlay');
    overlay.style.display = 'flex';

    if (data.draw) {
      document.getElementById('game-over-icon').textContent = '🤝';
      document.getElementById('game-over-title').textContent = "It's a Draw!";
      document.getElementById('game-over-detail').textContent = 'Well played by both sides!';
      playSound('tick');
    } else if (data.winner === playerId) {
      document.getElementById('game-over-icon').textContent = '🏆';
      document.getElementById('game-over-title').textContent = 'You Win!';
      document.getElementById('game-over-detail').textContent = '+3 points, +30 XP';
      playSound('win');
      fireConfetti();
    } else {
      document.getElementById('game-over-icon').textContent = '😢';
      document.getElementById('game-over-title').textContent = (data.winnerName || 'Someone') + ' Wins!';
      document.getElementById('game-over-detail').textContent = 'Better luck next time!';
      playSound('lose');
    }

    // Rematch button (admin only, non-tournament)
    const rematchBtn = document.getElementById('btn-rematch');
    if (rematchBtn) rematchBtn.style.display = (isAdmin && !data.tournament) ? '' : 'none';

    // Scores for multi-player games
    let scoresHtml = '';
    if (data.scores) {
      const entries = Object.entries(data.scores).sort((a, b) => b[1] - a[1]);
      scoresHtml = entries.map(([pid, score]) => `
        <div class="gos-row">
          <span class="gos-name">${escHtml(data.playerNames[pid] || pid)}</span>
          <span class="gos-pts">${score} pts</span>
        </div>
      `).join('');
    }
    document.getElementById('game-over-scores').innerHTML = scoresHtml;
  }

  function dismissGameOver() {
    document.getElementById('game-over-overlay').style.display = 'none';
    backToRoom();
  }

  function endCurrentGame() {
    if (!isAdmin) return;
    socket.emit('end-game');
  }

  function backToRoom() {
    for (const [id, h] of Object.entries(registeredGames)) {
      if (h._active && h.destroy) { h.destroy(); h._active = false; }
    }
    navigate('room');
    renderRoom();
  }

  // ─── Debate ───
  function showCreateDebate() {
    const playerOptions = currentRoom.players.map(p =>
      `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.9rem;">
        <input type="checkbox" class="debate-participant-check" value="${p.id}" checked> ${escHtml(p.name)}
      </label>`
    ).join('');

    openModal('Create Debate', `
      <div class="input-group">
        <label>Topic</label>
        <input type="text" id="debate-topic-input" placeholder="What's the discussion about?" maxlength="100">
      </div>
      <div class="input-group">
        <label>Participants</label>
        <div style="max-height:150px;overflow-y:auto;padding:8px;background:var(--bg-2);border-radius:var(--radius-sm);">
          ${playerOptions}
        </div>
      </div>
      <div class="input-group">
        <label>Time Per Person (seconds)</label>
        <input type="number" id="debate-time-input" value="120" min="30" max="600">
      </div>
      <button onclick="SpaceGames.createDebate()" class="btn btn-accent btn-lg">⏱️ Create Debate</button>
    `);
  }

  function createDebate() {
    const topic = document.getElementById('debate-topic-input').value.trim() || 'Open Discussion';
    const timePerPerson = parseInt(document.getElementById('debate-time-input').value) || 120;
    const checks = document.querySelectorAll('.debate-participant-check:checked');
    const participants = Array.from(checks).map(c => c.value);

    if (participants.length < 2) return toast('Need at least 2 participants', 'error');

    socket.emit('create-debate', { topic, participants, timePerPerson });
    closeModal();
    toast('Debate created!', 'success');
  }

  function openDebate() {
    if (!currentRoom || !currentRoom.debate) return;
    navigate('debate');
    renderDebate(currentRoom.debate);
  }

  function renderDebate(debate) {
    if (!debate || !currentRoom) return;
    document.getElementById('debate-topic').textContent = '⏱️ ' + debate.topic;

    // Participants
    const participantsHtml = debate.participants.map(pid => {
      const player = currentRoom.players.find(p => p.id === pid);
      const name = player ? player.name : 'Unknown';
      const used = debate.timeUsed[pid] || 0;
      const total = debate.timePerPerson;
      const pct = Math.min((used / total) * 100, 100);
      const isSpeaking = debate.currentSpeaker === pid && debate.isRunning && !debate.isPaused;
      const remaining = total - used;
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      const timerClass = pct > 80 ? 'danger' : pct > 60 ? 'warning' : '';
      const barColor = pct > 80 ? 'var(--danger)' : pct > 60 ? 'var(--accent)' : 'var(--success)';

      return `
        <div class="debate-participant-card ${isSpeaking ? 'speaking' : ''}">
          ${isSpeaking ? '<span class="dp-speaking-label">SPEAKING</span>' : ''}
          <div class="dp-name">${escHtml(name)}</div>
          <div class="dp-timer ${timerClass}">${mins}:${String(secs).padStart(2, '0')}</div>
          <div style="font-size:0.8rem;color:var(--text-dim);">${formatTime(used)} used / ${formatTime(total)} total</div>
          <div class="dp-progress">
            <div class="dp-progress-bar" style="width:${pct}%;background:${barColor}"></div>
          </div>
        </div>
      `;
    }).join('');
    document.getElementById('debate-participants').innerHTML = participantsHtml;

    // Dashboard chart
    const totalUsed = debate.participants.reduce((s, pid) => s + (debate.timeUsed[pid] || 0), 0) || 1;
    const colors = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--success)', 'var(--danger)', '#e879f9', '#fb923c', '#a78bfa'];
    const chartHtml = debate.participants.map((pid, i) => {
      const player = currentRoom.players.find(p => p.id === pid);
      const name = player ? player.name : 'Unknown';
      const used = debate.timeUsed[pid] || 0;
      const pct = ((used / totalUsed) * 100).toFixed(1);
      return `
        <div class="debate-chart-bar">
          <div class="dcb-name">${escHtml(name)}</div>
          <div class="dcb-bar-container">
            <div class="dcb-bar" style="width:${pct}%;background:${colors[i % colors.length]};">${formatTime(used)}</div>
          </div>
          <div class="dcb-percent">${pct}%</div>
        </div>
      `;
    }).join('');
    document.getElementById('debate-dashboard').innerHTML = `<h3 style="margin-bottom:16px;font-size:1rem;">Speaking Distribution</h3>` + chartHtml;

    // Admin controls
    const adminPanel = document.getElementById('debate-admin-controls');
    if (isAdmin) {
      adminPanel.style.display = '';
      const buttonsHtml = debate.participants.map(pid => {
        const player = currentRoom.players.find(p => p.id === pid);
        const name = player ? player.name : 'Unknown';
        const isCurrent = debate.currentSpeaker === pid;
        return `<button class="debate-admin-btn ${isCurrent ? 'active-speaker' : ''}" onclick="SpaceGames.debateAction('set-speaker', '${pid}')">
          ${isCurrent ? '🎙️' : '👤'} ${escHtml(name)}
        </button>`;
      }).join('');

      document.getElementById('debate-admin-panel').innerHTML = `
        <p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:10px;">Click a participant to give them the floor:</p>
        ${buttonsHtml}
        <hr style="border-color:var(--border);margin:12px 0;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${debate.isRunning && !debate.isPaused ?
            '<button class="btn btn-sm btn-secondary" onclick="SpaceGames.debateAction(\'pause\')">⏸ Pause</button>' :
            debate.isPaused ?
            '<button class="btn btn-sm btn-success" onclick="SpaceGames.debateAction(\'resume\')">▶ Resume</button>' : ''}
          <button class="btn btn-sm btn-secondary" onclick="SpaceGames.debateAction('stop')">⏹ Stop</button>
          <button class="btn btn-sm btn-secondary" onclick="SpaceGames.debateAction('reset')">🔄 Reset</button>
          <button class="btn btn-sm btn-danger" onclick="SpaceGames.debateAction('end')">End Debate</button>
        </div>
      `;
    } else {
      adminPanel.style.display = 'none';
    }

    // Stats
    const stats = debate.participants.map(pid => {
      const player = currentRoom.players.find(p => p.id === pid);
      const name = player ? player.name : 'Unknown';
      const used = debate.timeUsed[pid] || 0;
      const total = debate.timePerPerson;
      return { name, used, remaining: total - used, pct: ((used / total) * 100).toFixed(0) };
    }).sort((a, b) => b.used - a.used);

    document.getElementById('debate-stats').innerHTML = stats.map(s => `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:0.85rem;">
        <span>${escHtml(s.name)}</span>
        <span style="color:var(--text-muted);">${formatTime(s.used)} (${s.pct}%)</span>
      </div>
    `).join('');
  }

  function debateAction(action, participantId) {
    socket.emit('debate-action', { action, data: { participantId } });
  }

  // ─── Avatar Picker ───
  function showAvatarPicker() {
    const avatars = ['😎','🤠','👾','🦊','🐱','🦁','🐺','🦅','🐉','🎃','👻','🤖','🧙','🥷','🏴‍☠️','🦄','🐧','🦋','🔥','⚡','🌟','💎','🎭','🃏'];
    const grid = avatars.map(a => `<div class="avatar-option ${a === playerAvatar ? 'selected' : ''}" onclick="SpaceGames.pickAvatar('${a}')">${a}</div>`).join('');
    openModal('Choose Avatar', `<div class="avatar-grid">${grid}</div>`);
  }

  function pickAvatar(avatar) {
    playerAvatar = avatar;
    localStorage.setItem('sg_avatar', avatar);
    document.getElementById('nav-avatar').textContent = avatar;
    socket.emit('update-profile', { avatar });
    closeModal();
    playSound('move');
  }

  // ─── Kick Player ───
  function kickPlayer(targetId) {
    if (!isAdmin) return;
    socket.emit('kick-player', { targetId });
    toast('Player kicked', 'info');
  }

  // ─── Rematch ───
  function requestRematch() {
    if (!isAdmin || !lastGameType) return;
    socket.emit('start-game', { gameType: lastGameType });
    document.getElementById('game-over-overlay').style.display = 'none';
  }

  // ─── Voting ───
  function createVote() {
    if (!isAdmin) return;
    socket.emit('create-vote');
    toast('Vote started!', 'success');
  }

  function castVote(option) {
    socket.emit('cast-vote', { option });
    playSound('move');
  }

  function renderVote(data) {
    const el = document.getElementById('vote-display');
    if (!el || !data) { if (el) el.innerHTML = ''; return; }
    const total = Object.values(data.votes).reduce((s, v) => s + v, 0) || 1;
    const optionsHtml = data.options.map(opt => {
      const info = gameInfo[opt];
      if (!info) return '';
      const count = data.votes[opt] || 0;
      const pct = ((count / total) * 100).toFixed(0);
      return `<div class="vote-option" onclick="SpaceGames.castVote('${opt}')">
        <span style="font-size:1.2rem">${info.icon}</span>
        <span style="flex:0 0 100px;font-size:0.8rem;font-weight:600">${info.name}</span>
        <div class="vote-bar-container"><div class="vote-bar" style="width:${pct}%"></div><span class="vote-bar-label">${count}</span></div>
      </div>`;
    }).join('');
    el.innerHTML = `<div class="vote-card"><div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px">Vote for next game:</div>${optionsHtml}</div>`;
  }

  // ─── Tournament ───
  function showTournamentSetup() {
    if (!isAdmin) return;
    const gameOptions = Object.entries(gameInfo).filter(([, g]) => g.min === 2 && g.max === 2).map(([id, g]) =>
      `<option value="${id}">${g.icon} ${g.name}</option>`
    ).join('');
    openModal('Start Tournament', `
      <div class="input-group"><label>Game Type</label><select id="tournament-game">${gameOptions}</select></div>
      <p style="font-size:0.8rem;color:var(--text-muted)">Single elimination bracket with all room players.</p>
      <button onclick="SpaceGames.startTournament()" class="btn btn-accent btn-lg">🏆 Start Tournament</button>
    `);
  }

  function startTournament() {
    const gameType = document.getElementById('tournament-game').value;
    socket.emit('start-tournament', { gameType });
    closeModal();
  }

  function renderTournamentBracket(t, containerId) {
    const el = document.getElementById(containerId);
    if (!el || !t) { if (el) el.innerHTML = ''; return; }
    const names = t.playerNames || {};
    let html = '<div class="bracket-container"><div class="bracket">';
    const roundNames = ['Round 1', 'Quarter', 'Semi', 'Final'];
    t.bracket.forEach((round, ri) => {
      html += `<div class="bracket-round"><div class="bracket-round-title">${roundNames[ri] || 'Round ' + (ri + 1)}</div>`;
      round.forEach((match, mi) => {
        const playable = !match.played && match.p1 && match.p2 && ri === t.currentRound && isAdmin;
        html += `<div class="bracket-match ${playable ? 'playable' : ''}" ${playable ? `onclick="SpaceGames.playTournamentMatch(${mi})"` : ''}>`;
        html += `<div class="bracket-player ${match.winner === match.p1 ? 'winner' : ''} ${!match.p1 ? 'bye' : ''}">${match.p1 ? escHtml(names[match.p1] || '?') : 'BYE'}</div>`;
        html += `<div class="bracket-player ${match.winner === match.p2 ? 'winner' : ''} ${!match.p2 ? 'bye' : ''}">${match.p2 ? escHtml(names[match.p2] || '?') : 'BYE'}</div>`;
        html += '</div>';
      });
      html += '</div>';
    });
    if (t.champion) {
      html += `<div class="bracket-round"><div class="bracket-round-title">Champion</div><div class="bracket-champion">👑 ${escHtml(names[t.champion] || '?')}</div></div>`;
    }
    html += '</div></div>';
    el.innerHTML = html;
  }

  function playTournamentMatch(matchIndex) {
    if (!isAdmin) return;
    socket.emit('tournament-match', { matchIndex });
  }

  // ─── Achievement Display ───
  function showAchievement(ach) {
    playSound('achievement');
    const container = document.getElementById('achievement-container');
    const el = document.createElement('div');
    el.className = 'achievement-toast';
    el.innerHTML = `<div class="ach-icon">${ach.icon}</div><div class="ach-label">Achievement Unlocked</div><div class="ach-name">${ach.name}</div><div class="ach-desc">${ach.desc}</div>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  // ─── Leaderboard ───
  function loadLeaderboard(filter) {
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === filter);
    });

    const url = filter === 'all' ? '/api/leaderboard' : '/api/leaderboard/' + filter;
    fetch(url)
      .then(r => r.json())
      .then(data => renderLeaderboard(data, filter))
      .catch(() => {
        document.getElementById('leaderboard-content').innerHTML = '<div class="empty-state">Failed to load leaderboard</div>';
      });
  }

  function renderLeaderboard(data, filter) {
    const el = document.getElementById('leaderboard-content');
    if (!data.length) {
      el.innerHTML = '<div class="empty-state">No scores yet. Play some games to get on the board!</div>';
      return;
    }

    const isGameFilter = filter !== 'all';
    const headers = isGameFilter
      ? '<th>Rank</th><th>Player</th><th>Played</th><th>Wins</th><th>Points</th>'
      : '<th>Rank</th><th>Player</th><th>Played</th><th>W / L / D</th><th>Points</th>';

    const rows = data.map((p, i) => {
      const rank = i + 1;
      const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;

      if (isGameFilter) {
        return `<tr>
          <td class="lb-rank ${rankClass}">${medal}</td>
          <td class="lb-name">${escHtml(p.name)}</td>
          <td>${p.played}</td>
          <td>${p.wins}</td>
          <td class="lb-points">${p.points}</td>
        </tr>`;
      }
      return `<tr>
        <td class="lb-rank ${rankClass}">${medal}</td>
        <td class="lb-name"><span style="margin-right:6px">${p.avatar || '😎'}</span>${escHtml(p.name)} <span class="level-badge${(p.level || 1) >= 10 ? ' elite' : (p.level || 1) >= 5 ? ' high' : ''}">Lv.${p.level || 1}</span>${(p.streak || 0) >= 3 ? ' <span class="streak-badge">🔥' + p.streak + '</span>' : ''}</td>
        <td>${p.gamesPlayed}</td>
        <td>${p.wins} / ${p.losses} / ${p.draws}</td>
        <td class="lb-points">${p.totalPoints}</td>
      </tr>`;
    }).join('');

    el.innerHTML = `<table class="lb-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  // ─── Socket Listeners ───
  function setupSocketListeners() {
    socket.on('room-update', (room) => {
      currentRoom = room;
      isAdmin = room.admin === playerId;
      renderRoom();
    });

    socket.on('player-joined', (data) => {
      addSystemMessage(`${data.name} joined the room`);
      toast(`${data.name} joined!`, 'info');
    });

    socket.on('player-left', (data) => {
      addSystemMessage(`A player left the room`);
    });

    socket.on('new-admin', (data) => {
      isAdmin = data.adminId === playerId;
      if (isAdmin) toast('You are now the room admin!', 'info');
      renderRoom();
    });

    socket.on('chat-message', addChatMessage);
    socket.on('reaction', showReaction);

    socket.on('game-started', (data) => {
      if (currentRoom) currentRoom.currentGame = data.gameType;
      lastGameType = data.gameType;
      onGameStarted(data);
      playSound('join');
    });

    socket.on('game-update', onGameUpdate);

    socket.on('game-timer', (data) => {
      const el = document.getElementById('game-timer-value');
      const display = document.getElementById('game-timer-display');
      if (el) el.textContent = data.remaining;
      if (display) {
        display.classList.remove('warning', 'danger');
        if (data.remaining <= 3) { display.classList.add('danger'); playSound('tick'); }
        else if (data.remaining <= 5) display.classList.add('warning');
      }
    });

    socket.on('game-over', (data) => {
      if (currentRoom) currentRoom.currentGame = null;
      onGameOver(data);
    });

    socket.on('game-ended', () => {
      if (currentRoom) currentRoom.currentGame = null;
      for (const [id, h] of Object.entries(registeredGames)) {
        if (h._active) { h._active = false; if (h.destroy) h.destroy(); }
      }
      navigate('room');
      renderRoom();
    });

    socket.on('debate-update', (debate) => {
      if (currentRoom) currentRoom.debate = debate;
      if (document.getElementById('page-debate').classList.contains('active')) {
        renderDebate(debate);
      }
      if (document.getElementById('page-room').classList.contains('active')) {
        renderRoom();
      }
      if (!debate) {
        navigate('room');
        renderRoom();
      }
    });

    socket.on('debate-tick', (data) => {
      if (currentRoom && currentRoom.debate) {
        currentRoom.debate.timeUsed = data.timeUsed;
        if (document.getElementById('page-debate').classList.contains('active')) {
          renderDebate(currentRoom.debate);
        }
      }
    });

    socket.on('debate-time-up', (data) => {
      toast("Time's up!", 'info');
    });

    socket.on('achievement-unlocked', (ach) => {
      if (ach) showAchievement(ach);
    });

    socket.on('vote-update', (data) => {
      renderVote(data);
    });

    socket.on('vote-result', (data) => {
      const el = document.getElementById('vote-display');
      if (el && data.results) {
        const sorted = Object.entries(data.results).sort((a, b) => b[1] - a[1]);
        const winner = sorted[0];
        const info = gameInfo[winner[0]];
        el.innerHTML = `<div class="vote-card" style="text-align:center"><p style="font-size:1rem;font-weight:700;margin-bottom:8px">Vote Result: ${info ? info.icon + ' ' + info.name : winner[0]}</p><p style="font-size:0.8rem;color:var(--text-muted)">${winner[1]} votes</p></div>`;
        setTimeout(() => { if (el) el.innerHTML = ''; }, 5000);
      }
    });

    socket.on('tournament-update', (t) => {
      if (currentRoom) currentRoom.tournament = t;
      renderTournamentBracket(t, 'tournament-display');
      if (t.champion) {
        const champName = t.playerNames[t.champion] || 'Unknown';
        toast('🏆 ' + champName + ' wins the tournament!', 'success');
        if (t.champion === playerId) fireConfetti();
      }
    });

    socket.on('player-kicked', (data) => {
      toast(data.message || 'You have been kicked', 'error');
      currentRoom = null;
      isAdmin = false;
      playerId = null;
      document.getElementById('nav-user').style.display = 'none';
      location.hash = '';
      navigate('home');
    });

    socket.on('error-msg', (data) => {
      toast(data.message, 'error');
    });
  }

  // ─── Render Home Games Grid ───
  function renderHomeGames() {
    const grid = document.getElementById('home-games-grid');
    if (!grid) return;
    grid.innerHTML = Object.entries(gameInfo).map(([id, g]) => `
      <div class="game-card">
        <div class="game-icon">${g.icon}</div>
        <h4>${g.name}</h4>
        <p>${g.desc}</p>
        <div class="player-req">${g.min === g.max ? g.min : g.min + '-' + g.max} players | ${g.category}</div>
      </div>
    `).join('');
  }

  // ─── Modal ───
  function openModal(title, bodyHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-overlay').classList.add('active');
  }

  function closeModal(event) {
    if (event && event.target !== document.getElementById('modal-overlay')) return;
    document.getElementById('modal-overlay').classList.remove('active');
  }

  // ─── Toast ───
  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  // ─── Helpers ───
  function escHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ─── Init on DOM Ready ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API ───
  return {
    navigate, showCreateRoom, showJoinRoom, createRoom, joinRoom, leaveRoom,
    copyRoomCode, sendChat, sendReaction, registerGame, startGame,
    endCurrentGame, backToRoom, dismissGameOver,
    showCreateDebate, createDebate, openDebate, debateAction,
    loadLeaderboard, closeModal, toast,
    toggleSound, showAvatarPicker, pickAvatar, kickPlayer,
    requestRematch, createVote, castVote,
    showTournamentSetup, startTournament, playTournamentMatch,
    get playerId() { return playerId; },
    get playerName() { return playerName; },
    get currentRoom() { return currentRoom; },
    get isAdmin() { return isAdmin; },
    get socket() { return socket; },
    get gameInfo() { return gameInfo; }
  };
})();
