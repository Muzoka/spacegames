const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ═══════════════════════════════════════
// DATA PERSISTENCE
// ═══════════════════════════════════════
const DATA_FILE = path.join(__dirname, 'data', 'leaderboard.json');

function loadLeaderboard() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch { return {}; }
}

function saveLeaderboard(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let leaderboard = loadLeaderboard();

function updateLeaderboard(playerName, gameType, result) {
  if (!playerName) return;
  const key = playerName.toLowerCase();
  if (!leaderboard[key]) {
    leaderboard[key] = { name: playerName, totalPoints: 0, gamesPlayed: 0, wins: 0, losses: 0, draws: 0, gameStats: {} };
  }
  const p = leaderboard[key];
  p.name = playerName;
  p.gamesPlayed++;
  if (!p.gameStats[gameType]) p.gameStats[gameType] = { played: 0, wins: 0, points: 0 };
  p.gameStats[gameType].played++;

  if (result === 'win') { p.wins++; p.totalPoints += 3; p.gameStats[gameType].wins++; p.gameStats[gameType].points += 3; }
  else if (result === 'draw') { p.draws++; p.totalPoints += 1; p.gameStats[gameType].points += 1; }
  else { p.losses++; }

  saveLeaderboard(leaderboard);
}

// ═══════════════════════════════════════
// PLAYER PROFILES, XP, LEVELS
// ═══════════════════════════════════════
const AVATARS = ['😎','🤠','👾','🦊','🐱','🦁','🐺','🦅','🐉','🎃','👻','🤖','🧙','🥷','🏴‍☠️','🦄','🐧','🦋','🔥','⚡','🌟','💎','🎭','🃏'];

// ═══════════════════════════════════════
// BOT SYSTEM
// ═══════════════════════════════════════
const BOT_NAMES = ['Circuit','Nova','Pixel','Spark','Orbit','Cosmo','Glitch','Neon','Turbo','Blitz','Quasar','Vector','Byte','Cipher','Prism','Zenith','Echo','Flux','Drift','Pulse'];
let botCounter = 0;
const botTimers = new Map();

function generateBotId() { return 'bot_' + (++botCounter) + '_' + Date.now().toString(36); }
function isBot(pid) { return typeof pid === 'string' && pid.startsWith('bot_'); }

function addBotToRoom(room, difficulty) {
  if (room.players.size >= 20) return null;
  const usedNames = new Set(Array.from(room.players.values()).map(p => p.name));
  const available = BOT_NAMES.filter(n => !usedNames.has(n));
  const name = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : 'Bot-' + Math.floor(Math.random() * 999);
  const botId = generateBotId();
  const bot = { id: botId, name, score: 0, gamesPlayed: 0, wins: 0, avatar: '🤖', level: 0, isBot: true, difficulty };
  room.players.set(botId, bot);
  return bot;
}

function removeBotFromRoom(room, botId) { room.players.delete(botId); }
function removeAllBotsFromRoom(room) { for (const [id] of room.players) { if (isBot(id)) room.players.delete(id); } }

function clearBotTimers(code) {
  const timers = botTimers.get(code);
  if (timers) { timers.forEach(t => clearTimeout(t)); botTimers.delete(code); }
}

function scheduleBotTimer(code, fn, delay) {
  if (!botTimers.has(code)) botTimers.set(code, []);
  const tid = setTimeout(() => {
    const timers = botTimers.get(code);
    if (timers) { const i = timers.indexOf(tid); if (i >= 0) timers.splice(i, 1); }
    fn();
  }, delay);
  botTimers.get(code).push(tid);
}

function getBotDelay(difficulty, gameType) {
  const base = { easy: [2000,4500], medium: [1000,2500], hard: [400,1200] };
  const timed = ['trivia','wordscramble','emojiguess','hangman','fastmath'].includes(gameType);
  let [min, max] = base[difficulty] || base.medium;
  if (timed) { min = Math.floor(min * 0.5); max = Math.floor(max * 0.55); }
  return min + Math.floor(Math.random() * (max - min));
}

// ─── Bot AI per game ───
const botAI = {
  tictactoe(state, botId, diff) {
    const board = state.board;
    const mark = state.marks[botId];
    const opp = mark === 'X' ? 'O' : 'X';
    if (diff === 'hard' || (diff === 'medium' && Math.random() < 0.5)) {
      // Minimax
      function minimax(b, isMax, depth) {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (const [a,c,d] of lines) { if (b[a] && b[a]===b[c] && b[a]===b[d]) return b[a]===mark ? 10-depth : depth-10; }
        const empty = b.reduce((a,v,i) => v===null?[...a,i]:a, []);
        if (empty.length === 0) return 0;
        let best = isMax ? -Infinity : Infinity;
        for (const i of empty) { b[i] = isMax ? mark : opp; const s = minimax(b, !isMax, depth+1); b[i] = null; best = isMax ? Math.max(best,s) : Math.min(best,s); }
        return best;
      }
      let bestMove = -1, bestScore = -Infinity;
      const empty = board.reduce((a,v,i) => v===null?[...a,i]:a, []);
      for (const i of empty) { board[i] = mark; const s = minimax(board, false, 0); board[i] = null; if (s > bestScore) { bestScore = s; bestMove = i; } }
      if (bestMove >= 0) return { cell: bestMove };
    }
    const empty = board.reduce((a,v,i) => v===null?[...a,i]:a, []);
    return empty.length > 0 ? { cell: empty[Math.floor(Math.random() * empty.length)] } : null;
  },

  connect4(state, botId, diff) {
    const board = state.board;
    const myColor = state.colors[botId];
    const oppColor = myColor === 'R' ? 'Y' : 'R';
    function canPlace(col) { return board[0][col] === null; }
    function getRow(col) { for (let r=5;r>=0;r--) if (board[r][col]===null) return r; return -1; }
    function checkWinAt(b, r, c, color) {
      const dirs=[[0,1],[1,0],[1,1],[1,-1]];
      for (const [dr,dc] of dirs) { let cnt=1; for (let d=1;d<4;d++){const nr=r+dr*d,nc=c+dc*d;if(nr<0||nr>=6||nc<0||nc>=7||b[nr][nc]!==color)break;cnt++;} for(let d=1;d<4;d++){const nr=r-dr*d,nc=c-dc*d;if(nr<0||nr>=6||nc<0||nc>=7||b[nr][nc]!==color)break;cnt++;} if(cnt>=4)return true; }
      return false;
    }
    const validCols = [0,1,2,3,4,5,6].filter(canPlace);
    if (validCols.length === 0) return null;
    if (diff === 'hard' || diff === 'medium') {
      // Check for winning move
      for (const c of validCols) { const r=getRow(c); board[r][c]=myColor; if(checkWinAt(board,r,c,myColor)){board[r][c]=null;return{col:c};} board[r][c]=null; }
      // Block opponent win
      for (const c of validCols) { const r=getRow(c); board[r][c]=oppColor; if(checkWinAt(board,r,c,oppColor)){board[r][c]=null;return{col:c};} board[r][c]=null; }
      if (diff === 'hard') {
        // Prefer center columns
        const scored = validCols.map(c => ({ col: c, score: 3 - Math.abs(c - 3) })).sort((a,b) => b.score - a.score);
        return { col: scored[0].col };
      }
    }
    return { col: validCols[Math.floor(Math.random() * validCols.length)] };
  },

  chess(state, botId, diff) {
    const board = state.board;
    const color = state.colors[botId];
    const moves = [];
    // Generate all pseudo-legal moves for bot's pieces
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      const p = board[r][c];
      if (!p || p[0] !== color) continue;
      const dests = getChessMovesServer(board, r, c, state);
      for (const [tr,tc] of dests) moves.push({fromR:r,fromC:c,toR:tr,toC:tc});
    }
    if (moves.length === 0) return null;
    if (diff === 'hard') {
      // Pick best capture by piece value
      const vals = {p:1,n:3,b:3,r:5,q:9,k:0};
      const scored = moves.map(m => {
        const target = board[m.toR][m.toC];
        return { ...m, score: target ? (vals[target[1]]||0)*10 : 0 };
      }).sort((a,b) => b.score - a.score);
      // Among top captures (or all if no captures), pick randomly
      const topScore = scored[0].score;
      const best = scored.filter(m => m.score === topScore);
      const pick = best[Math.floor(Math.random() * best.length)];
      return { fromR: pick.fromR, fromC: pick.fromC, toR: pick.toR, toC: pick.toC };
    }
    if (diff === 'medium') {
      // Prefer captures
      const captures = moves.filter(m => board[m.toR][m.toC]);
      if (captures.length > 0 && Math.random() < 0.7) { const m = captures[Math.floor(Math.random()*captures.length)]; return m; }
    }
    return moves[Math.floor(Math.random() * moves.length)];
  },

  rps(state, botId, diff) {
    const choices = ['rock','paper','scissors'];
    if (diff === 'hard' && state.history.length > 0) {
      const oppId = state.players.find(p => p !== botId);
      const oppChoices = state.history.map(h => h.choices[oppId]).filter(Boolean);
      if (oppChoices.length > 0) {
        const freq = {rock:0,paper:0,scissors:0};
        oppChoices.forEach(c => freq[c]++);
        const most = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0];
        const counter = {rock:'paper',paper:'scissors',scissors:'rock'};
        return { choice: counter[most] };
      }
    }
    return { choice: choices[Math.floor(Math.random() * choices.length)] };
  },

  trivia(state, botId, diff) {
    const correct = state.questions[state.currentQ].correct;
    const prob = diff === 'easy' ? 0.3 : diff === 'medium' ? 0.6 : 0.85;
    if (Math.random() < prob) return { answer: correct };
    const wrong = [0,1,2,3].filter(i => i !== correct);
    return { answer: wrong[Math.floor(Math.random() * wrong.length)] };
  },

  wordscramble(state, botId, diff) {
    const prob = diff === 'easy' ? 0.2 : diff === 'medium' ? 0.5 : 0.8;
    if (Math.random() < prob) return { guess: state.words[state.currentWord].word };
    return null; // abstain
  },

  emojiguess(state, botId, diff) {
    const prob = diff === 'easy' ? 0.2 : diff === 'medium' ? 0.5 : 0.8;
    if (Math.random() < prob) return { guess: state.puzzles[state.currentPuzzle].answers[0] };
    return null;
  },

  hangman(state, botId, diff) {
    const word = state.actualWord;
    const guessed = new Set([...state.revealed.filter(c=>c!=='_'), ...state.wrongLetters]);
    const unguessed = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(c => !guessed.has(c));
    if (unguessed.length === 0) return null;
    const prob = diff === 'easy' ? 0.3 : diff === 'medium' ? 0.6 : 0.85;
    if (Math.random() < prob) {
      const correctLetters = [...new Set(word.split(''))].filter(c => !guessed.has(c));
      if (correctLetters.length > 0) return { letter: correctLetters[Math.floor(Math.random() * correctLetters.length)] };
    }
    return { letter: unguessed[Math.floor(Math.random() * unguessed.length)] };
  },

  fastmath(state, botId, diff) {
    const correct = state.problems[state.currentProblem].answer;
    const prob = diff === 'easy' ? 0.3 : diff === 'medium' ? 0.6 : 0.9;
    if (Math.random() < prob) return { answer: String(correct) };
    return null; // abstain
  }
};

