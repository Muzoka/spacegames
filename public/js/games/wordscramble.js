/* ═══════════════════════════════════════
   SPACEGAMES - Word Scramble Game Module
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Handler ───
  var handler = {
    _active: false,
    _container: null,
    _ctx: null,
    _state: null,
    _progressEl: null,
    _scrambledEl: null,
    _hintEl: null,
    _inputRowEl: null,
    _inputEl: null,
    _submitBtn: null,
    _scoresEl: null,
    _messageEl: null,

    // ─── Init ───
    init: function (container, ctx) {
      this._active = true;
      this._container = container;
      this._ctx = ctx;
      this._state = ctx.gameState;

      container.innerHTML = '';

      // Main wrapper
      var wrapper = document.createElement('div');
      wrapper.className = 'ws-container';
      container.appendChild(wrapper);

      // Progress: "Word X of Y"
      this._progressEl = document.createElement('div');
      this._progressEl.className = 'ws-progress';
      wrapper.appendChild(this._progressEl);

      // Scrambled word display
      this._scrambledEl = document.createElement('div');
      this._scrambledEl.className = 'ws-scrambled';
      wrapper.appendChild(this._scrambledEl);

      // Hint text
      this._hintEl = document.createElement('div');
      this._hintEl.className = 'ws-hint';
      wrapper.appendChild(this._hintEl);

      // Message area (solved / timeout feedback)
      this._messageEl = document.createElement('div');
      this._messageEl.className = 'ws-message';
      wrapper.appendChild(this._messageEl);

      // Input row: text input + submit button
      this._inputRowEl = document.createElement('div');
      this._inputRowEl.className = 'ws-input-row';
      wrapper.appendChild(this._inputRowEl);

      this._inputEl = document.createElement('input');
      this._inputEl.type = 'text';
      this._inputEl.placeholder = SpaceGames.t('type_guess');
      this._inputEl.autocomplete = 'off';
      this._inputEl.addEventListener('keydown', this._onKeyDown.bind(this));
      this._inputRowEl.appendChild(this._inputEl);

      this._submitBtn = document.createElement('button');
      this._submitBtn.textContent = SpaceGames.t('btn_submit');
      this._submitBtn.addEventListener('click', this._onSubmit.bind(this));
      this._inputRowEl.appendChild(this._submitBtn);

      // Scoreboard
      this._scoresEl = document.createElement('div');
      this._scoresEl.className = 'ws-scores';
      wrapper.appendChild(this._scoresEl);

      // Initial render
      this._render();
    },

    // ─── Key Handler (Enter to submit) ───
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

      this._ctx.socket.emit('game-move', { move: { guess: guess } });
      this._inputEl.value = '';
    },

    // ─── On Update ───
    onUpdate: function (data) {
      if (!this._active) return;

      var prevWord = this._state ? this._state.currentWord : -1;
      this._state = data.state;

      // Determine message to show
      if (data.state.solved && data.state.solvedBy) {
        var solverName = this._getPlayerName(data.state.solvedBy);
        this._messageEl.textContent = SpaceGames.t('solved_by', {name: solverName});
        this._messageEl.className = 'ws-message ws-solved';
      } else if (data.timeout) {
        this._messageEl.textContent = SpaceGames.t('times_up') + ' ' + SpaceGames.t('answer_was', {a: (data.state.correctWord || '???')});
        this._messageEl.className = 'ws-message ws-timeout';
      } else {
        // New word round - clear the message and reset input
        this._messageEl.textContent = '';
        this._messageEl.className = 'ws-message';
      }

      // Reset input when a new word starts
      if (this._inputEl && data.state.currentWord !== prevWord) {
        this._inputEl.value = '';
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

      // Scrambled letters
      if (this._scrambledEl) {
        this._scrambledEl.textContent = state.scrambled || '';
      }

      // Hint
      if (this._hintEl) {
        this._hintEl.textContent = state.hint ? SpaceGames.t('hm_hint') + ': ' + state.hint : '';
      }

      // Disable input when the round is solved
      if (this._inputEl) {
        this._inputEl.disabled = !!state.solved;
      }
      if (this._submitBtn) {
        this._submitBtn.disabled = !!state.solved;
      }

      // Focus the input when the round is active
      if (this._inputEl && !state.solved) {
        this._inputEl.focus();
      }

      // Scores
      this._renderScores();
    },

    // ─── Render Scores ───
    _renderScores: function () {
      if (!this._scoresEl || !this._state || !this._ctx) return;

      var state = this._state;
      var scores = state.scores || {};
      var playerIds = state.players || [];

      var html = '<div class="ws-scores-title">' + SpaceGames.t('score') + '</div>';
      for (var i = 0; i < playerIds.length; i++) {
        var pid = playerIds[i];
        var name = this._getPlayerName(pid);
        var score = scores[pid] || 0;
        var isMe = pid === this._ctx.playerId;

        html += '<div class="ws-score-row' + (isMe ? ' ws-score-me' : '') + '">';
        html += '<span class="ws-score-name">' + escHtml(name) + '</span>';
        html += '<span class="ws-score-value">' + score + '</span>';
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
      this._progressEl = null;
      this._scrambledEl = null;
      this._hintEl = null;
      this._inputRowEl = null;
      this._inputEl = null;
      this._submitBtn = null;
      this._scoresEl = null;
      this._messageEl = null;
    }
  };

  // ─── Helpers ───
  function escHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // ─── Register ───
  SpaceGames.registerGame('wordscramble', handler);
})();
