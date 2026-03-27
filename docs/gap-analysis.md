# SpaceGames - Gap Analysis & Implementation Plan

## Current State (v1.0)
- 7 multiplayer games
- Debate timer with dashboard
- Basic leaderboard (points only)
- Room system with chat + reactions
- Anonymous players (name only, no persistence beyond leaderboard)

---

## Gap Analysis

### Identity & Progression (HIGH PRIORITY)
| Gap | Impact | Why it matters for voice spaces |
|-----|--------|---------------------------------|
| No player avatars | Players are faceless | People on X Spaces have identity — avatars bring that to the game |
| No XP/leveling system | No progression feeling | Keeps people coming back. "I'm Level 12!" is social currency |
| No achievements | No long-term goals | Achievements create moments ("I just unlocked Champion!") |
| No win streaks | Missing hype moments | Streaks create tension: "Can anyone stop their 7-win streak?" |
| No player stats modal | Can't flex stats | Players want to show off their record |

### Competitive Structure (HIGH PRIORITY)
| Gap | Impact | Why it matters for voice spaces |
|-----|--------|---------------------------------|
| No tournament mode | No structured competition | Tournaments are THE format for voice space game nights |
| No voting system | Admin decides everything | Audience should vote on what to play next |
| No rematch option | Friction after games | Quick rematches keep energy high |
| No challenge system | Can't call someone out | "I challenge you!" moments are gold for voice spaces |

### Polish & Engagement (MEDIUM PRIORITY)
| Gap | Impact | Why it matters for voice spaces |
|-----|--------|---------------------------------|
| No sound effects | Silent, flat experience | Sound adds excitement even if everyone is on voice |
| No celebration effects | Wins feel underwhelming | Confetti/particles make wins feel earned |
| No admin kick | Can't manage trolls | Essential for public voice spaces |
| Limited game variety | Only 7 games | More games = more variety for long sessions |

### Missing Games (MEDIUM PRIORITY)
| Gap | Why it's needed |
|-----|----------------|
| No word-guessing game (Hangman) | Perfect for voice — everyone shouts letters |
| No math/speed game | Creates intense competition in voice |

---

## Implementation Plan

### Approach: Integrated Feature Wave
Instead of adding features one by one (risking inconsistency), we implement them as a coordinated wave across all files.

### Feature Set to Implement

**1. Player Profiles + Avatars + XP + Levels**
- 20+ emoji avatars (selectable)
- XP earned from every game action
- Level calculated from XP
- Displayed in room, leaderboard, game UI

**2. Achievement System (15 achievements)**
- Server tracks conditions
- Unlock notification with special toast
- Displayed on player profile
- +20 XP per achievement

**3. Sound Effects System**
- Web Audio API (zero external files)
- Toggle on/off in nav bar
- Sounds for: game start, move, win, loss, timer, achievement, join

**4. Tournament Bracket Mode**
- Single elimination bracket
- Auto-generated from room players
- Bracket visualization
- Match progression
- Champion crowned with bonus points

**5. Voting System**
- Admin creates vote for next game
- All players vote (15s timer)
- Bar chart results
- Winner game can be auto-started

**6. Rematch System**
- "Rematch" button on game-over screen
- Both players must agree
- Instant restart of same game type

**7. Admin Controls: Kick Player**
- Boot icon next to player names (admin view)
- Kicks player from room with notification
- Player can rejoin

**8. Win Streak Tracking**
- Track consecutive wins per player
- Display streak badge
- Special effects for streaks of 3, 5, 10

**9. Celebration Effects**
- Confetti animation on win
- Screen shake on big moments
- Enhanced game-over screen

**10. Two New Games: Hangman + Fast Math**
- Hangman: Hidden word, guess letters, visual hangman
- Fast Math: Speed arithmetic, 10 rounds, increasing difficulty

### File Changes

| File | Changes |
|------|---------|
| server.js | +XP/level functions, +achievement engine, +hangman engine, +fastmath engine, +tournament logic, +voting logic, +kick/rematch events, +new API endpoints |
| app.js | +sound system, +profile UI, +achievement toasts, +tournament UI, +voting UI, +rematch logic, +confetti effects, +streak display, +kick UI |
| index.html | +nav profile/sound, +tournament section, +voting modal, +new game scripts |
| styles.css | +profile styles, +achievement styles, +tournament bracket, +voting UI, +confetti, +hangman, +fastmath, +streak badge |
| hangman.js | New game module |
| fastmath.js | New game module |

### Priority Order
1. Backend infrastructure (profiles, XP, achievements) — enables everything else
2. New games (Hangman, Fast Math) — immediate content value
3. Sound effects + celebrations — instant polish
4. Tournament + Voting — competitive structure
5. Admin controls + rematch — quality of life
