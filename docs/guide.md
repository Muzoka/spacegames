# SpaceGames - Complete Guide

> The ultimate games & tools platform for X Spaces.
> Play games, host debates, track scores — all in real-time with your Space audience.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Room System](#room-system)
3. [Games](#games)
   - [Tic Tac Toe](#tic-tac-toe)
   - [Connect Four](#connect-four)
   - [Chess](#chess)
   - [Rock Paper Scissors](#rock-paper-scissors)
   - [Trivia Battle](#trivia-battle)
   - [Word Scramble](#word-scramble)
   - [Emoji Guess](#emoji-guess)
   - [Hangman](#hangman)
   - [Fast Math](#fast-math)
4. [Tournament Mode](#tournament-mode)
5. [Voting System](#voting-system)
6. [Debate Timer](#debate-timer)
7. [Player Profiles & Levels](#player-profiles--levels)
8. [Achievements](#achievements)
9. [Leaderboard](#leaderboard)
10. [Sound Effects](#sound-effects)
11. [Admin Controls](#admin-controls)
12. [Chat & Reactions](#chat--reactions)
13. [Deployment](#deployment)
14. [API Reference](#api-reference)

---

## Getting Started

### Installation

```bash
cd spacegames
npm install
npm start
```

The server starts at `http://localhost:3000`. Open this URL in your browser.

### Quick Start for X Spaces

1. **Host/Admin**: Open the site and click **Create Room**
2. Enter your display name and click create
3. You get a **6-character room code** and a **shareable link**
4. Share the link in your X Space — everyone clicks to join
5. As admin, pick a game, start a tournament, create a vote, or set up a debate
6. Everyone plays in real-time. Scores are tracked on the leaderboard.

### For Players Joining

1. Click the shared link or go to the site and click **Join Room**
2. Enter the 6-character room code and your display name
3. You are now in the room and can see other players, chat, and play games
4. Wait for the admin to start a game or vote

---

## Room System

### Creating a Room
- Click **Create Room** on the home page
- Enter your display name (max 20 characters)
- You become the **room admin** with a gold badge

### Joining a Room
- Use a shared link (auto-fills the room code) or enter the 6-character code manually
- Room codes use uppercase letters (A-Z, no I/L/O) and digits (2-9) to avoid confusion

### Room Features
- **Max 20 players** per room
- **Admin badge** shown next to the room creator's name
- **Player scores** visible next to each name
- **Auto admin transfer**: If the admin leaves, the next player becomes admin
- **Room cleanup**: Empty rooms are automatically deleted

### Room Code Sharing
- Click the clipboard icon next to the room code to copy the full shareable URL
- URL format: `https://yoursite.com/#/room/ABCDEF`

---

## Games

### Tic Tac Toe
| Detail | Value |
|--------|-------|
| Players | 2 |
| Category | Strategy |
| Points | Win +3, Draw +1 |

**Rules**: Classic 3x3 grid. Take turns placing X or O. Get three in a row (horizontal, vertical, or diagonal) to win.

**How to play**: Click any empty cell on your turn. The board highlights whose turn it is. Winning cells glow green.

**Tips for voice spaces**: Quick rounds make for great trash talk. Best played as a warm-up game.

---

### Connect Four
| Detail | Value |
|--------|-------|
| Players | 2 |
| Category | Strategy |
| Points | Win +3, Draw +1 |

**Rules**: 7-column, 6-row board. Drop colored pieces (Red or Yellow) into columns. First to connect 4 in any direction wins.

**How to play**: Click the arrow button above a column to drop your piece. Gravity pulls it to the lowest empty row.

**Tips for voice spaces**: Strategic depth makes for engaging commentary. The audience can suggest moves.

---

### Chess
| Detail | Value |
|--------|-------|
| Players | 2 |
| Category | Strategy |
| Points | Win +5, Draw +2 |

**Rules**: Standard chess rules including castling, en passant, and pawn promotion.

**How to play**: Click a piece to see valid moves highlighted. Click a destination to move. Board auto-flips if you play black.

**Features**:
- Valid move indicators (green dots for moves, red rings for captures)
- Last move highlighting
- Captured pieces display
- Move history in algebraic notation

**Tips for voice spaces**: Great for serious matches. The audience can discuss strategy. Use shorter time controls to keep it engaging.

---

### Rock Paper Scissors
| Detail | Value |
|--------|-------|
| Players | 2 |
| Category | Quick |
| Points | Win series +3 |

**Rules**: Best of 5 rounds. Rock beats Scissors, Scissors beats Paper, Paper beats Rock. First to 3 wins.

**How to play**: Click your choice (Rock, Paper, or Scissors). Both choices are hidden until both players pick. Dramatic countdown reveal.

**Features**:
- Hidden simultaneous selection
- 3-2-1 countdown reveal animation
- Round-by-round score tracking
- Round history

**Tips for voice spaces**: The hidden pick + reveal creates amazing moments. Perfect for hype commentary.

---

### Trivia Battle
| Detail | Value |
|--------|-------|
| Players | 2-20 |
| Category | Knowledge |
| Points | Based on correct answers |

**Rules**: 10 multiple-choice questions from various categories. 15 seconds per question. Answer correctly to earn points.

**How to play**: Read the question, click one of 4 answer options. After everyone answers (or time runs out), the correct answer is revealed.

**Categories**: Science, Art, Geography, History, Math, Literature, Technology, Nature, Sports, Music, Culture

**Features**:
- Category badges on each question
- Reveal phase showing who answered what
- Individual score tracking
- 50-question bank, randomly selected

**Tips for voice spaces**: The host can read questions aloud. Players discuss after reveal. Perfect for crowd engagement.

---

### Word Scramble
| Detail | Value |
|--------|-------|
| Players | 2-20 |
| Category | Word |
| Points | Based on words solved |

**Rules**: 8 scrambled words. Type the correct unscrambled word. First to solve wins the round. 30 seconds per word.

**How to play**: See the scrambled letters, read the hint, type your guess and press Enter or click Submit.

**Features**:
- Hints for each word
- Case-insensitive matching
- First-to-solve scoring
- 30-word bank

**Tips for voice spaces**: Players can call out guesses over voice while typing. Creates exciting race moments.

---

### Emoji Guess
| Detail | Value |
|--------|-------|
| Players | 2-20 |
| Category | Fun |
| Points | Based on puzzles solved |

**Rules**: 8 emoji sequences representing words, phrases, or concepts. Guess what they mean. First correct guess wins. 30 seconds per puzzle.

**How to play**: Look at the emojis, read the hint and category, type your guess and submit.

**Features**:
- Multiple valid answers per puzzle
- Category and hint display
- 30-emoji puzzle bank covering Movies, Science, Sports, etc.

**Tips for voice spaces**: Hilarious to discuss guesses over voice. The emojis create funny interpretations.

---

### Hangman
| Detail | Value |
|--------|-------|
| Players | 2-20 |
| Category | Word |
| Points | Based on words guessed |

**Rules**: A hidden word is chosen. Players guess letters one at a time. Wrong guesses add body parts to the hangman. Guess the word before the hangman is complete (6 wrong guesses).

**How to play**: Click letter buttons or type on your keyboard. Correct letters reveal their positions. Wrong letters build the hangman figure.

**Features**:
- Visual hangman drawing (ASCII art)
- Hint system
- 8 rounds per game
- Keyboard and click input

**Tips for voice spaces**: Everyone shouts out letter suggestions. Classic party game energy.

---

### Fast Math
| Detail | Value |
|--------|-------|
| Players | 2-20 |
| Category | Speed |
| Points | Based on correct answers |

**Rules**: 10 math problems of increasing difficulty. Type the answer as fast as you can. First correct answer wins each round. 20 seconds per problem.

**How to play**: See the math problem, type the numerical answer, press Enter.

**Difficulty progression**:
- Rounds 1-3: Simple addition/subtraction (single digit)
- Rounds 4-6: Multiplication and larger numbers
- Rounds 7-9: Mixed operations with harder numbers
- Round 10: Challenge round

**Tips for voice spaces**: Speed creates tension. Players call out answers over voice while typing. Great energy.

---

## Tournament Mode

Tournaments add competitive structure to your Space sessions.

### How It Works
1. **Admin** clicks "Start Tournament" and selects a game type
2. System generates a **single-elimination bracket** based on current players
3. Matches are played in order — winners advance
4. Final match determines the champion
5. Tournament winner gets **bonus XP and a special achievement**

### Bracket System
- Players are randomly seeded into the bracket
- If player count isn't a power of 2, some players get a **bye** (auto-advance)
- Each match plays the selected game type
- Bracket visualization shows all matches and progression

### Tournament Scoring
- Match win: +3 points + 30 XP
- Tournament winner: +10 bonus points + 100 bonus XP + "Champion" achievement

---

## Voting System

Let your audience decide what happens next.

### How It Works
1. **Admin** clicks "Create Vote" in the room
2. A poll appears showing all available game types
3. **All players vote** by clicking their preferred option
4. After 15 seconds or when everyone votes, results are tallied
5. The winning game can be auto-started by the admin

### Features
- Real-time vote count display
- 15-second voting timer
- Visual bar chart of results
- Admin can close vote early

---

## Debate Timer

Structured discussions with fair time allocation and live dashboard.

### Setting Up
1. Admin clicks **Create Debate** in the room
2. Enter a **topic** (e.g., "Is AI good for society?")
3. **Select participants** from the player list (at least 2)
4. Set **time per person** (30 seconds to 10 minutes, default 2 minutes)

### During the Debate
- Admin clicks a participant's name to **give them the floor**
- Their timer counts down in real-time
- When time runs out, the timer stops automatically
- Admin can **pause/resume/stop** at any time

### Dashboard
Everyone in the room sees:
- **Individual timer cards** with remaining time and progress bars
- **Speaking distribution chart** showing who talked how much (percentage)
- **Statistics panel** ranking participants by time used
- **"SPEAKING" indicator** with glow animation on the active speaker

### Admin Controls
| Button | Action |
|--------|--------|
| Click participant | Give them the floor |
| Pause | Freeze the current timer |
| Resume | Continue from where paused |
| Stop | End current speaker's turn |
| Reset | Reset all timers to full |
| End Debate | Close the debate entirely |

### Color Coding
- Green: Under 60% time used
- Amber/Yellow: 60-80% time used
- Red: Over 80% time used (danger zone)

---

## Player Profiles & Levels

### Avatars
Choose from 20+ emoji avatars to represent yourself. Click your avatar in the nav bar to change it.

### XP & Levels
Every action earns XP:
| Action | XP Earned |
|--------|-----------|
| Win a game | +30 XP |
| Draw | +10 XP |
| Loss | +5 XP |
| Game played | +5 XP |
| Tournament win | +100 XP bonus |
| Achievement unlocked | +20 XP |

**Level formula**: Level = floor(sqrt(XP / 100)) + 1

Levels are displayed next to your name as colored badges.

### Persistence
Your profile (name, avatar, XP, level, achievements) is stored on the server and persists across sessions.

---

## Achievements

Unlock achievements by reaching milestones.

| Achievement | Condition | Icon |
|------------|-----------|------|
| First Blood | Win your first game | |
| Streak Starter | Win 3 games in a row | |
| On Fire | Win 5 games in a row | |
| Unstoppable | Win 10 games in a row | |
| Checkmate | Win a chess game | |
| Trivia King | Score 10/10 in trivia | |
| Word Wizard | Solve all 8 words in word scramble | |
| Emoji Expert | Solve all 8 emoji puzzles | |
| Speed Demon | Win a fast math game | |
| Jack of All Trades | Win at least one game of every type | |
| Social Butterfly | Send 50+ chat messages | |
| Debater | Participate in a debate | |
| Champion | Win a tournament | |
| Veteran | Play 50 games | |
| Legend | Play 100 games | |

Achievements appear as a notification when unlocked and are displayed on your profile.

---

## Leaderboard

### Global Leaderboard
Shows all players ranked by total points across all games.

**Columns**: Rank, Player (with avatar + level), Games Played, W/L/D, Total Points

### Per-Game Leaderboards
Filter by any of the 9 game types to see game-specific rankings.

**Columns**: Rank, Player, Played, Wins, Points

### Ranking Badges
- 1st place: Gold medal
- 2nd place: Silver medal
- 3rd place: Bronze medal

---

## Sound Effects

Toggle sound on/off with the speaker icon in the navigation bar.

### Sound Events
| Event | Sound |
|-------|-------|
| Game start | Upbeat chime |
| Your turn | Gentle notification |
| Move made | Click/tap |
| Win | Victory fanfare |
| Loss | Soft descending tone |
| Timer warning (5s) | Ticking |
| Timer danger (3s) | Fast ticking |
| Achievement unlocked | Special jingle |
| Player joined | Door open |
| Reaction | Pop |

Sounds are generated using the Web Audio API (no external files needed).

---

## Admin Controls

Room admins have these exclusive controls:

| Control | Action |
|---------|--------|
| Start Game | Pick and start any game |
| End Game | Force-end the current game |
| Create Debate | Set up a debate timer |
| Create Vote | Start a game vote |
| Start Tournament | Begin a tournament bracket |
| Kick Player | Remove a player from the room |

### Kicking Players
- Click the boot icon next to a player's name
- Player is removed from the room and notified
- They can rejoin with the room code

---

## Chat & Reactions

### Chat
- Type messages in the chat box (max 200 characters)
- Press Enter to send
- System messages announce joins, leaves, game events

### Reactions
Click reaction emoji buttons to send floating reactions visible to everyone:

| Reaction | Meaning |
|----------|---------|
| Fire | Hype/excitement |
| Laughing | Something funny |
| Clap | Well played |
| Shocked | Unexpected move |
| Skull | Dead/hilarious |
| Heart | Love/support |
| Trophy | Great achievement |
| Eyes | Watching closely |

Reactions float up from the bottom of the screen with fade-out animation.

---

## Deployment

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |

### Deploy to Railway / Render / Heroku

1. Push the project to a Git repository
2. Connect to your deployment platform
3. Set the start command: `npm start`
4. The platform auto-detects Node.js and installs dependencies

### Deploy with Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Requirements
- Node.js 18+
- No database required (uses JSON file storage)
- No external APIs required

---

## API Reference

### REST Endpoints

#### GET /api/leaderboard
Returns top 100 players sorted by total points.

```json
[
  {
    "name": "Player1",
    "totalPoints": 42,
    "gamesPlayed": 15,
    "wins": 10,
    "losses": 3,
    "draws": 2,
    "gameStats": { "tictactoe": { "played": 5, "wins": 3, "points": 9 } }
  }
]
```

#### GET /api/leaderboard/:gameType
Returns top 100 players for a specific game type.

Game types: `tictactoe`, `connect4`, `chess`, `rps`, `trivia`, `wordscramble`, `emojiguess`, `hangman`, `fastmath`

#### GET /api/rooms
Returns list of active rooms.

```json
[
  { "code": "ABC123", "playerCount": 5, "currentGame": "trivia", "hasDebate": false }
]
```

#### GET /api/player/:name
Returns player profile, stats, and achievements.

### Socket.IO Events

#### Client to Server
| Event | Payload | Description |
|-------|---------|-------------|
| create-room | { playerName } | Create a new room |
| join-room | { roomCode, playerName } | Join existing room |
| leave-room | — | Leave current room |
| chat-message | { message } | Send chat message |
| send-reaction | { emoji } | Send floating reaction |
| start-game | { gameType, options? } | Start a game (admin) |
| game-move | { move } | Make a game move |
| end-game | — | End current game (admin) |
| create-debate | { topic, participants, timePerPerson } | Create debate (admin) |
| debate-action | { action, data } | Control debate (admin) |
| update-profile | { avatar } | Update avatar |
| kick-player | { targetId } | Kick player (admin) |
| request-rematch | { gameType } | Request same game again |
| create-vote | { } | Create game vote (admin) |
| cast-vote | { optionIndex } | Vote in active poll |
| start-tournament | { gameType } | Start tournament (admin) |

#### Server to Client
| Event | Payload | Description |
|-------|---------|-------------|
| room-update | { room } | Full room state |
| player-joined | { id, name } | Player joined |
| player-left | { playerId } | Player left |
| new-admin | { adminId } | Admin changed |
| chat-message | { playerName, message, timestamp } | Chat received |
| reaction | { playerName, emoji } | Reaction received |
| game-started | { gameType, state, players, gamePlayers } | Game beginning |
| game-update | { state, lastMove?, playerId? } | Game state change |
| game-timer | { remaining } | Timer tick |
| game-over | { winner, winnerName, draw, scores?, line? } | Game ended |
| game-ended | {} | Game cleared |
| debate-update | { debate } | Debate state change |
| debate-tick | { speaker, timeUsed, timePerPerson } | Debate timer tick |
| debate-time-up | { participant } | Speaker time expired |
| achievement-unlocked | { achievement } | Achievement earned |
| vote-update | { vote } | Vote state change |
| vote-result | { results } | Vote finished |
| tournament-update | { tournament } | Tournament state change |
| player-kicked | { playerId } | Player was kicked |
| error-msg | { message } | Error message |

---

## Architecture

```
spacegames/
├── server.js              # Express + Socket.IO backend
├── package.json           # Dependencies
├── data/
│   └── leaderboard.json   # Persistent player data
├── docs/
│   └── guide.md           # This file
└── public/
    ├── index.html          # Single-page app shell
    ├── css/
    │   └── styles.css      # Dark gaming theme
    └── js/
        ├── app.js          # Core client logic
        └── games/
            ├── tictactoe.js
            ├── connect4.js
            ├── chess.js
            ├── rps.js
            ├── trivia.js
            ├── wordscramble.js
            ├── emojiguess.js
            ├── hangman.js
            └── fastmath.js
```

### Tech Stack
- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Vanilla JavaScript (no framework)
- **Storage**: JSON file (leaderboard) + in-memory (rooms, games)
- **Audio**: Web Audio API (generated tones, no external files)
- **Styling**: Custom CSS with CSS variables, dark theme

---

## FAQ

**Q: Can I add custom trivia questions?**
A: Edit the `triviaBank` array in `server.js` to add/modify questions.

**Q: How many players can join?**
A: Up to 20 per room. Multiple rooms can run simultaneously.

**Q: Is data persisted?**
A: Leaderboard and player profiles are persisted to disk. Room state is in-memory (lost on restart).

**Q: Can spectators play?**
A: Spectators can watch games and use chat/reactions. For 2-player games, only the selected players can make moves.

**Q: How do I reset the leaderboard?**
A: Delete `data/leaderboard.json` and restart the server.
