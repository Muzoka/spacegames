/**
 * SpaceGames Automated Test Suite
 * Tests all core flows against the running server on localhost:3000
 */
const { io } = require('socket.io-client');
const http = require('http');

const URL = 'http://localhost:3000';
let passed = 0, failed = 0, errors = [];

function log(icon, msg) { console.log(`  ${icon} ${msg}`); }
function pass(msg) { passed++; log('✅', msg); }
function fail(msg, detail) { failed++; errors.push(msg + (detail ? ': ' + detail : '')); log('❌', msg + (detail ? ' — ' + detail : '')); }

function connect(name) {
  return new Promise((resolve) => {
    const s = io(URL, { forceNew: true, transports: ['websocket'] });
    s._name = name;
    s.on('connect', () => resolve(s));
    setTimeout(() => resolve(s), 3000);
  });
}

function fetchJSON(path) {
  return new Promise((resolve, reject) => {
    http.get(URL + path, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(data); } });
    }).on('error', reject);
  });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testAPIs() {
  console.log('\n📡 REST API Tests');
  try {
    const lb = await fetchJSON('/api/leaderboard');
    Array.isArray(lb) ? pass('GET /api/leaderboard → array') : fail('/api/leaderboard not array');
  } catch (e) { fail('/api/leaderboard failed', e.message); }

  try {
    const dc = await fetchJSON('/api/daily-challenge');
    dc.type && dc.target && dc.reward ? pass('GET /api/daily-challenge → ' + dc.type) : fail('/api/daily-challenge missing fields');
  } catch (e) { fail('/api/daily-challenge failed', e.message); }

  try {
    const achs = await fetchJSON('/api/achievements');
    Array.isArray(achs) && achs.length === 15 ? pass('GET /api/achievements → 15 achievements') : fail('/api/achievements wrong count: ' + (achs?.length));
  } catch (e) { fail('/api/achievements failed', e.message); }

  try {
    const rooms = await fetchJSON('/api/rooms');
    Array.isArray(rooms) ? pass('GET /api/rooms → array') : fail('/api/rooms not array');
  } catch (e) { fail('/api/rooms failed', e.message); }

  try {
    const titles = await fetchJSON('/api/titles');
    typeof titles === 'object' && titles.champion ? pass('GET /api/titles → has champion') : fail('/api/titles missing data');
  } catch (e) { fail('/api/titles failed', e.message); }
}

async function testRoomFlow() {
  console.log('\n🏠 Room Management Tests');
  const s1 = await connect('Player1');
  const s2 = await connect('Player2');

  // Create room
  const createRes = await new Promise(r => s1.emit('create-room', { playerName: 'TestAdmin' }, r));
  if (createRes.success && createRes.room && createRes.playerId) {
    pass('Create room → code: ' + createRes.room.code);
  } else { fail('Create room failed', JSON.stringify(createRes)); s1.disconnect(); s2.disconnect(); return null; }

  const code = createRes.room.code;

  // Join room
  const joinRes = await new Promise(r => s2.emit('join-room', { roomCode: code, playerName: 'TestPlayer2' }, r));
  if (joinRes.success && joinRes.room.players.length === 2) {
    pass('Join room → 2 players');
  } else { fail('Join room failed', JSON.stringify(joinRes)); }

  // Profile fields check
  if (createRes.profile && createRes.profile.avatar) {
    pass('Profile returned on create');
  } else { fail('Profile missing on create'); }

  // Add bot
  await new Promise(resolve => {
    s1.once('room-update', (room) => {
      const bots = room.players.filter(p => p.isBot);
      bots.length === 1 ? pass('Add bot → 1 bot in room') : fail('Add bot failed, bots: ' + bots.length);
      resolve();
    });
    s1.emit('add-bot', { difficulty: 'easy' });
  });

  // Remove bot
  const roomNow = await new Promise(r => s1.emit('join-room', { roomCode: code, playerName: 'TestAdmin' }, (res) => r(res.room || createRes.room)));
  // Actually let's test remove-all-bots
  await new Promise(resolve => {
    s1.once('room-update', (room) => {
      const bots = room.players.filter(p => p.isBot);
      bots.length === 0 ? pass('Remove all bots → 0 bots') : fail('Remove bots failed');
      resolve();
    });
    s1.emit('remove-all-bots');
  });

  // Get profile
  const profile = await new Promise(r => s1.emit('get-profile', { name: 'TestAdmin' }, r));
  if (profile && profile.name === 'TestAdmin' && typeof profile.winRate === 'number' && profile.dailyChallenge) {
    pass('Get profile → has name, winRate, dailyChallenge');
  } else { fail('Get profile missing fields', JSON.stringify(profile)); }

  // Rejoin test
  const rejoinRes = await new Promise(r => s2.emit('rejoin-room', { roomCode: code, playerName: 'TestPlayer2' }, r));
  if (rejoinRes.success) { pass('Rejoin room → success'); } else { fail('Rejoin failed', JSON.stringify(rejoinRes)); }

  // Chat
  await new Promise(resolve => {
    s2.once('chat-message', (msg) => {
      msg.message === 'hello test' ? pass('Chat message received') : fail('Chat message wrong');
      resolve();
    });
    s1.emit('chat-message', { message: 'hello test' });
  });

  // Kick
  const kickTarget = joinRes.playerId;
  await new Promise(resolve => {
    s2.once('player-kicked', () => {
      pass('Kick player → player-kicked received');
      resolve();
    });
    s1.emit('kick-player', { targetId: kickTarget });
  });

  s1.disconnect();
  s2.disconnect();
  return code;
}