// ─── Chess move generation for bots ───
function getChessMovesServer(board, r, c, state) {
  const piece = board[r][c]; if (!piece) return [];
  const color = piece[0], type = piece[1], moves = [];
  function inBounds(r,c) { return r>=0&&r<8&&c>=0&&c<8; }
  function addIf(tr,tc) { if (inBounds(tr,tc) && (!board[tr][tc] || board[tr][tc][0]!==color)) moves.push([tr,tc]); }
  function slide(dr,dc) { for(let i=1;i<8;i++){const tr=r+dr*i,tc=c+dc*i;if(!inBounds(tr,tc))break;if(board[tr][tc]){if(board[tr][tc][0]!==color)moves.push([tr,tc]);break;}moves.push([tr,tc]);} }
  if (type==='p') {
    const dir=color==='w'?-1:1, start=color==='w'?6:1;
    if(inBounds(r+dir,c)&&!board[r+dir][c]){moves.push([r+dir,c]);if(r===start&&!board[r+2*dir][c])moves.push([r+2*dir,c]);}
    if(inBounds(r+dir,c-1)&&board[r+dir][c-1]&&board[r+dir][c-1][0]!==color)moves.push([r+dir,c-1]);
    if(inBounds(r+dir,c+1)&&board[r+dir][c+1]&&board[r+dir][c+1][0]!==color)moves.push([r+dir,c+1]);
  } else if (type==='n') { [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>addIf(r+dr,c+dc)); }
  else if (type==='b') { [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>slide(dr,dc)); }
  else if (type==='r') { [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr,dc])=>slide(dr,dc)); }
  else if (type==='q') { [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>slide(dr,dc)); }
  else if (type==='k') { [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>addIf(r+dr,c+dc)); }
  return moves;
}

// ─── Bot move scheduling ───
function scheduleBotMoves(roomCode, gameType) {
  const room = rooms.get(roomCode);
  if (!room || !room.gameState || !room.currentGame) return;
  const state = room.gameState, engine = gameEngines[gameType];
  if (!engine) return;

  if (['tictactoe','connect4','chess'].includes(gameType)) {
    const idx = state.turn % 2;
    const pid = state.players[idx];
    if (!isBot(pid)) return;
    const bot = room.players.get(pid);
    if (!bot) return;
    scheduleBotTimer(roomCode, () => executeBotMove(roomCode, pid, gameType), getBotDelay(bot.difficulty, gameType));
  } else if (gameType === 'rps') {
    for (const pid of state.players) {
      if (isBot(pid) && !state.choices[pid]) {
        const bot = room.players.get(pid);
        if (bot) scheduleBotTimer(roomCode, () => executeBotMove(roomCode, pid, gameType), getBotDelay(bot.difficulty, gameType));
      }
    }
  } else {
    for (const pid of state.players) {
      if (!isBot(pid)) continue;
      if (gameType === 'trivia' && state.answered && state.answered[pid] !== undefined) continue;
      if (['wordscramble','emojiguess','fastmath'].includes(gameType) && state.solved) continue;
      if (gameType === 'hangman' && (state.solved || state.failed)) continue;
      const bot = room.players.get(pid);
      if (bot) scheduleBotTimer(roomCode, () => executeBotMove(roomCode, pid, gameType), getBotDelay(bot.difficulty, gameType));
    }
  }
}

function executeBotMove(roomCode, botId, gameType) {
  const room = rooms.get(roomCode);
  if (!room || !room.gameState || room.currentGame !== gameType) return;
  const state = room.gameState, engine = gameEngines[gameType];
  if (!engine) return;
  const bot = room.players.get(botId);
  if (!bot) return;
  const move = botAI[gameType](state, botId, bot.difficulty);
  if (!move) return;
  const error = engine.validate(state, botId, move);
  if (error) return;
  engine.apply(state, botId, move);
  io.to(roomCode).emit('game-update', { state: sanitizeState(gameType, state), lastMove: move, playerId: botId });

  const result = engine.checkEnd(state);
  if (result) { endGame(roomCode, room, result); return; }

  // Handle round transitions
  if (state.phase === 'reveal' && gameType === 'trivia') {
    clearGameTimer(roomCode); clearBotTimers(roomCode);
    setTimeout(() => { if(!room.currentGame)return; engine.nextQuestion(state); const e=engine.checkEnd(state); if(e){endGame(roomCode,room,e);return;} io.to(roomCode).emit('game-update',{state:sanitizeState(gameType,state)}); startGameTimer(roomCode,state.timer,()=>handleGameTimeout(roomCode,gameType)); scheduleBotMoves(roomCode,gameType); }, 3000);
  } else if (state.solved && ['wordscramble','emojiguess','fastmath'].includes(gameType)) {
    clearGameTimer(roomCode); clearBotTimers(roomCode);
    setTimeout(() => { if(!room.currentGame)return; if(engine.nextPuzzle)engine.nextPuzzle(state);else if(engine.nextWord)engine.nextWord(state);else if(engine.nextProblem)engine.nextProblem(state); const e=engine.checkEnd(state); if(e){endGame(roomCode,room,e);return;} io.to(roomCode).emit('game-update',{state:sanitizeState(gameType,state)}); startGameTimer(roomCode,state.timer,()=>handleGameTimeout(roomCode,gameType)); scheduleBotMoves(roomCode,gameType); }, 2500);
  } else if (state.solved && gameType === 'hangman') {
    clearGameTimer(roomCode); clearBotTimers(roomCode);
    setTimeout(() => { if(!room.currentGame)return; engine.nextWord(state); const e=engine.checkEnd(state); if(e){endGame(roomCode,room,e);return;} io.to(roomCode).emit('game-update',{state:sanitizeState(gameType,state)}); startGameTimer(roomCode,state.timer,()=>handleGameTimeout(roomCode,gameType)); scheduleBotMoves(roomCode,gameType); }, 2500);
  } else if (state.failed && gameType === 'hangman') {
    clearGameTimer(roomCode); clearBotTimers(roomCode);
    setTimeout(() => { if(!room.currentGame)return; engine.nextWord(state); const e=engine.checkEnd(state); if(e){endGame(roomCode,room,e);return;} io.to(roomCode).emit('game-update',{state:sanitizeState(gameType,state)}); startGameTimer(roomCode,state.timer,()=>handleGameTimeout(roomCode,gameType)); scheduleBotMoves(roomCode,gameType); }, 3000);
  } else {
    scheduleBotMoves(roomCode, gameType);
  }
}

function ensureProfile(playerName) {
  const key = playerName.toLowerCase();
  if (!leaderboard[key]) {
    leaderboard[key] = { name: playerName, totalPoints: 0, gamesPlayed: 0, wins: 0, losses: 0, draws: 0, gameStats: {} };
  }
  const p = leaderboard[key];
  if (!p.xp) p.xp = (p.gamesPlayed || 0) * 10 + (p.wins || 0) * 20;
  if (!p.avatar) p.avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  if (!p.achievements) p.achievements = [];
  if (!p.streak) p.streak = 0;
  if (!p.maxStreak) p.maxStreak = 0;
  if (!p.messages) p.messages = 0;
  if (p.selectedTitle === undefined) p.selectedTitle = null;
  const today = new Date().toISOString().split('T')[0];
  if (!p.dailyChallenge || p.dailyChallenge.date !== today) {
    p.dailyChallenge = { date: today, progress: 0, completed: false, typesPlayed: [] };
  }
  return p;
}

function calculateLevel(xp) { return Math.floor(Math.sqrt((xp || 0) / 100)) + 1; }

// ═══════════════════════════════════════
// TITLES & DAILY CHALLENGES
// ═══════════════════════════════════════
const TITLE_MAP = {
  first_blood:{icon:'🗡️',en:'First Blood',ar:'الضربة الأولى'},
  streak_3:{icon:'🔥',en:'On Fire',ar:'مشتعل'}, streak_5:{icon:'🔥🔥',en:'Blazing',ar:'ملتهب'},
  streak_10:{icon:'💥',en:'Unstoppable',ar:'لا يُوقف'}, checkmate:{icon:'♟️',en:'Chess Master',ar:'سيد الشطرنج'},
  trivia_king:{icon:'🧠',en:'Trivia King',ar:'ملك المعلومات'}, speed_demon:{icon:'⚡',en:'Speed Demon',ar:'شيطان السرعة'},
  champion:{icon:'👑',en:'Champion',ar:'البطل'}, legend:{icon:'🏆',en:'Legend',ar:'أسطورة'},
  jack_trades:{icon:'🃏',en:'All-Rounder',ar:'متعدد المواهب'}, veteran:{icon:'⭐',en:'Veteran',ar:'محارب قديم'},
  social:{icon:'🦋',en:'Social Star',ar:'نجم اجتماعي'}, debater:{icon:'🎙️',en:'Debater',ar:'المناظر'},
  word_wizard:{icon:'🔤',en:'Word Wizard',ar:'ساحر الكلمات'}, emoji_expert:{icon:'😎',en:'Emoji Expert',ar:'خبير الإيموجي'}
};

const DAILY_CHALLENGES = [
  { type:'win_games', target:2, en:'Win 2 games', ar:'فز بلعبتين', reward:50 },
  { type:'play_types', target:3, en:'Play 3 different game types', ar:'العب ٣ أنواع ألعاب مختلفة', reward:50 },
  { type:'play_games', target:5, en:'Play 5 games', ar:'العب ٥ ألعاب', reward:50 },
  { type:'win_streak', target:2, en:'Win 2 games in a row', ar:'فز بلعبتين متتاليتين', reward:50 },
  { type:'trivia_7', target:7, en:'Score 7+ in Trivia', ar:'سجل ٧+ في المعلومات', reward:50 },
  { type:'chess_win', target:1, en:'Win a chess game', ar:'فز بلعبة شطرنج', reward:50 },
  { type:'math_8', target:8, en:'Score 8+ in Fast Math', ar:'سجل ٨+ في الحساب السريع', reward:50 }
];

function getDailyChallenge() {
  const today = new Date().toISOString().split('T')[0];
  const seed = today.split('-').reduce((a,b) => a + parseInt(b), 0);
  return { ...DAILY_CHALLENGES[seed % DAILY_CHALLENGES.length], date: today };
}

function addXP(playerName, amount) {
  const p = ensureProfile(playerName);
  p.xp = (p.xp || 0) + amount;
  p.level = calculateLevel(p.xp);
  saveLeaderboard(leaderboard);
  return p;
}

// ═══════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════
const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood', desc: 'Win your first game', icon: '🗡️' },
  { id: 'streak_3', name: 'Streak Starter', desc: 'Win 3 games in a row', icon: '🔥' },
  { id: 'streak_5', name: 'On Fire', desc: 'Win 5 games in a row', icon: '🔥🔥' },
  { id: 'streak_10', name: 'Unstoppable', desc: 'Win 10 games in a row', icon: '💥' },
  { id: 'checkmate', name: 'Checkmate', desc: 'Win a chess game', icon: '♟️' },
  { id: 'trivia_king', name: 'Trivia King', desc: 'Score 10/10 in trivia', icon: '🧠' },
  { id: 'word_wizard', name: 'Word Wizard', desc: 'Solve all 8 words', icon: '🔤' },
  { id: 'emoji_expert', name: 'Emoji Expert', desc: 'Solve all 8 emoji puzzles', icon: '😎' },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Win a fast math game', icon: '⚡' },
  { id: 'jack_trades', name: 'Jack of All Trades', desc: 'Win in every game type', icon: '🃏' },
  { id: 'social', name: 'Social Butterfly', desc: 'Send 50+ messages', icon: '🦋' },
  { id: 'debater', name: 'Debater', desc: 'Participate in a debate', icon: '🎙️' },
  { id: 'champion', name: 'Champion', desc: 'Win a tournament', icon: '👑' },
  { id: 'veteran', name: 'Veteran', desc: 'Play 50 games', icon: '⭐' },
  { id: 'legend', name: 'Legend', desc: 'Play 100 games', icon: '🏆' }
];

