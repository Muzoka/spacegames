/* ═══════════════════════════════════════
   SPACEGAMES - Hangman Game Module
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Hangman ASCII Art Stages ───
  var HANGMAN_STAGES = [
    // Stage 0: Empty gallows
    '  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========',
    // Stage 1: Head
    '  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========',
    // Stage 2: Body
    '  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========',
    // Stage 3: Left arm
    '  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========',
    // Stage 4: Right arm
    '  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========',
    // Stage 5: Left leg
    '  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========',
    // Stage 6: Right leg (dead!)
    '  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n========='
  ];

  // ─── Handler ───
  var handler = {
    _active: false,
    _container: null,
    _ctx: null,
    _state: null,
    _progressEl: null,
    _hangmanEl: null,
    _wordEl: null,
    _hintEl: null,
    _messageEl: null,
    _lettersEl: null,
    _scoresEl: null,
    _keyHandler: null,

    // ─── Init ───
    init: function (container, ctx) {
      this._active = true;
      this._container = container;
      this._ctx = ctx;
      this._state = ctx.gameState;

      container.innerHTML = '';

      // Main wrapper
      var wrapper = document.createElement('div');
      wrapper.className = 'hm-container';
      container.appendChild(wrapper);

      // Progress
      this._progressEl = document.createElement('div');
      this._progressEl.className = 'hm-progress';
      wrapper.appendChild(this._progressEl);

      // Hangman ASCII figure
      this._hangmanEl = document.createElement('pre');
      this._hangmanEl.className = 'hm-figure';
      wrapper.appendChild(this._hangmanEl);

      // Word display
      this._wordEl = document.createElement('div');
      this._wordEl.className = 'hm-word';
      wrapper.appendChild(this._wordEl);

      // Hint text
      this._hintEl = document.createElement('div');
      this._hintEl.className = 'hm-hint';
      wrapper.appendChild(this._hintEl);

      // Status message
      this._messageEl = document.createElement('div');
      this._messageEl.className = 'hm-message';
      wrapper.appendChild(this._messageEl);

      // Letter buttons container
      this._lettersEl = document.createElement('div');
      wrapper.appendChild(this._lettersEl);

      // Scoreboard
      this._scoresEl = document.createElement('div');
      this._scoresEl.className = 'hm-scores';
      wrapper.appendChild(this._scoresEl);

      // Build letter buttons
      this._buildLetterButtons();

      // Keyboard handler
      this._keyHandler = this._onKeyDown.bind(this);
      document.addEventListener('keydown', this._keyHandler);

      // Initial render
      this._render();
    },

    // ─── Build Letter Buttons ───
    _buildLetterButtons: function () {
      if (!this._lettersEl) return;

      this._lettersEl.innerHTML = '';

      var grid = document.createElement('div');
      grid.className = 'hm-letters';

      for (var i = 0; i < 26; i++) {
        var letter = String.fromCharCode(65 + i);
        var btn = document.createElement('button');
        btn.textContent = letter;
        btn.dataset.letter = letter;
        btn.className = 'hm-letter-btn';
        btn.addEventListener('click', this._onLetterClick.bind(this));
        grid.appendChild(btn);
      }

      this._lettersEl.appendChild(grid);
    },

    // ─── Letter Click Handler ───
    _onLetterClick: function (e) {
      var btn = e.currentTarget;
      var letter = btn.dataset.letter;
      if (!letter || btn.disabled) return;
      this._guessLetter(letter);
    },

    // ─── Keyboard Handler ───
    _onKeyDown: function (e) {
      if (!this._active) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Only handle single letter keys
      var key = e.key;
      if (!key || key.length !== 1) return;

      var upper = key.toUpperCase();
      if (upper >= 'A' && upper <= 'Z') {
        e.preventDefault();
        this._guessLetter(upper);
      }
    },

    // ─── Guess a Letter ───
    _guessLetter: function (letter) {
      if (!this._active || !this._ctx || !this._state) return;
      if (this._state.solved || this._state.failed) return;

      // Check if already guessed
      var revealed = this._state.revealed || [];
      var wrong = this._state.wrongLetters || [];

      // Check if letter is already in revealed letters
      for (var i = 0; i < revealed.length; i++) {
        if (revealed[i] === letter) return;
      }

      // Check if letter is already in wrong letters
      for (var j = 0; j < wrong.length; j++) {
        if (wrong[j] === letter) return;
      }

      this._ctx.socket.emit('game-move', { move: { letter: letter } });
    },

    // ─── On Update ───
    onUpdate: function (data) {
      if (!this._active) return;

      var prevWord = this._state ? this._state.currentWord : -1;
      this._state = data.state;

      // Determine status message
      if (data.state.solved && data.state.solvedBy) {
        var solverName = this._getPlayerName(data.state.solvedBy);
        this._messageEl.textContent = SpaceGames.t('solved_by', {name: solverName});
        this._messageEl.style.color = '#4ade80';
      } else if (data.state.failed) {
        this._messageEl.textContent = SpaceGames.t('hm_failed');
        this._messageEl.style.color = '#f87171';
      } else if (data.timeout) {
        this._messageEl.textContent = SpaceGames.t('times_up');
        this._messageEl.style.color = '#fbbf24';
      } else if (data.state.currentWord !== prevWord) {
        // New word round
        this._messageEl.textContent = '';
        this._messageEl.style.color = '#e0e0e0';
      }

      this._render();
    },

    // ─── Render ───
    _render: function () {
      if (!this._state) return;

      var state = this._state;

      // Progress
      if (this._progressEl) {
        this._progressEl.textContent = SpaceGames.t('word_of', {n: state.currentWord + 1, t: state.totalWords});
      }

      // Hangman figure
      if (this._hangmanEl) {
        var wrongCount = state.wrongLetters ? state.wrongLetters.length : 0;
        var stage = Math.min(wrongCount, 6);
        this._hangmanEl.textContent = HANGMAN_STAGES[stage];

        // Color the figure red when dead
        if (stage >= 6) {
          this._hangmanEl.classList.add('dead');
        } else {
          this._hangmanEl.classList.remove('dead');
        }
      }

      // Word display
      if (this._wordEl) {
        var revealed = state.revealed || [];
        var display = '';
        for (var i = 0; i < revealed.length; i++) {
          if (i > 0) display += ' ';
          display += revealed[i];
        }
        this._wordEl.textContent = display;
      }

      // Hint
      if (this._hintEl) {
        this._hintEl.textContent = state.hint ? SpaceGames.t('hm_hint') + ': ' + state.hint : '';
      }

      // Update letter buttons
      this._updateLetterButtons();

      // Scores
      this._renderScores();
    },

    // ─── Update Letter Button States ───
    _updateLetterButtons: function () {
      if (!this._lettersEl || !this._state) return;

      var state = this._state;
      var revealed = state.revealed || [];
      var wrong = state.wrongLetters || [];
      var solved = state.solved;
      var failed = state.failed;

      // Build a set of correct letters (letters that appear in revealed, excluding '_')
      var correctSet = {};
      for (var i = 0; i < revealed.length; i++) {
        if (revealed[i] !== '_') {
          correctSet[revealed[i]] = true;
        }
      }

      // Build a set of wrong letters
      var wrongSet = {};
      for (var j = 0; j < wrong.length; j++) {
        wrongSet[wrong[j]] = true;
      }

      var buttons = this._lettersEl.querySelectorAll('button');
      for (var k = 0; k < buttons.length; k++) {
        var btn = buttons[k];
        var letter = btn.dataset.letter;

        // Reset classes
        btn.className = 'hm-letter-btn';

        if (correctSet[letter]) {
          btn.classList.add('correct');
          btn.disabled = true;
        } else if (wrongSet[letter]) {
          btn.classList.add('wrong');
          btn.disabled = true;
        } else if (solved || failed) {
          btn.disabled = true;
        } else {
          btn.disabled = false;
        }
      }
    },

    // ─── Render Scores ───
    _renderScores: function () {
      if (!this._scoresEl || !this._state || !this._ctx) return;

      var state = this._state;
      var scores = state.scores || {};
      var playerIds = state.players || [];

      var html = '<div class="trivia-progress" style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:8px;">' + SpaceGames.t('score') + '</div>';

      for (var i = 0; i < playerIds.length; i++) {
        var pid = playerIds[i];
        var name = this._getPlayerName(pid);
        var score = scores[pid] || 0;
        var isMe = pid === this._ctx.playerId;

        html += '<div class="trivia-score-card' + (isMe ? ' me' : '') + '">';
        html += '<span class="score-name">' + escHtml(name);
        if (isMe) html += ' <small>(' + SpaceGames.t('you') + ')</small>';
        html += '</span>';
        html += '<span class="score-val">' + score + '</span>';
        html += '</div>';
      }

      this._scoresEl.innerHTML = html;
    },

    // ─── Get Player Name ───
    _getPlayerName: function (pid) {
      var players = this._ctx.players;
      if (players) {
        for (var i = 0; i < players.length; i++) {
          if (players[i].id === pid) return players[i].name;
        }
      }
      if (pid === this._ctx.playerId) return this._ctx.playerName;
      return 'Player';
    },

    // ─── Destroy ───
    destroy: function () {
      this._active = false;

      // Remove keyboard listener
      if (this._keyHandler) {
        document.removeEventListener('keydown', this._keyHandler);
        this._keyHandler = null;
      }

      if (this._container) {
        this._container.innerHTML = '';
      }
      this._container = null;
      this._ctx = null;
      this._state = null;
      this._progressEl = null;
      this._hangmanEl = null;
      this._wordEl = null;
      this._hintEl = null;
      this._messageEl = null;
      this._lettersEl = null;
      this._scoresEl = null;
    }
  };

  // ─── Helpers ───
  function escHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // ─── Register ───
  SpaceGames.registerGame('hangman', handler);
})();
