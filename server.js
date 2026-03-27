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
  return p;
}

function calculateLevel(xp) { return Math.floor(Math.sqrt((xp || 0) / 100)) + 1; }

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
      players: new Map([[socket.id, { id: socket.id, name, score: 0, gamesPlayed: 0, wins: 0, avatar: ensureProfile(name).avatar, level: calculateLevel(ensureProfile(name).xp) }]]),
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
    room.players.set(socket.id, { id: socket.id, name, score: 0, gamesPlayed: 0, wins: 0, avatar: profile.avatar, level: calculateLevel(profile.xp) });
    socketToRoom.set(socket.id, code);
    socket.join(code);
    io.to(code).emit('room-update', getRoomData(room));
    io.to(code).emit('player-joined', { id: socket.id, name, avatar: profile.avatar, level: calculateLevel(profile.xp) });
    cb({ success: true, room: getRoomData(room), playerId: socket.id, profile: { avatar: profile.avatar, xp: profile.xp, level: calculateLevel(profile.xp), achievements: profile.achievements, streak: profile.streak } });
  });

  socket.on('leave-room', () => {
    handleLeave(socket);
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
      // For trivia, wait then move to next question
      clearGameTimer(code);
      setTimeout(() => {
        if (!room.currentGame) return;
        engine.nextQuestion(room.gameState);
        const endCheck = engine.checkEnd(room.gameState);
        if (endCheck) { endGame(code, room, endCheck); return; }
        io.to(code).emit('game-update', { state: sanitizeState(room.currentGame, room.gameState) });
        startGameTimer(code, room.gameState.timer, () => handleGameTimeout(code, room.currentGame));
      }, 3000);
    } else if (room.gameState.solved && ['wordscramble', 'emojiguess', 'hangman', 'fastmath'].includes(room.currentGame)) {
      clearGameTimer(code);
      setTimeout(() => {
        if (!room.currentGame) return;
        if (engine.nextPuzzle) engine.nextPuzzle(room.gameState);
        else if (engine.nextWord) engine.nextWord(room.gameState);
        else if (engine.nextProblem) engine.nextProblem(room.gameState);
        const endCheck = engine.checkEnd(room.gameState);
        if (endCheck) { endGame(code, room, endCheck); return; }
        io.to(code).emit('game-update', { state: sanitizeState(room.currentGame, room.gameState) });
        startGameTimer(code, room.gameState.timer, () => handleGameTimeout(code, room.currentGame));
      }, 2500);
    } else if (room.gameState.failed && room.currentGame === 'hangman') {
      clearGameTimer(code);
      setTimeout(() => {
        if (!room.currentGame) return;
        engine.nextWord(room.gameState);
        const endCheck = engine.checkEnd(room.gameState);
        if (endCheck) { endGame(code, room, endCheck); return; }
        io.to(code).emit('game-update', { state: sanitizeState(room.currentGame, room.gameState) });
        startGameTimer(code, room.gameState.timer, () => handleGameTimeout(code, room.currentGame));
      }, 3000);
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
    cb({ name: p.name, avatar: p.avatar, xp: p.xp || 0, level: calculateLevel(p.xp), achievements: p.achievements || [], streak: p.streak || 0, maxStreak: p.maxStreak || 0, totalPoints: p.totalPoints, gamesPlayed: p.gamesPlayed, wins: p.wins, losses: p.losses, draws: p.draws, gameStats: p.gameStats });
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

  // ─── Rematch ───
  socket.on('request-rematch', ({ gameType }) => {
    const code = socketToRoom.get(socket.id);
    const room = code && rooms.get(code);
    if (!room || room.admin !== socket.id) return;
    const engine = gameEngines[gameType];
    if (!engine) return;
    socket.emit('start-game', { gameType });
  });

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

  if (room.players.size === 0) {
    rooms.delete(code);
    clearGameTimer(code);
    if (debateTimers.has(code)) { clearInterval(debateTimers.get(code)); debateTimers.delete(code); }
    return;
  }

  if (room.admin === socket.id) {
    room.admin = room.players.keys().next().value;
    io.to(code).emit('new-admin', { adminId: room.admin });
  }

  io.to(code).emit('player-left', { playerId: socket.id });
  io.to(code).emit('room-update', getRoomData(room));
}

function endGame(code, room, result) {
  clearGameTimer(code);
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
    if (wName) {
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
      if (id !== result.winner && room.gameState.players.includes(id)) {
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