function checkAchievements(playerName, gameType, result, gameState) {
  const p = ensureProfile(playerName);
  const newAchievements = [];

  function unlock(id) {
    if (!p.achievements.includes(id)) {
      p.achievements.push(id);
      p.xp = (p.xp || 0) + 20;
      p.level = calculateLevel(p.xp);
      newAchievements.push(ACHIEVEMENTS.find(a => a.id === id));
    }
  }

  if (result === 'win' && p.wins === 1) unlock('first_blood');
  if (p.streak >= 3) unlock('streak_3');
  if (p.streak >= 5) unlock('streak_5');
  if (p.streak >= 10) unlock('streak_10');
  if (result === 'win' && gameType === 'chess') unlock('checkmate');
  if (result === 'win' && gameType === 'fastmath') unlock('speed_demon');
  if (gameType === 'trivia' && gameState && gameState.scores) {
    const myScore = gameState.scores[Object.keys(gameState.scores).find(k => leaderboard[k.toLowerCase()]?.name === playerName)] || 0;
    if (myScore >= 10) unlock('trivia_king');
  }
  if (gameType === 'wordscramble' && gameState && gameState.scores) {
    for (const [k, v] of Object.entries(gameState.scores)) {
      if (v >= 8 && leaderboard[playerName.toLowerCase()]) unlock('word_wizard');
    }
  }
  if (gameType === 'emojiguess' && gameState && gameState.scores) {
    for (const [k, v] of Object.entries(gameState.scores)) {
      if (v >= 8 && leaderboard[playerName.toLowerCase()]) unlock('emoji_expert');
    }
  }

  const allTypes = ['tictactoe', 'connect4', 'chess', 'rps', 'trivia', 'wordscramble', 'emojiguess', 'hangman', 'fastmath'];
  const wonTypes = allTypes.filter(t => p.gameStats[t] && p.gameStats[t].wins > 0);
  if (wonTypes.length >= allTypes.length) unlock('jack_trades');

  if (p.messages >= 50) unlock('social');
  if (p.gamesPlayed >= 50) unlock('veteran');
  if (p.gamesPlayed >= 100) unlock('legend');

  saveLeaderboard(leaderboard);
  return newAchievements;
}

// ═══════════════════════════════════════
// VOTING & TOURNAMENTS
// ═══════════════════════════════════════
const roomVotes = new Map();
const roomTournaments = new Map();

// ═══════════════════════════════════════
// ROOM MANAGEMENT
// ═══════════════════════════════════════
const rooms = new Map();
const socketToRoom = new Map();

function generateCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += c[Math.floor(Math.random() * c.length)];
  return rooms.has(code) ? generateCode() : code;
}

function getRoomData(room) {
  return {
    code: room.code,
    admin: room.admin,
    players: Array.from(room.players.values()),
    currentGame: room.currentGame,
    gameState: room.gameState,
    vote: room.vote || null,
    tournament: room.tournament || null,
    debate: room.debate ? {
      topic: room.debate.topic,
      participants: room.debate.participants,
      timePerPerson: room.debate.timePerPerson,
      currentSpeaker: room.debate.currentSpeaker,
      timeUsed: room.debate.timeUsed,
      isRunning: room.debate.isRunning,
      isPaused: room.debate.isPaused
    } : null,
    createdAt: room.createdAt
  };
}

// ═══════════════════════════════════════
// GAME ENGINES
// ═══════════════════════════════════════
const gameEngines = {
  tictactoe: {
    create(players) {
      return { board: Array(9).fill(null), turn: 0, players, marks: { [players[0]]: 'X', [players[1]]: 'O' } };
    },
    validate(state, pid, move) {
      const idx = state.turn % 2;
      if (state.players[idx] !== pid) return 'Not your turn';
      if (move.cell < 0 || move.cell > 8 || state.board[move.cell] !== null) return 'Invalid cell';
      return null;
    },
    apply(state, pid, move) {
      state.board[move.cell] = state.marks[pid];
      state.turn++;
      return state;
    },
    checkEnd(state) {
      const b = state.board;
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (const [a, c, d] of lines) {
        if (b[a] && b[a] === b[c] && b[a] === b[d]) {
          const winner = state.players[b[a] === 'X' ? 0 : 1];
          return { winner, line: [a, c, d] };
        }
      }
      if (b.every(c => c !== null)) return { winner: null, draw: true };
      return null;
    }
  },

  connect4: {
    create(players) {
      return { board: Array(6).fill(null).map(() => Array(7).fill(null)), turn: 0, players, colors: { [players[0]]: 'R', [players[1]]: 'Y' } };
    },
    validate(state, pid, move) {
      const idx = state.turn % 2;
      if (state.players[idx] !== pid) return 'Not your turn';
      const col = move.col;
      if (col < 0 || col > 6) return 'Invalid column';
      if (state.board[0][col] !== null) return 'Column full';
      return null;
    },
    apply(state, pid, move) {
      const col = move.col;
      for (let r = 5; r >= 0; r--) {
        if (state.board[r][col] === null) { state.board[r][col] = state.colors[pid]; move.row = r; break; }
      }
      state.turn++;
      return state;
    },
    checkEnd(state) {
      const b = state.board;
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
          if (!b[r][c]) continue;
          for (const [dr, dc] of dirs) {
            let count = 1;
            const cells = [[r, c]];
            for (let i = 1; i < 4; i++) {
              const nr = r + dr * i, nc = c + dc * i;
              if (nr < 0 || nr >= 6 || nc < 0 || nc >= 7 || b[nr][nc] !== b[r][c]) break;
              count++;
              cells.push([nr, nc]);
            }
            if (count >= 4) {
              const winner = state.players[b[r][c] === 'R' ? 0 : 1];
              return { winner, line: cells };
            }
          }
        }
      }
      if (b[0].every(c => c !== null)) return { winner: null, draw: true };
      return null;
    }
  },

  chess: {
    create(players) {
      const board = [
        ['br','bn','bb','bq','bk','bb','bn','br'],
        ['bp','bp','bp','bp','bp','bp','bp','bp'],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        ['wp','wp','wp','wp','wp','wp','wp','wp'],
        ['wr','wn','wb','wq','wk','wb','wn','wr']
      ];
      return { board, turn: 0, players, colors: { [players[0]]: 'w', [players[1]]: 'b' }, moveHistory: [], captured: { w: [], b: [] }, castling: { wk: true, wq: true, bk: true, bq: true }, enPassant: null, check: false, gameOver: false };
    },
    validate(state, pid, move) {
      const idx = state.turn % 2;
      if (state.players[idx] !== pid) return 'Not your turn';
      const color = state.colors[pid];
      const { fromR, fromC, toR, toC } = move;
      if (fromR < 0 || fromR > 7 || fromC < 0 || fromC > 7 || toR < 0 || toR > 7 || toC < 0 || toC > 7) return 'Out of bounds';
      const piece = state.board[fromR][fromC];
      if (!piece || piece[0] !== color) return 'Not your piece';
      const target = state.board[toR][toC];
      if (target && target[0] === color) return 'Cannot capture own piece';
      return null;
    },
    apply(state, pid, move) {
      const { fromR, fromC, toR, toC } = move;
      const piece = state.board[fromR][fromC];
      const captured = state.board[toR][toC];
      const color = piece[0];

      if (captured) state.captured[color].push(captured);

      // En passant capture
      if (piece[1] === 'p' && toC !== fromC && !captured) {
        const epR = color === 'w' ? toR + 1 : toR - 1;
        if (state.board[epR][toC]) {
          state.captured[color].push(state.board[epR][toC]);
          state.board[epR][toC] = null;
        }
      }

      // Castling
      if (piece[1] === 'k' && Math.abs(toC - fromC) === 2) {
        if (toC === 6) { state.board[fromR][5] = state.board[fromR][7]; state.board[fromR][7] = null; }
        if (toC === 2) { state.board[fromR][3] = state.board[fromR][0]; state.board[fromR][0] = null; }
      }

      // Update castling rights
      if (piece[1] === 'k') { state.castling[color + 'k'] = false; state.castling[color + 'q'] = false; }
      if (piece[1] === 'r') {
        if (fromC === 0) state.castling[color + 'q'] = false;
        if (fromC === 7) state.castling[color + 'k'] = false;
      }

      // En passant tracking
      state.enPassant = (piece[1] === 'p' && Math.abs(toR - fromR) === 2) ? { row: (fromR + toR) / 2, col: toC } : null;

      state.board[toR][toC] = piece;
      state.board[fromR][fromC] = null;

      // Pawn promotion
      if (piece[1] === 'p' && (toR === 0 || toR === 7)) {
        state.board[toR][toC] = color + (move.promotion || 'q');
      }

      state.moveHistory.push({ from: [fromR, fromC], to: [toR, toC], piece, captured });
      state.turn++;
      return state;
    },
    checkEnd(state) {
      // Simplified: check if a king is captured
      let wk = false, bk = false;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (state.board[r][c] === 'wk') wk = true;
          if (state.board[r][c] === 'bk') bk = true;
        }
      }
      if (!wk) return { winner: state.players[1] };
      if (!bk) return { winner: state.players[0] };
      if (state.turn >= 200) return { winner: null, draw: true };
      return null;
    }
  },

  rps: {
    create(players) {
      return { round: 1, maxRounds: 5, players, choices: {}, scores: { [players[0]]: 0, [players[1]]: 0 }, history: [] };
    },
    validate(state, pid, move) {
      if (!state.players.includes(pid)) return 'Not in game';
      if (state.choices[pid]) return 'Already chose';
      if (!['rock', 'paper', 'scissors'].includes(move.choice)) return 'Invalid choice';
      return null;
    },
    apply(state, pid, move) {
      state.choices[pid] = move.choice;
      if (Object.keys(state.choices).length === 2) {
        const [p1, p2] = state.players;
        const c1 = state.choices[p1], c2 = state.choices[p2];
        let roundWinner = null;
        if (c1 !== c2) {
          if ((c1 === 'rock' && c2 === 'scissors') || (c1 === 'paper' && c2 === 'rock') || (c1 === 'scissors' && c2 === 'paper')) {
            roundWinner = p1; state.scores[p1]++;
          } else {
            roundWinner = p2; state.scores[p2]++;
          }
        }
        state.history.push({ round: state.round, choices: { ...state.choices }, winner: roundWinner });
        state.lastRound = { choices: { ...state.choices }, winner: roundWinner };
        state.choices = {};
        state.round++;
      }
      return state;
    },
    checkEnd(state) {
      const [p1, p2] = state.players;
      const winsNeeded = Math.ceil(state.maxRounds / 2);
      if (state.scores[p1] >= winsNeeded) return { winner: p1 };
      if (state.scores[p2] >= winsNeeded) return { winner: p2 };
      if (state.round > state.maxRounds) {
        if (state.scores[p1] > state.scores[p2]) return { winner: p1 };
        if (state.scores[p2] > state.scores[p1]) return { winner: p2 };
        return { winner: null, draw: true };
      }
      return null;
    }
  },

  trivia: {
    create(players) {
      const questions = getRandomQuestions(10);
      return { players, questions, currentQ: 0, scores: Object.fromEntries(players.map(p => [p, 0])), answered: {}, timer: 15, phase: 'question' };
    },
    validate(state, pid, move) {
      if (state.answered[pid]) return 'Already answered';
      if (move.answer < 0 || move.answer > 3) return 'Invalid answer';
      return null;
    },
    apply(state, pid, move) {
      state.answered[pid] = move.answer;
      const q = state.questions[state.currentQ];
      if (move.answer === q.correct) state.scores[pid] = (state.scores[pid] || 0) + 1;
      if (Object.keys(state.answered).length >= state.players.length) {
        state.phase = 'reveal';
        state.revealData = { correct: q.correct, answered: { ...state.answered }, scores: { ...state.scores } };
      }
      return state;
    },
    nextQuestion(state) {
      state.currentQ++;
      state.answered = {};
      state.phase = 'question';
      state.revealData = null;
      return state;
    },
    checkEnd(state) {
      if (state.currentQ >= state.questions.length) {
        let maxScore = 0, winner = null;
        for (const [pid, score] of Object.entries(state.scores)) {
          if (score > maxScore) { maxScore = score; winner = pid; }
        }
        const scores = Object.entries(state.scores);
        const allSame = scores.every(([, s]) => s === maxScore);
        if (allSame) return { winner: null, draw: true, scores: state.scores };
        return { winner, scores: state.scores };
      }
      return null;
    }
  },

  wordscramble: {
    create(players) {
      const words = getRandomWords(8);
      return { players, words, currentWord: 0, scores: Object.fromEntries(players.map(p => [p, 0])), solved: false, scrambled: scrambleWord(words[0].word), timer: 30 };
    },
    validate(state, pid, move) {
      if (state.solved) return 'Already solved';
      if (!move.guess || typeof move.guess !== 'string') return 'Invalid guess';
      return null;
    },
    apply(state, pid, move) {
      const current = state.words[state.currentWord];
      if (move.guess.toLowerCase().trim() === current.word.toLowerCase()) {
        state.scores[pid] = (state.scores[pid] || 0) + 1;
        state.solved = true;
        state.solvedBy = pid;
      }
      return state;
    },
    nextWord(state) {
      state.currentWord++;
      if (state.currentWord < state.words.length) {
        state.scrambled = scrambleWord(state.words[state.currentWord].word);
        state.solved = false;
        state.solvedBy = null;
      }
      return state;
    },
    checkEnd(state) {
      if (state.currentWord >= state.words.length) {
        let maxScore = 0, winner = null;
        for (const [pid, score] of Object.entries(state.scores)) {
          if (score > maxScore) { maxScore = score; winner = pid; }
        }
        const allSame = Object.values(state.scores).every(s => s === maxScore);
        if (allSame) return { winner: null, draw: true, scores: state.scores };
        return { winner, scores: state.scores };
      }
      return null;
    }
  },

  emojiguess: {
    create(players) {
      const puzzles = getRandomEmojiPuzzles(8);
      return { players, puzzles, currentPuzzle: 0, scores: Object.fromEntries(players.map(p => [p, 0])), solved: false, timer: 30 };
    },
    validate(state, pid, move) {
      if (state.solved) return 'Already solved';
      if (!move.guess || typeof move.guess !== 'string') return 'Invalid guess';
      return null;
    },
    apply(state, pid, move) {
      const current = state.puzzles[state.currentPuzzle];
      const guess = move.guess.toLowerCase().trim();
      const answers = current.answers.map(a => a.toLowerCase());
      if (answers.includes(guess)) {
        state.scores[pid] = (state.scores[pid] || 0) + 1;
        state.solved = true;
        state.solvedBy = pid;
      }
      return state;
    },
    nextPuzzle(state) {
      state.currentPuzzle++;
      if (state.currentPuzzle < state.puzzles.length) {
        state.solved = false;
        state.solvedBy = null;
      }
      return state;
    },
    checkEnd(state) {
      if (state.currentPuzzle >= state.puzzles.length) {
        let maxScore = 0, winner = null;
        for (const [pid, score] of Object.entries(state.scores)) {
          if (score > maxScore) { maxScore = score; winner = pid; }
        }
        const allSame = Object.values(state.scores).every(s => s === maxScore);
        if (allSame) return { winner: null, draw: true, scores: state.scores };
        return { winner, scores: state.scores };
      }
      return null;
    }
  },

  hangman: {
    create(players) {
      const words = getRandomWords(8);
      const word = words[0].word.toUpperCase();
      return { players, words, currentWord: 0, scores: Object.fromEntries(players.map(p => [p, 0])), revealed: word.split('').map(() => '_'), wrongLetters: [], maxWrong: 6, hint: words[0].hint, solved: false, solvedBy: null, failed: false, timer: 45, actualWord: word };
    },
    validate(state, pid, move) {
      if (state.solved || state.failed) return 'Round is over';
      if (!move.letter || typeof move.letter !== 'string' || move.letter.length !== 1) return 'Invalid letter';
      const letter = move.letter.toUpperCase();
      if (!/[A-Z]/.test(letter)) return 'Must be a letter';
      if (state.revealed.includes(letter) || state.wrongLetters.includes(letter)) return 'Already guessed';
      return null;
    },
    apply(state, pid, move) {
      const letter = move.letter.toUpperCase();
      const word = state.actualWord;
      let found = false;
      for (let i = 0; i < word.length; i++) {
        if (word[i] === letter) { state.revealed[i] = letter; found = true; }
      }
      if (!found) { state.wrongLetters.push(letter); }
      if (!state.revealed.includes('_')) { state.solved = true; state.solvedBy = pid; state.scores[pid] = (state.scores[pid] || 0) + 1; }
      if (state.wrongLetters.length >= state.maxWrong) { state.failed = true; }
      return state;
    },
    nextWord(state) {
      state.currentWord++;
      if (state.currentWord < state.words.length) {
        const word = state.words[state.currentWord].word.toUpperCase();
        state.actualWord = word;
        state.revealed = word.split('').map(() => '_');
        state.wrongLetters = [];
        state.hint = state.words[state.currentWord].hint;
        state.solved = false;
        state.solvedBy = null;
        state.failed = false;
      }
      return state;
    },
    checkEnd(state) {
      if (state.currentWord >= state.words.length) {
        let maxScore = 0, winner = null;
        for (const [pid, score] of Object.entries(state.scores)) {
          if (score > maxScore) { maxScore = score; winner = pid; }
        }
        const allSame = Object.values(state.scores).every(s => s === maxScore);
        if (allSame) return { winner: null, draw: true, scores: state.scores };
        return { winner, scores: state.scores };
      }
      return null;
    }
  },

  fastmath: {
    create(players) {
      const problems = generateMathProblems(10);
      return { players, problems, currentProblem: 0, totalProblems: 10, scores: Object.fromEntries(players.map(p => [p, 0])), problem: problems[0].display, solved: false, solvedBy: null, timer: 20, difficulty: problems[0].difficulty };
    },
    validate(state, pid, move) {
      if (state.solved) return 'Already solved';
      if (move.answer === undefined || move.answer === '') return 'Answer required';
      return null;
    },
    apply(state, pid, move) {
      const correct = state.problems[state.currentProblem].answer;
      if (parseInt(move.answer) === correct) {
        state.scores[pid] = (state.scores[pid] || 0) + 1;
        state.solved = true;
        state.solvedBy = pid;
      }
      return state;
    },
    nextProblem(state) {
      state.currentProblem++;
      if (state.currentProblem < state.problems.length) {
        const prob = state.problems[state.currentProblem];
        state.problem = prob.display;
        state.difficulty = prob.difficulty;
        state.solved = false;
        state.solvedBy = null;
      }
      return state;
    },
    checkEnd(state) {
      if (state.currentProblem >= state.problems.length) {
        let maxScore = 0, winner = null;
        for (const [pid, score] of Object.entries(state.scores)) {
          if (score > maxScore) { maxScore = score; winner = pid; }
        }
        const allSame = Object.values(state.scores).every(s => s === maxScore);
        if (allSame) return { winner: null, draw: true, scores: state.scores };
        return { winner, scores: state.scores };
      }
      return null;
    }
  }
};