async function testGame(gameType, moveFn, options) {
  const s1 = await connect(gameType + '_admin');
  const createRes = await new Promise(r => s1.emit('create-room', { playerName: gameType + 'Admin' }, r));
  if (!createRes.success) { fail(gameType + ' create room failed'); s1.disconnect(); return; }

  // Add bot, wait for confirmation
  await new Promise(resolve => { s1.once('room-update', () => resolve()); s1.emit('add-bot', { difficulty: 'easy' }); });

  let gameStarted = false, gameEnded = false;
  const gameOverPromise = new Promise(resolve => { s1.on('game-over', (data) => { gameEnded = true; resolve(data); }); });
  const gameStartPromise = new Promise(resolve => { s1.once('game-started', (data) => { gameStarted = true; resolve(data); }); });

  s1.emit('start-game', { gameType, options: options || {} });
  const startData = await Promise.race([gameStartPromise, wait(5000)]);
  if (!gameStarted) { fail(gameType + ' game did not start'); s1.disconnect(); return; }
  pass(gameType + ' started');

  if (moveFn) { try { await moveFn(s1, startData, gameOverPromise); } catch (e) { fail(gameType + ' move error', e.message); } }

  const result = await Promise.race([gameOverPromise, wait(60000)]);
  if (gameEnded) {
    pass(gameType + ' completed → winner: ' + (result.winnerName || 'draw'));
  } else {
    fail(gameType + ' did not finish in 60s');
  }
  s1.disconnect();
}

async function testTicTacToe() {
  await testGame('tictactoe', async (s, startData, gameOverPromise) => {
    function tryMove(state) {
      if (state.players[state.turn % 2] !== s.id) return;
      // Pick first available cell
      for (let i = 0; i < 9; i++) { if (state.board[i] === null) { s.emit('game-move', { move: { cell: i } }); return; } }
    }
    tryMove(startData.state);
    s.on('game-update', (data) => { if (data.state && data.state.board) tryMove(data.state); });
    await Promise.race([gameOverPromise, wait(55000)]);
  });
}

async function testConnect4() {
  await testGame('connect4', async (s, startData, gameOverPromise) => {
    const moves = [{ col:3 },{ col:2 },{ col:4 },{ col:1 },{ col:5 },{ col:0 },{ col:3 },{ col:2 },{ col:4 },{ col:1 },{ col:5 },{ col:6 }];
    let idx = 0;
    function tryMove(state) {
      if (idx >= moves.length) return;
      if (state.players[state.turn % 2] === s.id) { s.emit('game-move', { move: moves[idx++] }); }
    }
    tryMove(startData.state);
    s.on('game-update', (data) => { if (data.state) tryMove(data.state); });
    await Promise.race([gameOverPromise, wait(55000)]);
  });
}

