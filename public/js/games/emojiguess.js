/* ═══════════════════════════════════════
   SPACEGAMES - Emoji Guess Game Module
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Handler ───
  var handler = {
    _active: false,
    _container: null,
    _ctx: null,
    _state: null,
    _inputEl: null,
    _submitBtn: null,
    _emojisEl: null,
    _statusEl: null,
    _scoresEl: null,
    _progressEl: null,
    _hintEl: null,
    _categoryEl: null,

    // ─── Init ───
    init: function (container, ctx) {
      this._active = true;
      this._container = container;
      this._ctx = ctx;
      this._state = ctx.gameState;

      container.innerHTML = '';

      // Main wrapper
      var wrapper = document.createElement('div');
      wrapper.className = 'eg-container';

      // Progress indicator
      this._progressEl = document.createElement('div');
      this._progressEl.className = 'eg-progress';
      wrapper.appendChild(this._progressEl);

      // Category badge
      this._categoryEl = document.createElement('div');
      this._categoryEl.className = 'eg-category';
      wrapper.appendChild(this._categoryEl);

      // Emoji display
      this._emojisEl = document.createElement('div');
      this._emojisEl.className = 'eg-emojis';
      wrapper.appendChild(this._emojisEl);

      // Hint text
      this._hintEl = document.createElement('div');
      this._hintEl.className = 'eg-hint';
      wrapper.appendChild(this._hintEl);

      // Status line (solved / timeout messages)
      this._statusEl = document.createElement('div');
      this._statusEl.className = 'eg-status';
      wrapper.appendChild(this._statusEl);

      // Input row
      var inputRow = document.createElement('div');
      inputRow.className = 'eg-input-row';

      this._inputEl = document.createElement('input');
      this._inputEl.type = 'text';
      this._inputEl.placeholder = 'Type your guess...';
      this._inputEl.autocomplete = 'off';
      this._inputEl.addEventListener('keydown', this._onKeyDown.bind(this));
      inputRow.appendChild(this._inputEl);

      this._submitBtn = document.createElement('button');
      this._submitBtn.textContent = 'Submit';
      this._submitBtn.addEventListener('click', this._onSubmit.bind(this));
      inputRow.appendChild(this._submitBtn);

      wrapper.appendChild(inputRow);

      // Scoreboard
      this._scoresEl = document.createElement('div');
      this._scoresEl.className = 'eg-scores';
      wrapper.appendChild(this._scoresEl);

      container.appendChild(wrapper);

      this._render();
    },

    // ─── Key Down Handler ───
    _onKeyDown: function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._onSubmit();
      }
    },

    // ─── Submit Guess ───
    _onSubmit: function () {
      if (!this._active || !this._ctx || !this._inputEl) return;

      var guess = this._inputEl.value.trim();
      if (!guess) return;

      if (this._state && this._state.solved) return;

      this._ctx.socket.emit('game-move', { move: { guess: guess } });
      this._inputEl.value = '';
    },

    // ─── On Update ───
    onUpdate: function (data) {
      if (!this._active) return;

      var prevPuzzle = this._state ? this._state.currentPuzzle : -1;
      this._state = data.state;

      // Show solved or timeout message
      if (data.state.solved && data.state.answer) {
        var solverName = this._getPlayerName(data.state.solvedBy);
        this._statusEl.textContent = 'Correct! ' + data.state.answer + ' - Solved by ' + solverName + '!';
        this._statusEl.className = 'eg-status eg-solved';
        this._disableInput();
      } else if (data.timeout && data.state.answer) {
        this._statusEl.textContent = "Time's up! Answer: " + data.state.answer;
        this._statusEl.className = 'eg-status eg-timeout';
        this._disableInput();
      } else {
        this._statusEl.textContent = '';
        this._statusEl.className = 'eg-status';
      }

      // New puzzle: reset input
      if (data.state.currentPuzzle !== prevPuzzle) {
        if (this._inputEl) {
          this._inputEl.value = '';
          this._inputEl.disabled = false;
        }
        if (this._submitBtn) {
          this._submitBtn.disabled = false;
        }
        this._statusEl.textContent = '';
        this._statusEl.className = 'eg-status';
      }

      this._render();
    },

    // ─── Disable Input ───
    _disableInput: function () {
      if (this._inputEl) this._inputEl.disabled = true;
      if (this._submitBtn) this._submitBtn.disabled = true;
    },

    // ─── Render ───
    _render: function () {
      if (!this._state) return;

      var state = this._state;

      // Progress
      if (this._progressEl) {
        this._progressEl.textContent = 'Puzzle ' + (state.currentPuzzle + 1) + ' of ' + state.totalPuzzles;
      }

      // Category badge
      if (this._categoryEl) {
        this._categoryEl.textContent = state.category || '';
      }

      // Emojis
      if (this._emojisEl) {
        this._emojisEl.textContent = state.currentEmojis || '';
      }

      // Hint
      if (this._hintEl) {
        this._hintEl.textContent = state.hint ? 'Hint: ' + state.hint : '';
      }

      // Scores
      this._renderScores();
    },

    // ─── Render Scores ───
    _renderScores: function () {
      if (!this._scoresEl || !this._state) return;

      var state = this._state;
      var scores = state.scores || {};
      var playerIds = state.players || [];

      var html = '<div class="eg-scores-title">Scores</div>';

      for (var i = 0; i < playerIds.length; i++) {
        var pid = playerIds[i];
        var name = this._getPlayerName(pid);
        var score = scores[pid] || 0;
        var isMe = pid === this._ctx.playerId;

        html += '<div class="eg-score-row' + (isMe ? ' eg-score-me' : '') + '">';
        html += '<span class="eg-score-name">' + escHtml(name);
        if (isMe) html += ' <span class="eg-score-you">(you)</span>';
        html += '</span>';
        html += '<span class="eg-score-val">' + score + '</span>';
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
      if (this._container) {
        this._container.innerHTML = '';
      }
      this._container = null;
      this._ctx = null;
      this._state = null;
      this._inputEl = null;
      this._submitBtn = null;
      this._emojisEl = null;
      this._statusEl = null;
      this._scoresEl = null;
      this._progressEl = null;
      this._hintEl = null;
      this._categoryEl = null;
    }
  };

  // ─── Helpers ───
  function escHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // ─── Register ───
  SpaceGames.registerGame('emojiguess', handler);
})();