function generateMathProblems(n) {
  const problems = [];
  for (let i = 0; i < n; i++) {
    let a, b, op, answer, display, difficulty;
    if (i < 3) {
      difficulty = 1;
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      op = Math.random() < 0.5 ? '+' : '-';
      answer = op === '+' ? a + b : a - b;
      display = `${a} ${op} ${b}`;
    } else if (i < 6) {
      difficulty = 2;
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      op = Math.random() < 0.5 ? '*' : '+';
      if (op === '*') { answer = a * b; display = `${a} × ${b}`; }
      else { a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * 50) + 10; answer = a + b; display = `${a} + ${b}`; }
    } else if (i < 9) {
      difficulty = 3;
      const ops = ['+', '-', '*'];
      op = ops[Math.floor(Math.random() * ops.length)];
      a = Math.floor(Math.random() * 25) + 5;
      b = Math.floor(Math.random() * 15) + 2;
      if (op === '+') { answer = a + b; display = `${a} + ${b}`; }
      else if (op === '-') { answer = a - b; display = `${a} - ${b}`; }
      else { answer = a * b; display = `${a} × ${b}`; }
    } else {
      difficulty = 4;
      a = Math.floor(Math.random() * 30) + 10;
      b = Math.floor(Math.random() * 15) + 2;
      const c = Math.floor(Math.random() * 20) + 1;
      answer = a * b + c;
      display = `${a} × ${b} + ${c}`;
    }
    problems.push({ display, answer, difficulty });
  }
  return problems;
}