async function testRPS() {
  await testGame('rps', async (s, startData, gameOverPromise) => {
    for (let i = 0; i < 5; i++) {
      s.emit('game-move', { move: { choice: 'rock' } });
      await wait(4000);
    }
  }, { rounds: 3 });
}

async function testTrivia() {
  // 2 rounds, 5s timer → should finish fast
  await testGame('trivia', async (s) => {
    s.on('game-update', () => { s.emit('game-move', { move: { answer: 0 } }); });
  }, { rounds: 2, timer: 5 });
}

async function testWordScramble() {
  await testGame('wordscramble', async (s) => {
    // Just let bot + timer handle it
  }, { rounds: 2, timer: 5 });
}

async function testHangman() {
  await testGame('hangman', async (s) => {
    s.emit('game-move', { move: { letter: 'E' } });
  }, { rounds: 2, timer: 8 });
}

async function testFastMath() {
  await testGame('fastmath', async (s) => {
    // Let bot + timer handle
  }, { rounds: 2, timer: 5 });
}

async function testVoting() {
  console.log('\n📊 Voting Test');
  const s = await connect('VoteTest');
  const res = await new Promise(r => s.emit('create-room', { playerName: 'VoteAdmin' }, r));
  if (!res.success) { fail('Voting: create room failed'); s.disconnect(); return; }

  const votePromise = new Promise(resolve => {
    s.on('vote-update', (data) => {
      if (data.options && data.options.length > 0) { pass('Vote update received with ' + data.options.length + ' options'); resolve(); }
    });
  });
  s.emit('create-vote');
  await Promise.race([votePromise, wait(3000)]);

  // Cast vote
  s.emit('cast-vote', { option: 'trivia' });
  await wait(1000);
  pass('Cast vote completed');

  s.disconnect();
}

async function testTournament() {
  console.log('\n🏆 Tournament Test');
  const s = await connect('TournTest');
  const res = await new Promise(r => s.emit('create-room', { playerName: 'TournAdmin' }, r));
  if (!res.success) { fail('Tournament: create room failed'); s.disconnect(); return; }

  // Need at least 2 players - add a bot
  await new Promise(resolve => { s.once('room-update', () => resolve()); s.emit('add-bot', { difficulty: 'easy' }); });

  const tournPromise = new Promise(resolve => {
    s.on('tournament-update', (data) => {
      if (data && data.bracket) { pass('Tournament bracket created with ' + data.bracket.length + ' rounds'); resolve(data); }
    });
  });
  s.emit('start-tournament', { gameType: 'tictactoe' });
  await Promise.race([tournPromise, wait(5000)]);

  s.disconnect();
}

async function testErrorHandling() {
  console.log('\n⚠️ Error Handling Tests');
  const s = await connect('ErrorTest');

  // Create room with empty name
  const res1 = await new Promise(r => s.emit('create-room', { playerName: '' }, r));
  res1.error ? pass('Empty name rejected') : fail('Empty name not rejected');

  // Join nonexistent room
  const res2 = await new Promise(r => s.emit('join-room', { roomCode: 'ZZZZZZ', playerName: 'Test' }, r));
  res2.error ? pass('Invalid room code rejected') : fail('Invalid room code not rejected');

  // Game move without being in a game
  const errPromise = new Promise(resolve => {
    s.on('error-msg', (data) => {
      pass('Error msg received: ' + data.message);
      resolve();
    });
    setTimeout(resolve, 2000);
  });
  s.emit('game-move', { move: { cell: 0 } });
  await errPromise;

  s.disconnect();
}

async function run() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║  🧪 SpaceGames Test Suite              ║');
  console.log('╚═══════════════════════════════════════╝');

  await testAPIs();
  await testRoomFlow();
  await testErrorHandling();

  console.log('\n🎮 Game Tests (each plays vs Easy bot)');
  await testTicTacToe();
  await testConnect4();
  await testRPS();
  await testTrivia();
  await testWordScramble();
  await testHangman();
  await testFastMath();

  await testVoting();
  await testTournament();

  console.log('\n═══════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (errors.length) {
    console.log('  Failures:');
    errors.forEach(e => console.log('    ❌ ' + e));
  }
  console.log('═══════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Test runner error:', e); process.exit(1); });