// ═══════════════════════════════════════
// GAME DATA
// ═══════════════════════════════════════
const triviaBank = [
  { q: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1, category: "Science" },
  { q: "Who painted the Mona Lisa?", options: ["Picasso", "Van Gogh", "Da Vinci", "Monet"], correct: 2, category: "Art" },
  { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, category: "Geography" },
  { q: "In what year did the Titanic sink?", options: ["1905", "1912", "1920", "1898"], correct: 1, category: "History" },
  { q: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correct: 2, category: "Science" },
  { q: "Which country has the most natural lakes?", options: ["USA", "Brazil", "Russia", "Canada"], correct: 3, category: "Geography" },
  { q: "What is the smallest prime number?", options: ["0", "1", "2", "3"], correct: 2, category: "Math" },
  { q: "Who wrote 'Romeo and Juliet'?", options: ["Dickens", "Shakespeare", "Austen", "Hemingway"], correct: 1, category: "Literature" },
  { q: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct: 2, category: "Science" },
  { q: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correct: 1, category: "Science" },
  { q: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], correct: 2, category: "History" },
  { q: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2, category: "Geography" },
  { q: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], correct: 1, category: "Math" },
  { q: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], correct: 2, category: "Science" },
  { q: "Who discovered penicillin?", options: ["Pasteur", "Fleming", "Curie", "Darwin"], correct: 1, category: "Science" },
  { q: "What is the longest river in the world?", options: ["Amazon", "Mississippi", "Yangtze", "Nile"], correct: 3, category: "Geography" },
  { q: "In which city is the Colosseum located?", options: ["Athens", "Rome", "Istanbul", "Cairo"], correct: 1, category: "Geography" },
  { q: "What element does 'O' represent on the periodic table?", options: ["Osmium", "Oganesson", "Oxygen", "Olivine"], correct: 2, category: "Science" },
  { q: "Which animal is known as the King of the Jungle?", options: ["Tiger", "Lion", "Elephant", "Gorilla"], correct: 1, category: "Nature" },
  { q: "How many continents are there?", options: ["5", "6", "7", "8"], correct: 2, category: "Geography" },
  { q: "What is the speed of light approximately?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correct: 0, category: "Science" },
  { q: "Who developed the theory of relativity?", options: ["Newton", "Einstein", "Hawking", "Bohr"], correct: 1, category: "Science" },
  { q: "What is the capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], correct: 2, category: "Geography" },
  { q: "Which planet is closest to the sun?", options: ["Venus", "Mercury", "Mars", "Earth"], correct: 1, category: "Science" },
  { q: "What is the most spoken language in the world?", options: ["English", "Spanish", "Mandarin", "Hindi"], correct: 2, category: "Culture" },
  { q: "How many bones are in the adult human body?", options: ["196", "206", "216", "186"], correct: 1, category: "Science" },
  { q: "What is the currency of the United Kingdom?", options: ["Euro", "Dollar", "Pound Sterling", "Franc"], correct: 2, category: "Culture" },
  { q: "Who was the first person to walk on the moon?", options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"], correct: 1, category: "History" },
  { q: "What is the largest desert in the world?", options: ["Sahara", "Gobi", "Antarctic", "Arabian"], correct: 2, category: "Geography" },
  { q: "Which gas makes up most of Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"], correct: 1, category: "Science" },
  { q: "What year was the internet invented?", options: ["1969", "1975", "1983", "1990"], correct: 0, category: "Technology" },
  { q: "Who painted the Starry Night?", options: ["Monet", "Van Gogh", "Picasso", "Rembrandt"], correct: 1, category: "Art" },
  { q: "What is the largest mammal?", options: ["Elephant", "Blue Whale", "Giraffe", "Hippo"], correct: 1, category: "Nature" },
  { q: "How many players are on a soccer team?", options: ["9", "10", "11", "12"], correct: 2, category: "Sports" },
  { q: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unit"], correct: 0, category: "Technology" },
  { q: "Which country invented pizza?", options: ["France", "Greece", "Italy", "Spain"], correct: 2, category: "Culture" },
  { q: "What is the square root of 144?", options: ["10", "11", "12", "14"], correct: 2, category: "Math" },
  { q: "Who is known as the father of computers?", options: ["Alan Turing", "Charles Babbage", "Tim Berners-Lee", "Ada Lovelace"], correct: 1, category: "Technology" },
  { q: "What is the boiling point of water in Celsius?", options: ["90", "95", "100", "110"], correct: 2, category: "Science" },
  { q: "Which ocean is the Bermuda Triangle in?", options: ["Pacific", "Indian", "Atlantic", "Arctic"], correct: 2, category: "Geography" },
  { q: "What is the national animal of Scotland?", options: ["Lion", "Eagle", "Unicorn", "Dragon"], correct: 2, category: "Culture" },
  { q: "How many strings does a standard guitar have?", options: ["4", "5", "6", "7"], correct: 2, category: "Music" },
  { q: "What is the main component of the Sun?", options: ["Helium", "Hydrogen", "Oxygen", "Nitrogen"], correct: 1, category: "Science" },
  { q: "Who wrote '1984'?", options: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"], correct: 1, category: "Literature" },
  { q: "What is the tallest mountain in the world?", options: ["K2", "Kangchenjunga", "Mount Everest", "Lhotse"], correct: 2, category: "Geography" },
  { q: "What color is a ruby?", options: ["Blue", "Green", "Red", "Purple"], correct: 2, category: "General" },
  { q: "Which planet is known for its rings?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correct: 1, category: "Science" },
  { q: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Gazelle", "Horse"], correct: 1, category: "Nature" },
  { q: "In what year did Bitcoin launch?", options: ["2007", "2008", "2009", "2010"], correct: 2, category: "Technology" },
  { q: "What is sushi traditionally wrapped in?", options: ["Rice Paper", "Seaweed", "Lettuce", "Bamboo"], correct: 1, category: "Culture" }
];

function getRandomQuestions(n) {
  const shuffled = [...triviaBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const wordBank = [
  { word: "ELEPHANT", hint: "Large grey animal" },
  { word: "GUITAR", hint: "Musical instrument with strings" },
  { word: "VOLCANO", hint: "Mountain that erupts" },
  { word: "DIAMOND", hint: "Precious gemstone" },
  { word: "PENGUIN", hint: "Black and white bird" },
  { word: "PYRAMID", hint: "Ancient Egyptian structure" },
  { word: "THUNDER", hint: "Sound after lightning" },
  { word: "OCTOPUS", hint: "Sea creature with 8 arms" },
  { word: "RAINBOW", hint: "Colorful arc in the sky" },
  { word: "DOLPHIN", hint: "Intelligent sea mammal" },
  { word: "ASTRONAUT", hint: "Person who travels to space" },
  { word: "CACTUS", hint: "Desert plant with spines" },
  { word: "KANGAROO", hint: "Australian jumping animal" },
  { word: "LIBRARY", hint: "Place full of books" },
  { word: "SKELETON", hint: "Framework of bones" },
  { word: "BUTTERFLY", hint: "Insect with colorful wings" },
  { word: "TREASURE", hint: "Hidden valuable items" },
  { word: "HOSPITAL", hint: "Where doctors work" },
  { word: "SANDWICH", hint: "Bread with filling" },
  { word: "UNIVERSE", hint: "Everything that exists" },
  { word: "CHOCOLATE", hint: "Sweet brown treat" },
  { word: "SATELLITE", hint: "Object orbiting Earth" },
  { word: "MONGOOSE", hint: "Snake-fighting animal" },
  { word: "GIRAFFE", hint: "Tallest living animal" },
  { word: "COMPASS", hint: "Navigation tool pointing north" },
  { word: "TORNADO", hint: "Spinning wind funnel" },
  { word: "MYSTERY", hint: "Something unknown or puzzling" },
  { word: "BLANKET", hint: "Covers you in bed" },
  { word: "LANTERN", hint: "Portable light source" },
  { word: "PARROT", hint: "Colorful talking bird" }
];

function getRandomWords(n) {
  const shuffled = [...wordBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function scrambleWord(word) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  return result === word ? scrambleWord(word) : result;
}

const emojiBank = [
  { emojis: "🌍🔥🌡️", answers: ["global warming", "climate change"], hint: "Environmental issue", category: "Science" },
  { emojis: "👑🦁", answers: ["lion king", "king of the jungle"], hint: "Disney movie / Animal title", category: "Movies" },
  { emojis: "🕷️🧑", answers: ["spiderman", "spider-man", "spider man"], hint: "Marvel superhero", category: "Movies" },
  { emojis: "⚡🧙‍♂️", answers: ["harry potter", "wizard"], hint: "Famous wizard", category: "Movies" },
  { emojis: "🧊🚢", answers: ["titanic", "iceberg"], hint: "Famous ship disaster", category: "Movies" },
  { emojis: "🎃👻", answers: ["halloween"], hint: "Spooky holiday", category: "Holiday" },
  { emojis: "🍕🇮🇹", answers: ["italy", "italian food", "pizza"], hint: "Country and its food", category: "Food" },
  { emojis: "🌙⭐😴", answers: ["sleep", "night", "bedtime", "sleeping"], hint: "What you do at night", category: "Activity" },
  { emojis: "📱🍎", answers: ["iphone", "apple"], hint: "Tech company/product", category: "Technology" },
  { emojis: "🏀👑", answers: ["lebron", "lebron james", "king james"], hint: "Basketball legend", category: "Sports" },
  { emojis: "🎵🎤👸", answers: ["pop star", "singer", "beyonce", "taylor swift"], hint: "Famous performer", category: "Music" },
  { emojis: "🧠💡", answers: ["idea", "smart", "brainstorm", "thinking"], hint: "Mental activity", category: "Concept" },
  { emojis: "🦇🌃", answers: ["batman", "dark knight"], hint: "DC superhero", category: "Movies" },
  { emojis: "❄️👸", answers: ["frozen", "elsa", "ice queen"], hint: "Disney movie", category: "Movies" },
  { emojis: "🏠🔥🧑‍🚒", answers: ["firefighter", "fire department", "fireman"], hint: "Emergency responder", category: "Jobs" },
  { emojis: "⚽🏆🌍", answers: ["world cup", "fifa"], hint: "Global sports event", category: "Sports" },
  { emojis: "🎅🎄🎁", answers: ["christmas"], hint: "December holiday", category: "Holiday" },
  { emojis: "🚀🌙", answers: ["moon landing", "space travel", "nasa"], hint: "Space achievement", category: "Science" },
  { emojis: "🎰💰", answers: ["gambling", "casino", "jackpot", "las vegas"], hint: "Place to win money", category: "Places" },
  { emojis: "🐍✈️", answers: ["snakes on a plane"], hint: "Famous action movie", category: "Movies" },
  { emojis: "☕🌅", answers: ["morning", "breakfast", "good morning"], hint: "Start of the day", category: "Activity" },
  { emojis: "🎭😂😢", answers: ["drama", "theater", "theatre", "acting"], hint: "Performing art", category: "Art" },
  { emojis: "🏝️🌴🌊", answers: ["island", "beach", "vacation", "paradise"], hint: "Tropical destination", category: "Places" },
  { emojis: "👨‍🍳🍳🔥", answers: ["cooking", "chef", "kitchen"], hint: "Food preparation", category: "Activity" },
  { emojis: "🎓📚", answers: ["graduation", "education", "school", "university"], hint: "Academic achievement", category: "Education" },
  { emojis: "💀🌹", answers: ["romeo and juliet", "forbidden love", "romance"], hint: "Shakespeare play", category: "Literature" },
  { emojis: "🐋🌊", answers: ["whale", "ocean", "blue whale", "sea"], hint: "Marine giant", category: "Nature" },
  { emojis: "🔮✨🧙", answers: ["magic", "wizard", "sorcery", "spell"], hint: "Supernatural power", category: "Fantasy" },
  { emojis: "🎸⚡", answers: ["rock", "rock and roll", "rock music", "electric guitar"], hint: "Music genre", category: "Music" },
  { emojis: "📸😊", answers: ["selfie", "photo", "picture", "smile"], hint: "Taking a picture", category: "Activity" }
];

function getRandomEmojiPuzzles(n) {
  const shuffled = [...emojiBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ═══════════════════════════════════════
// DEBATE TIMER
// ═══════════════════════════════════════
const debateTimers = new Map();

function startDebateTimer(roomCode) {
  if (debateTimers.has(roomCode)) clearInterval(debateTimers.get(roomCode));

  const interval = setInterval(() => {
    const room = rooms.get(roomCode);
    if (!room || !room.debate || !room.debate.isRunning || room.debate.isPaused) return;

    const debate = room.debate;
    const speaker = debate.currentSpeaker;
    if (speaker === null) return;

    debate.timeUsed[speaker] = (debate.timeUsed[speaker] || 0) + 1;

    if (debate.timeUsed[speaker] >= debate.timePerPerson) {
      debate.currentSpeaker = null;
      debate.isRunning = false;
      io.to(roomCode).emit('debate-update', getRoomData(room).debate);
      io.to(roomCode).emit('debate-time-up', { participant: speaker });
      return;
    }

    io.to(roomCode).emit('debate-tick', {
      speaker,
      timeUsed: debate.timeUsed,
      timePerPerson: debate.timePerPerson
    });
  }, 1000);

  debateTimers.set(roomCode, interval);
}

// ═══════════════════════════════════════
// ROUND-BASED GAME TIMERS
// ═══════════════════════════════════════
const gameTimers = new Map();

function startGameTimer(roomCode, duration, onTimeout) {
  clearGameTimer(roomCode);
  const timer = {
    remaining: duration,
    interval: setInterval(() => {
      timer.remaining--;
      io.to(roomCode).emit('game-timer', { remaining: timer.remaining });
      if (timer.remaining <= 0) {
        clearGameTimer(roomCode);
        onTimeout();
      }
    }, 1000)
  };
  gameTimers.set(roomCode, timer);
}

function clearGameTimer(roomCode) {
  const t = gameTimers.get(roomCode);
  if (t) { clearInterval(t.interval); gameTimers.delete(roomCode); }
}

// ═══════════════════════════════════════
// SOCKET HANDLING
// ═══════════════════════════════════════
io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`);

  // ─── Room Events ───
  socket.on('create-room', ({ playerName }, cb) => {
    if (!playerName || playerName.trim().length < 1) return cb({ error: 'Name required' });
    const name = playerName.trim().slice(0, 20);
    const room = {
      code: generateCode(),
      admin: socket.id,
      players: new Map([[socket.id, { id: socket.id, name, score: 0, gamesPlayed: 0, wins: 0, avatar: ensureProfile(name).avatar, level: calculateLevel(ensureProfile(name).xp), selectedTitle: ensureProfile(name).selectedTitle }]]),
      currentGame: null,
      gameState: null,
      debate: null,
      vote: null,
      tournament: null,
      chat: [],
      createdAt: Date.now()
    };
    rooms.set(room.code, room);
    socketToRoom.set(socket.id, room.code);
    socket.join(room.code);
    const profile = ensureProfile(name);
    cb({ success: true, room: getRoomData(room), playerId: socket.id, profile: { avatar: profile.avatar, xp: profile.xp, level: calculateLevel(profile.xp), achievements: profile.achievements, streak: profile.streak } });
  });

  socket.on('join-room', ({ roomCode, playerName }, cb) => {
    if (!playerName || !roomCode) return cb({ error: 'Name and room code required' });
    const code = roomCode.toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return cb({ error: 'Room not found' });
    if (room.players.size >= 20) return cb({ error: 'Room is full' });
    const name = playerName.trim().slice(0, 20);
    const profile = ensureProfile(name);
    room.players.set(socket.id, { id: socket.id, name, score: 0, gamesPlayed: 0, wins: 0, avatar: profile.avatar, level: calculateLevel(profile.xp), selectedTitle: profile.selectedTitle });
    socketToRoom.set(socket.id, code);
    socket.join(code);
    io.to(code).emit('room-update', getRoomData(room));
    io.to(code).emit('player-joined', { id: socket.id, name, avatar: profile.avatar, level: calculateLevel(profile.xp) });
    cb({ success: true, room: getRoomData(room), playerId: socket.id, profile: { avatar: profile.avatar, xp: profile.xp, level: calculateLevel(profile.xp), achievements: profile.achievements, streak: profile.streak } });
  });

  socket.on('leave-room', () => {
    handleLeave(socket);
  });

  // ─── Rejoin after reconnect ───
  socket.on('rejoin-room', ({ roomCode, playerName }, cb) => {
    if (!roomCode || !playerName) return cb && cb({ error: 'Missing data' });
    const code = roomCode.toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return cb && cb({ error: 'Room not found' });
    // Find existing player by name
    let existingId = null;
    for (const [id, p] of room.players) {
      if (p.name === playerName && !isBot(id)) { existingId = id; break; }
    }
    if (existingId) {
      // Transfer player to new socket
      const playerData = room.players.get(existingId);
      room.players.delete(existingId);
      socketToRoom.delete(existingId);
      playerData.id = socket.id;
      room.players.set(socket.id, playerData);
      if (room.admin === existingId) room.admin = socket.id;
    } else {
      // New join
      const profile = ensureProfile(playerName);
      room.players.set(socket.id, { id: socket.id, name: playerName, score: 0, gamesPlayed: 0, wins: 0, avatar: profile.avatar, level: calculateLevel(profile.xp), selectedTitle: profile.selectedTitle });
    }
    socketToRoom.set(socket.id, code);
    socket.join(code);
    const isAdm = room.admin === socket.id;
    cb && cb({ success: true, room: getRoomData(room), playerId: socket.id, isAdmin: isAdm });
    io.to(code).emit('room-update', getRoomData(room));
  });

  socket.on('chat-message', ({ message }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    const msg = { playerName: player.name, playerId: socket.id, message: message.slice(0, 200), timestamp: Date.now() };
    room.chat.push(msg);
    if (room.chat.length > 100) room.chat.shift();
    io.to(code).emit('chat-message', msg);
    // Track messages for achievement
    const prof = ensureProfile(player.name);
    prof.messages = (prof.messages || 0) + 1;
    if (prof.messages === 50) {
      const achs = checkAchievements(player.name, null, null, null);
      achs.forEach(a => socket.emit('achievement-unlocked', a));
    }
  });

  socket.on('send-reaction', ({ emoji }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    io.to(code).emit('reaction', { playerName: player.name, emoji });
  });

  // ─── Game Events ───
  socket.on('start-game', ({ gameType, options }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id) return socket.emit('error-msg', { message: 'Only admin can start games' });

    const engine = gameEngines[gameType];
    if (!engine) return socket.emit('error-msg', { message: 'Unknown game type' });

    const playerIds = Array.from(room.players.keys());
    let gamePlayers;

    if (['tictactoe', 'connect4', 'chess', 'rps'].includes(gameType)) {
      if (playerIds.length < 2) return socket.emit('error-msg', { message: 'Need at least 2 players' });
      // For 2-player games, admin picks or first two
      if (options && options.players && options.players.length === 2) {
        gamePlayers = options.players;
      } else {
        gamePlayers = playerIds.slice(0, 2);
      }
    } else {
      gamePlayers = playerIds;
    }

    const state = engine.create(gamePlayers);

    // Apply custom settings
    if (options) {
      if (options.timer && typeof options.timer === 'number' && state.timer !== undefined) state.timer = Math.max(5, Math.min(120, options.timer));
      if (options.rounds && typeof options.rounds === 'number') {
        const r = Math.max(1, Math.min(20, options.rounds));
        if (gameType === 'rps') state.maxRounds = r;
        if (state.questions) state.questions = state.questions.slice(0, r);
        if (state.words) state.words = state.words.slice(0, r);
        if (state.puzzles) state.puzzles = state.puzzles.slice(0, r);
        if (state.problems) { state.problems = state.problems.slice(0, r); state.totalProblems = r; }
      }
    }

    room.currentGame = gameType;
    room.gameState = state;

    const playerNames = {};
    for (const pid of gamePlayers) {
      const p = room.players.get(pid);
      if (p) playerNames[pid] = p.name;
    }

    io.to(code).emit('game-started', { gameType, state: sanitizeState(gameType, state), players: playerNames, gamePlayers });

    // Start timer for timed games
    if (['trivia', 'wordscramble', 'emojiguess', 'hangman', 'fastmath'].includes(gameType)) {
      startGameTimer(code, state.timer, () => {
        handleGameTimeout(code, gameType);
      });
    }

    // Schedule bot moves after game starts
    scheduleBotMoves(code, gameType);
  });

  socket.on('game-move', ({ move }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || !room.currentGame || !room.gameState) return;

    const engine = gameEngines[room.currentGame];
    if (!engine) return;

    const error = engine.validate(room.gameState, socket.id, move);
    if (error) return socket.emit('error-msg', { message: error });

    engine.apply(room.gameState, socket.id, move);
    io.to(code).emit('game-update', { state: sanitizeState(room.currentGame, room.gameState), lastMove: move, playerId: socket.id });

    const result = engine.checkEnd(room.gameState);
    if (result) {
      endGame(code, room, result);
    } else if (room.gameState.phase === 'reveal' && ['trivia'].includes(room.currentGame)) {
      clearGameTimer(code); clearBotTimers(code);
      setTimeout(() => {
        if (!room.currentGame) return;
        engine.nextQuestion(room.gameState);
        const endCheck = engine.checkEnd(room.gameState);
        if (endCheck) { endGame(code, room, endCheck); return; }
        io.to(code).emit('game-update', { state: sanitizeState(room.currentGame, room.gameState) });
        startGameTimer(code, room.gameState.timer, () => handleGameTimeout(code, room.currentGame));
        scheduleBotMoves(code, room.currentGame);
      }, 3000);
    } else if (room.gameState.solved && ['wordscramble', 'emojiguess', 'hangman', 'fastmath'].includes(room.currentGame)) {
      clearGameTimer(code); clearBotTimers(code);
      setTimeout(() => {
        if (!room.currentGame) return;
        if (engine.nextPuzzle) engine.nextPuzzle(room.gameState);
        else if (engine.nextWord) engine.nextWord(room.gameState);
        else if (engine.nextProblem) engine.nextProblem(room.gameState);
        const endCheck = engine.checkEnd(room.gameState);
        if (endCheck) { endGame(code, room, endCheck); return; }
        io.to(code).emit('game-update', { state: sanitizeState(room.currentGame, room.gameState) });
        startGameTimer(code, room.gameState.timer, () => handleGameTimeout(code, room.currentGame));
        scheduleBotMoves(code, room.currentGame);
      }, 2500);
    } else if (room.gameState.failed && room.currentGame === 'hangman') {
      clearGameTimer(code); clearBotTimers(code);
      setTimeout(() => {
        if (!room.currentGame) return;
        engine.nextWord(room.gameState);
        const endCheck = engine.checkEnd(room.gameState);
        if (endCheck) { endGame(code, room, endCheck); return; }
        io.to(code).emit('game-update', { state: sanitizeState(room.currentGame, room.gameState) });
        startGameTimer(code, room.gameState.timer, () => handleGameTimeout(code, room.currentGame));
        scheduleBotMoves(code, room.currentGame);
      }, 3000);
    } else {
      // For turn-based games (tictactoe, connect4, chess) — schedule bot after human move
      scheduleBotMoves(code, room.currentGame);
    }
  });

  socket.on('end-game', () => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id) return;
    clearGameTimer(code);
    room.currentGame = null;
    room.gameState = null;
    io.to(code).emit('game-ended', {});
    io.to(code).emit('room-update', getRoomData(room));
  });

  // ─── Debate Events ───
  socket.on('create-debate', ({ topic, participants, timePerPerson }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id) return socket.emit('error-msg', { message: 'Only admin can create debates' });

    room.debate = {
      topic: topic || 'Open Discussion',
      participants: participants || Array.from(room.players.keys()),
      timePerPerson: timePerPerson || 120,
      currentSpeaker: null,
      timeUsed: {},
      isRunning: false,
      isPaused: false,
      createdAt: Date.now()
    };

    for (const pid of room.debate.participants) {
      room.debate.timeUsed[pid] = 0;
    }

    io.to(code).emit('debate-update', getRoomData(room).debate);
    io.to(code).emit('room-update', getRoomData(room));
  });

  socket.on('debate-action', ({ action, data }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id || !room.debate) return;

    const debate = room.debate;

    switch (action) {
      case 'set-speaker':
        debate.currentSpeaker = data.participantId;
        debate.isRunning = true;
        debate.isPaused = false;
        startDebateTimer(code);
        break;
      case 'pause':
        debate.isPaused = true;
        break;
      case 'resume':
        debate.isPaused = false;
        break;
      case 'stop':
        debate.currentSpeaker = null;
        debate.isRunning = false;
        debate.isPaused = false;
        if (debateTimers.has(code)) { clearInterval(debateTimers.get(code)); debateTimers.delete(code); }
        break;
      case 'reset':
        for (const pid of debate.participants) debate.timeUsed[pid] = 0;
        debate.currentSpeaker = null;
        debate.isRunning = false;
        debate.isPaused = false;
        if (debateTimers.has(code)) { clearInterval(debateTimers.get(code)); debateTimers.delete(code); }
        break;
      case 'end':
        room.debate = null;
        if (debateTimers.has(code)) { clearInterval(debateTimers.get(code)); debateTimers.delete(code); }
        break;
    }

    io.to(code).emit('debate-update', room.debate ? getRoomData(room).debate : null);
    io.to(code).emit('room-update', getRoomData(room));
  });

  // ─── Profile Events ───
  socket.on('update-profile', ({ avatar }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    if (avatar && AVATARS.includes(avatar)) {
      player.avatar = avatar;
      const p = ensureProfile(player.name);
      p.avatar = avatar;
      saveLeaderboard(leaderboard);
      io.to(code).emit('room-update', getRoomData(room));
    }
  });

  socket.on('get-profile', ({ name }, cb) => {
    const p = ensureProfile(name);
    let favoriteGame = null, maxPlayed = 0;
    for (const [game, stats] of Object.entries(p.gameStats || {})) { if (stats.played > maxPlayed) { maxPlayed = stats.played; favoriteGame = game; } }
    const winRate = p.gamesPlayed > 0 ? Math.round((p.wins / p.gamesPlayed) * 100) : 0;
    cb({ name: p.name, avatar: p.avatar, xp: p.xp || 0, level: calculateLevel(p.xp), achievements: p.achievements || [], streak: p.streak || 0, maxStreak: p.maxStreak || 0, totalPoints: p.totalPoints, gamesPlayed: p.gamesPlayed, wins: p.wins, losses: p.losses, draws: p.draws, gameStats: p.gameStats, selectedTitle: p.selectedTitle, favoriteGame, winRate, dailyChallenge: p.dailyChallenge });
  });

  socket.on('select-title', ({ titleId }, cb) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room) return cb && cb({ error: 'Not in room' });
    const player = room.players.get(socket.id);
    if (!player) return;
    const p = ensureProfile(player.name);
    if (titleId !== null && !p.achievements.includes(titleId)) return cb && cb({ error: 'Not earned' });
    p.selectedTitle = titleId;
    player.selectedTitle = titleId;
    saveLeaderboard(leaderboard);
    io.to(code).emit('room-update', getRoomData(room));
    if (cb) cb({ success: true });
  });

  // ─── Admin: Kick Player ───
  socket.on('kick-player', ({ targetId }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id) return;
    if (targetId === socket.id) return;
    const target = room.players.get(targetId);
    if (!target) return;
    const targetSocket = io.sockets.sockets.get(targetId);
    room.players.delete(targetId);
    socketToRoom.delete(targetId);
    if (targetSocket) {
      targetSocket.leave(code);
      targetSocket.emit('player-kicked', { message: 'You have been kicked from the room' });
    }
    io.to(code).emit('player-left', { playerId: targetId, kicked: true, name: target.name });
    io.to(code).emit('room-update', getRoomData(room));
  });

  // ─── Bots ───
  socket.on('add-bot', ({ difficulty }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id) return;
    const diff = ['easy','medium','hard'].includes(difficulty) ? difficulty : 'medium';
    const bot = addBotToRoom(room, diff);
    if (!bot) return socket.emit('error-msg', { message: 'Room is full' });
    io.to(code).emit('room-update', getRoomData(room));
    io.to(code).emit('player-joined', { id: bot.id, name: bot.name, avatar: '🤖', level: 0, isBot: true });
  });

  socket.on('remove-bot', ({ botId }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id || !isBot(botId)) return;
    removeBotFromRoom(room, botId);
    io.to(code).emit('player-left', { playerId: botId });
    io.to(code).emit('room-update', getRoomData(room));
  });

  socket.on('remove-all-bots', () => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id) return;
    removeAllBotsFromRoom(room);
    io.to(code).emit('room-update', getRoomData(room));
  });

  // (rematch is handled client-side via start-game)

  // ─── Voting ───
  socket.on('create-vote', () => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id) return;
    room.vote = {
      options: ['tictactoe', 'connect4', 'chess', 'rps', 'trivia', 'wordscramble', 'emojiguess', 'hangman', 'fastmath'],
      votes: {},
      voters: new Set(),
      createdAt: Date.now(),
      timer: 15
    };
    io.to(code).emit('vote-update', { options: room.vote.options, votes: {}, timer: 15 });
    // Auto-close vote after 15s
    setTimeout(() => {
      if (room.vote) {
        const results = {};
        for (const opt of room.vote.options) results[opt] = 0;
        for (const [, opt] of Object.entries(room.vote.votes)) results[opt] = (results[opt] || 0) + 1;
        io.to(code).emit('vote-result', { results });
        room.vote = null;
        io.to(code).emit('room-update', getRoomData(room));
      }
    }, 16000);
  });

  socket.on('cast-vote', ({ option }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || !room.vote) return;
    if (room.vote.voters.has(socket.id)) return;
    room.vote.votes[socket.id] = option;
    room.vote.voters.add(socket.id);
    // Tally
    const tally = {};
    for (const opt of room.vote.options) tally[opt] = 0;
    for (const [, opt] of Object.entries(room.vote.votes)) tally[opt] = (tally[opt] || 0) + 1;
    io.to(code).emit('vote-update', { options: room.vote.options, votes: tally, timer: room.vote.timer, totalVoters: room.vote.voters.size });
    // If all voted, close early
    if (room.vote.voters.size >= room.players.size) {
      io.to(code).emit('vote-result', { results: tally });
      room.vote = null;
      io.to(code).emit('room-update', getRoomData(room));
    }
  });

  // ─── Tournament ───
  socket.on('start-tournament', ({ gameType }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id) return;
    const engine = gameEngines[gameType];
    if (!engine) return;
    const playerIds = Array.from(room.players.keys());
    if (playerIds.length < 2) return socket.emit('error-msg', { message: 'Need at least 2 players' });

    // Build bracket
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    const rounds = Math.ceil(Math.log2(shuffled.length));
    const bracketSize = Math.pow(2, rounds);
    const bracket = [];
    for (let i = 0; i < bracketSize; i += 2) {
      bracket.push({ p1: shuffled[i] || null, p2: shuffled[i + 1] || null, winner: null, played: false });
    }
    // Auto-advance byes
    for (const match of bracket) {
      if (match.p1 && !match.p2) { match.winner = match.p1; match.played = true; }
      if (!match.p1 && match.p2) { match.winner = match.p2; match.played = true; }
    }
    const playerNames = {};
    for (const [id, p] of room.players) playerNames[id] = p.name;
    room.tournament = { gameType, bracket: [bracket], currentRound: 0, playerNames, champion: null };
    io.to(code).emit('tournament-update', room.tournament);
    io.to(code).emit('room-update', getRoomData(room));
  });

  socket.on('tournament-match', ({ matchIndex }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id || !room.tournament) return;
    const t = room.tournament;
    const currentBracket = t.bracket[t.currentRound];
    if (!currentBracket || matchIndex >= currentBracket.length) return;
    const match = currentBracket[matchIndex];
    if (match.played || !match.p1 || !match.p2) return;
    // Start the game between these two players
    const engine = gameEngines[t.gameType];
    const gamePlayers = [match.p1, match.p2];
    const state = engine.create(gamePlayers);
    room.currentGame = t.gameType;
    room.gameState = state;
    room._tournamentMatchIndex = matchIndex;
    const playerNames = {};
    for (const pid of gamePlayers) { const p = room.players.get(pid); if (p) playerNames[pid] = p.name; }
    io.to(code).emit('game-started', { gameType: t.gameType, state: sanitizeState(t.gameType, state), players: playerNames, gamePlayers, tournament: true });
    if (['trivia', 'wordscramble', 'emojiguess', 'hangman', 'fastmath'].includes(t.gameType)) {
      startGameTimer(code, state.timer, () => handleGameTimeout(code, t.gameType));
    }
  });

  // ─── Disconnect ───
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`);
    handleLeave(socket);
  });
});

function handleLeave(socket) {
  const code = socketToRoom.get(socket.id);
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;

  room.players.delete(socket.id);
  socketToRoom.delete(socket.id);
  socket.leave(code);

  // If only bots remain, destroy room
  const hasHumans = Array.from(room.players.keys()).some(id => !isBot(id));
  if (room.players.size === 0 || !hasHumans) {
    clearBotTimers(code);
    rooms.delete(code);
    clearGameTimer(code);
    if (debateTimers.has(code)) { clearInterval(debateTimers.get(code)); debateTimers.delete(code); }
    return;
  }

  if (room.admin === socket.id) {
    // Pick non-bot admin
    let newAdmin = null;
    for (const [id] of room.players) { if (!isBot(id)) { newAdmin = id; break; } }
    room.admin = newAdmin || room.players.keys().next().value;
    io.to(code).emit('new-admin', { adminId: room.admin });
  }

  io.to(code).emit('player-left', { playerId: socket.id });
  io.to(code).emit('room-update', getRoomData(room));
}

function endGame(code, room, result) {
  clearGameTimer(code);
  clearBotTimers(code);
  const playerNames = {};
  for (const [id, p] of room.players) playerNames[id] = p.name;

  if (result.winner) {
    const winner = room.players.get(result.winner);
    if (winner) {
      winner.score += 3;
      winner.wins++;
      winner.gamesPlayed++;
      updateLeaderboard(winner.name, room.currentGame, 'win');
    }
    for (const [id, p] of room.players) {
      if (id !== result.winner && room.gameState.players.includes(id)) {
        p.gamesPlayed++;
        updateLeaderboard(p.name, room.currentGame, 'loss');
      }
    }
  } else if (result.draw) {
    for (const [id, p] of room.players) {
      if (room.gameState.players.includes(id)) {
        p.score += 1;
        p.gamesPlayed++;
        updateLeaderboard(p.name, room.currentGame, 'draw');
      }
    }
  }

  // For multi-player games with individual scores
  if (result.scores) {
    for (const [pid, score] of Object.entries(result.scores)) {
      const p = room.players.get(pid);
      if (p) p.score += score;
    }
  }

  // XP and achievements
  const gameType = room.currentGame;
  if (result.winner) {
    const wName = playerNames[result.winner];
    if (wName && !isBot(result.winner)) {
      addXP(wName, 30);
      const p = ensureProfile(wName);
      p.streak = (p.streak || 0) + 1;
      if (p.streak > (p.maxStreak || 0)) p.maxStreak = p.streak;
      saveLeaderboard(leaderboard);
      const achs = checkAchievements(wName, gameType, 'win', room.gameState);
      achs.forEach(a => {
        const ws = Array.from(room.players.entries()).find(([, v]) => v.name === wName);
        if (ws) io.to(ws[0]).emit('achievement-unlocked', a);
      });
    }
    for (const [id, p] of room.players) {
      if (id !== result.winner && room.gameState.players.includes(id) && !isBot(id)) {
        addXP(p.name, 5);
        const prof = ensureProfile(p.name);
        prof.streak = 0;
        saveLeaderboard(leaderboard);
      }
    }
  } else if (result.draw) {
    for (const [id, p] of room.players) {
      if (room.gameState.players.includes(id)) {
        addXP(p.name, 10);
      }
    }
  }

  // Daily challenge progress
  const dc = getDailyChallenge();
  for (const [id, p] of room.players) {
    if (isBot(id) || !room.gameState.players.includes(id)) continue;
    const prof = ensureProfile(p.name);
    const pdc = prof.dailyChallenge;
    if (!pdc || pdc.completed) continue;
    if (dc.type === 'win_games' && id === result.winner) pdc.progress++;
    else if (dc.type === 'play_games') pdc.progress++;
    else if (dc.type === 'play_types') {
      if (!pdc.typesPlayed) pdc.typesPlayed = [];
      if (!pdc.typesPlayed.includes(gameType)) { pdc.typesPlayed.push(gameType); pdc.progress = pdc.typesPlayed.length; }
    }
    else if (dc.type === 'win_streak' && id === result.winner) pdc.progress = Math.max(pdc.progress, prof.streak);
    else if (dc.type === 'trivia_7' && gameType === 'trivia' && result.scores && (result.scores[id] || 0) >= 7) pdc.progress = 7;
    else if (dc.type === 'chess_win' && gameType === 'chess' && id === result.winner) pdc.progress++;
    else if (dc.type === 'math_8' && gameType === 'fastmath' && result.scores && (result.scores[id] || 0) >= 8) pdc.progress = 8;
    if (pdc.progress >= dc.target && !pdc.completed) {
      pdc.completed = true;
      addXP(p.name, dc.reward);
      io.to(id).emit('daily-challenge-complete', { reward: dc.reward });
    }
    saveLeaderboard(leaderboard);
  }

  // Enriched podium data
  const podiumPlayers = {};
  for (const [id, p] of room.players) {
    if (room.gameState.players.includes(id)) {
      const prof = isBot(id) ? null : ensureProfile(p.name);
      podiumPlayers[id] = { name: p.name, avatar: p.avatar || (isBot(id) ? '🤖' : '😎'), level: p.level || 0, isBot: isBot(id), selectedTitle: prof ? prof.selectedTitle : null };
    }
  }

  // Tournament progression
  let tournamentData = null;
  if (room.tournament && room._tournamentMatchIndex !== undefined) {
    const t = room.tournament;
    const mi = room._tournamentMatchIndex;
    const currentBracket = t.bracket[t.currentRound];
    if (currentBracket && currentBracket[mi]) {
      currentBracket[mi].winner = result.winner || currentBracket[mi].p1;
      currentBracket[mi].played = true;
    }
    // Check if round is complete
    if (currentBracket.every(m => m.played)) {
      const winners = currentBracket.map(m => m.winner).filter(Boolean);
      if (winners.length === 1) {
        t.champion = winners[0];
        const champName = playerNames[winners[0]];
        if (champName) {
          addXP(champName, 100);
          const wp = room.players.get(winners[0]);
          if (wp) wp.score += 10;
          updateLeaderboard(champName, gameType, 'win');
          const achs = checkAchievements(champName, gameType, 'win', null);
          const achList = [...achs];
          const chProf = ensureProfile(champName);
          if (!chProf.achievements.includes('champion')) {
            chProf.achievements.push('champion');
            achList.push(ACHIEVEMENTS.find(a => a.id === 'champion'));
          }
          saveLeaderboard(leaderboard);
          achList.forEach(a => { if (a) io.to(winners[0]).emit('achievement-unlocked', a); });
        }
      } else {
        // Build next round
        const nextBracket = [];
        for (let i = 0; i < winners.length; i += 2) {
          nextBracket.push({ p1: winners[i] || null, p2: winners[i + 1] || null, winner: null, played: false });
          if (winners[i] && !winners[i + 1]) { nextBracket[nextBracket.length - 1].winner = winners[i]; nextBracket[nextBracket.length - 1].played = true; }
        }
        t.bracket.push(nextBracket);
        t.currentRound++;
      }
    }
    delete room._tournamentMatchIndex;
    tournamentData = t;
  }

  io.to(code).emit('game-over', {
    winner: result.winner,
    winnerName: result.winner ? playerNames[result.winner] : null,
    draw: result.draw || false,
    scores: result.scores || null,
    line: result.line || null,
    playerNames,
    podiumPlayers,
    gameType,
    tournament: !!tournamentData
  });

  room.currentGame = null;
  room.gameState = null;
  setTimeout(() => {
    io.to(code).emit('room-update', getRoomData(room));
    if (tournamentData) io.to(code).emit('tournament-update', tournamentData);
  }, 100);
}

function handleGameTimeout(code, gameType) {
  const room = rooms.get(code);
  if (!room || !room.gameState) return;

  const engine = gameEngines[gameType];
  if (!engine) return;

  if (['trivia'].includes(gameType)) {
    room.gameState.phase = 'reveal';
    const q = room.gameState.questions[room.gameState.currentQ];
    room.gameState.revealData = { correct: q.correct, answered: { ...room.gameState.answered }, scores: { ...room.gameState.scores } };
    io.to(code).emit('game-update', { state: sanitizeState(gameType, room.gameState) });
    setTimeout(() => {
      if (!room.currentGame) return;
      engine.nextQuestion(room.gameState);
      const endCheck = engine.checkEnd(room.gameState);
      if (endCheck) { endGame(code, room, endCheck); return; }
      io.to(code).emit('game-update', { state: sanitizeState(gameType, room.gameState) });
      startGameTimer(code, room.gameState.timer, () => handleGameTimeout(code, gameType));
    }, 3000);
  } else if (['wordscramble'].includes(gameType)) {
    io.to(code).emit('game-update', { state: sanitizeState(gameType, room.gameState), timeout: true });
    setTimeout(() => {
      if (!room.currentGame) return;
      engine.nextWord(room.gameState);
      const endCheck = engine.checkEnd(room.gameState);
      if (endCheck) { endGame(code, room, endCheck); return; }
      io.to(code).emit('game-update', { state: sanitizeState(gameType, room.gameState) });
      startGameTimer(code, room.gameState.timer, () => handleGameTimeout(code, gameType));
    }, 2500);
  } else if (['emojiguess'].includes(gameType)) {
    io.to(code).emit('game-update', { state: sanitizeState(gameType, room.gameState), timeout: true });
    setTimeout(() => {
      if (!room.currentGame) return;
      engine.nextPuzzle(room.gameState);
      const endCheck = engine.checkEnd(room.gameState);
      if (endCheck) { endGame(code, room, endCheck); return; }
      io.to(code).emit('game-update', { state: sanitizeState(gameType, room.gameState) });
      startGameTimer(code, room.gameState.timer, () => handleGameTimeout(code, gameType));
    }, 2500);
  } else if (gameType === 'hangman') {
    room.gameState.failed = true;
    io.to(code).emit('game-update', { state: sanitizeState(gameType, room.gameState), timeout: true });
    setTimeout(() => {
      if (!room.currentGame) return;
      engine.nextWord(room.gameState);
      const endCheck = engine.checkEnd(room.gameState);
      if (endCheck) { endGame(code, room, endCheck); return; }
      io.to(code).emit('game-update', { state: sanitizeState(gameType, room.gameState) });
      startGameTimer(code, room.gameState.timer, () => handleGameTimeout(code, gameType));
    }, 3000);
  } else if (gameType === 'fastmath') {
    io.to(code).emit('game-update', { state: sanitizeState(gameType, room.gameState), timeout: true });
    setTimeout(() => {
      if (!room.currentGame) return;
      engine.nextProblem(room.gameState);
      const endCheck = engine.checkEnd(room.gameState);
      if (endCheck) { endGame(code, room, endCheck); return; }
      io.to(code).emit('game-update', { state: sanitizeState(gameType, room.gameState) });
      startGameTimer(code, room.gameState.timer, () => handleGameTimeout(code, gameType));
    }, 2500);
  }
}

function sanitizeState(gameType, state) {
  if (gameType === 'rps') {
    const s = { ...state };
    const pending = {};
    for (const [k, v] of Object.entries(s.choices)) pending[k] = v ? true : false;
    s.pendingChoices = pending;
    if (Object.keys(s.choices).length < 2) s.choices = {};
    return s;
  }
  if (gameType === 'trivia') {
    const s = { ...state };
    if (s.phase === 'question') {
      s.currentQuestion = { ...s.questions[s.currentQ] };
      delete s.currentQuestion.correct;
    } else {
      s.currentQuestion = s.questions[s.currentQ];
    }
    s.totalQuestions = s.questions.length;
    delete s.questions;
    return s;
  }
  if (gameType === 'wordscramble') {
    const s = { ...state };
    s.hint = s.words[s.currentWord]?.hint;
    s.totalWords = s.words.length;
    delete s.words;
    return s;
  }
  if (gameType === 'emojiguess') {
    const s = { ...state };
    s.currentEmojis = s.puzzles[s.currentPuzzle]?.emojis;
    s.hint = s.puzzles[s.currentPuzzle]?.hint;
    s.category = s.puzzles[s.currentPuzzle]?.category;
    s.totalPuzzles = s.puzzles.length;
    if (s.solved) s.answer = s.puzzles[s.currentPuzzle]?.answers[0];
    delete s.puzzles;
    return s;
  }
  if (gameType === 'hangman') {
    const s = { ...state };
    s.totalWords = s.words.length;
    delete s.words;
    delete s.actualWord;
    if (s.failed) s.revealedWord = state.actualWord;
    return s;
  }
  if (gameType === 'fastmath') {
    const s = { ...state };
    s.totalProblems = s.problems.length;
    if (s.solved) s.correctAnswer = s.problems[s.currentProblem]?.answer;
    delete s.problems;
    return s;
  }
  return state;
}

// ═══════════════════════════════════════
// REST API
// ═══════════════════════════════════════
app.get('/api/leaderboard', (req, res) => {
  const sorted = Object.values(leaderboard).sort((a, b) => b.totalPoints - a.totalPoints).map(p => ({
    ...p, avatar: p.avatar || '😎', level: calculateLevel(p.xp), streak: p.streak || 0
  }));
  res.json(sorted.slice(0, 100));
});

app.get('/api/leaderboard/:gameType', (req, res) => {
  const { gameType } = req.params;
  const filtered = Object.values(leaderboard)
    .filter(p => p.gameStats[gameType])
    .map(p => ({ name: p.name, ...p.gameStats[gameType] }))
    .sort((a, b) => b.points - a.points);
  res.json(filtered.slice(0, 100));
});

app.get('/api/player/:name', (req, res) => {
  const p = ensureProfile(req.params.name);
  res.json({ name: p.name, avatar: p.avatar, xp: p.xp || 0, level: calculateLevel(p.xp), achievements: p.achievements || [], streak: p.streak || 0, maxStreak: p.maxStreak || 0, totalPoints: p.totalPoints, gamesPlayed: p.gamesPlayed, wins: p.wins, losses: p.losses, draws: p.draws, gameStats: p.gameStats });
});

app.get('/api/achievements', (req, res) => {
  res.json(ACHIEVEMENTS);
});

app.get('/api/daily-challenge', (req, res) => {
  res.json(getDailyChallenge());
});

app.get('/api/titles', (req, res) => {
  res.json(TITLE_MAP);
});

app.get('/api/rooms', (req, res) => {
  const roomList = [];
  for (const [code, room] of rooms) {
    roomList.push({ code, playerCount: room.players.size, currentGame: room.currentGame, hasDebate: !!room.debate });
  }
  res.json(roomList);
});

// ═══════════════════════════════════════
// START
// ═══════════════════════════════════════
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n  ╔══════════════════════════════════════╗`);
    console.log(`  ║   🎮 SpaceGames Server Running       ║`);
    console.log(`  ║   http://localhost:${PORT}              ║`);
    console.log(`  ╚══════════════════════════════════════╝\n`);
  });
} else {
  server.listen(PORT);
}
module.exports = app;
