/* ═══════════════════════════════════════
   SPACEGAMES - Fast Math Game Module
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Difficulty Labels & Colors ───
  var DIFFICULTY_MAP = {
    1: { labelKey: 'fm_easy',      color: 'var(--success)' },
    2: { labelKey: 'fm_medium',    color: 'var(--accent)' },
    3: { labelKey: 'fm_hard',      color: '#f97316' },
    4: { labelKey: 'fm_challenge', color: 'var(--danger)' }
  };

  // ─── Handler ───
  var handler = {
    _active: false,
    _container: null,
    _ctx: null,
    _state: null,
    _prevProblem: -1,
    _progressEl: null,
    _diffBadgeEl: null,
    _problemCardEl: null,
    _problemTextEl: null,
    _inputRowEl: null,
    _inputEl: null,
    _submitBtn: null,
    _statusEl: null,
    _scoresEl: null,

    // ─── Init ───
    init: function (container, ctx) {
      this._active = true;
      this._container = container;
      this._ctx = ctx;
      this._state = ctx.gameState;
      this._prevProblem = -1;

      container.innerHTML = '';

      // Main wrapper
      var wrapper = document.createElement('div');
      wrapper.className = 'fm-container';
      container.appendChild(wrapper);

      // Progress: "Problem X of 10"
      this._progressEl = document.createElement('div');
      this._progressEl.className = 'fm-progress';
      wrapper.appendChild(this._progressEl);

      // Difficulty badge
      this._diffBadgeEl = document.createElement('div');
      this._diffBadgeEl.className = 'fm-difficulty-badge';
      wrapper.appendChild(this._diffBadgeEl);

      // Problem display card
      this._problemCardEl = document.createElement('div');
      this._problemCardEl.className = 'fm-problem-card';
      wrapper.appendChild(this._problemCardEl);

      this._problemTextEl = document.createElement('div');
      this._problemTextEl.className = 'fm-problem-text';
      this._problemCardEl.appendChild(this._problemTextEl);

      // Input row: number input + submit button
      this._inputRowEl = document.createElement('div');
      this._inputRowEl.className = 'fm-input-row';
      wrapper.appendChild(this._inputRowEl);

      this._inputEl = document.createElement('input');
      this._inputEl.type = 'text';
      this._inputEl.inputMode = 'numeric';
      this._inputEl.placeholder = 'Answer...';
      this._inputEl.autocomplete = 'off';
      this._inputEl.className = 'fm-input';
      this._inputEl.addEventListener('keydown', this._onKeyDown.bind(this));
      this._inputRowEl.appendChild(this._inputEl);

      this._submitBtn = document.createElement('button');
      this._submitBtn.className = 'fm-submit-btn';
      this._submitBtn.textContent = SpaceGames.t('btn_submit');
      this._submitBtn.addEventListener('click', this._onSubmit.bind(this));
      this._inputRowEl.appendChild(this._submitBtn);

      // Status message area
      this._statusEl = document.createElement('div');
      this._statusEl.className = 'fm-status';
      wrapper.appendChild(this._statusEl);

      // Scoreboard
      this._scoresEl = document.createElement('div');
      this._scoresEl.className = 'fm-scores';
      wrapper.appendChild(this._scoresEl);

      // Inject scoped styles
      this._injectStyles();

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

    // ─── Submit Answer ───
    _onSubmit: function () {
      if (!this._active || !this._ctx || !this._inputEl) return;
      if (this._inputEl.disabled) return;

      var answer = this._inputEl.value.trim();
      if (!answer) return;

      // Validate: only allow numbers, optional leading minus
      if (!/^-?\d+$/.test(answer)) return;

      this._ctx.socket.emit('game-move', { move: { answer: answer } });
      this._inputEl.value = '';
    },

    // ─── On Update ───
    onUpdate: function (data) {
      if (!this._active) return;

      var prevProblem = this._state ? this._state.currentProblem : -1;
      this._state = data.state;

      // Determine status message
      if (data.state.solved && data.state.solvedBy) {
        var solverName = this._getPlayerName(data.state.solvedBy);
        this._statusEl.textContent = SpaceGames.t('solved_by', {name: solverName});
        this._statusEl.className = 'fm-status fm-status-solved';
      } else if (data.timeout) {
        var answerText = data.state.answer !== undefined ? data.state.answer : '???';
        this._statusEl.textContent = SpaceGames.t('times_up') + ' ' + SpaceGames.t('answer_was', {a: answerText});
        this._statusEl.className = 'fm-status fm-status-timeout';
      } else {
        this._statusEl.textContent = SpaceGames.t('type_answer');
        this._statusEl.className = 'fm-status';
      }

      // Reset input when a new problem starts
      if (this._inputEl && data.state.currentProblem !== prevProblem) {
        this._inputEl.value = '';
        this._prevProblem = data.state.currentProblem;
      }

      this._render();
    },

    // ─── Render ───
    _render: function () {
      if (!this._state) return;

      var state = this._state;

      // Progress
      if (this._progressEl) {
        this._progressEl.textContent = SpaceGames.t('problem_of', {n: state.currentProblem + 1, t: state.totalProblems});
      }

      // Difficulty badge
      if (this._diffBadgeEl) {
        var diff = DIFFICULTY_MAP[state.difficulty] || DIFFICULTY_MAP[1];
        this._diffBadgeEl.textContent = SpaceGames.t(diff.labelKey);
        this._diffBadgeEl.style.background = diff.color;
        this._diffBadgeEl.style.color = '#fff';
      }

      // Problem card glow based on difficulty
      if (this._problemCardEl) {
        var diffInfo = DIFFICULTY_MAP[state.difficulty] || DIFFICULTY_MAP[1];
        this._problemCardEl.style.borderColor = diffInfo.color;
        this._problemCardEl.style.boxShadow = '0 0 20px ' + diffInfo.color.replace(')', ', 0.3)').replace('var(', '').replace(')', '') + ', inset 0 1px 0 rgba(255,255,255,0.05)';
        // Use a simpler glow approach
        this._problemCardEl.style.boxShadow = '0 0 25px rgba(124, 58, 237, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)';
      }

      // Problem text - styled with colors
      if (this._problemTextEl && state.problem) {
        this._problemTextEl.innerHTML = this._formatProblem(state.problem);
      } else if (this._problemTextEl) {
        this._problemTextEl.textContent = '...';
      }

      // Input disable/enable
      var isSolved = !!state.solved;
      if (this._inputEl) {
        this._inputEl.disabled = isSolved;
      }
      if (this._submitBtn) {
        this._submitBtn.disabled = isSolved;
      }

      // Auto-focus when the round is active
      if (this._inputEl && !isSolved) {
        this._inputEl.focus();
      }

      // Scores
      this._renderScores();
    },

    // ─── Format Problem with Colored Parts ───
    _formatProblem: function (problem) {
      // Split the problem string into parts: numbers and operators
      // Example: "12 + 7" or "45 - 12" or "6 * 8"
      var parts = problem.split(/(\s*[+\-*/]\s*)/);
      var html = '';

      for (var i = 0; i < parts.length; i++) {
        var part = parts[i].trim();
        if (!part) continue;

        if (/^[+\-*/]$/.test(part)) {
          // Operator in accent color
          html += '<span class="fm-op"> ' + escHtml(part) + ' </span>';
        } else {
          // Number in primary color
          html += '<span class="fm-num">' + escHtml(part) + '</span>';
        }
      }

      // Append "= ?"
      html += '<span class="fm-eq"> = ?</span>';

      return html;
    },

    // ─── Render Scores ───
    _renderScores: function () {
      if (!this._scoresEl || !this._state || !this._ctx) return;

      var state = this._state;
      var scores = state.scores || {};
      var playerIds = state.players || [];

      // Build sorted entries
      var entries = [];
      for (var i = 0; i < playerIds.length; i++) {
        var pid = playerIds[i];
        entries.push({ id: pid, name: this._getPlayerName(pid), score: scores[pid] || 0 });
      }
      entries.sort(function (a, b) { return b.score - a.score; });

      var html = '<div class="fm-scores-title">' + SpaceGames.t('score') + '</div>';
      for (var j = 0; j < entries.length; j++) {
        var e = entries[j];
        var isMe = e.id === this._ctx.playerId;
        html += '<div class="fm-score-row' + (isMe ? ' fm-score-me' : '') + '">';
        html += '<span class="fm-score-name">' + escHtml(e.name) + '</span>';
        html += '<span class="fm-score-value">' + e.score + '</span>';
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

    // ─── Inject Scoped Styles ───
    _injectStyles: function () {
      if (document.getElementById('fm-styles')) return;

      var style = document.createElement('style');
      style.id = 'fm-styles';
      style.textContent =
        '.fm-container {' +
        '  display: flex; flex-direction: column; align-items: center;' +
        '  gap: 16px; padding: 20px; max-width: 600px; margin: 0 auto;' +
        '}' +

        '.fm-progress {' +
        '  font-size: 0.95rem; color: var(--text-muted); letter-spacing: 0.5px;' +
        '  text-transform: uppercase; font-weight: 600;' +
        '}' +

        '.fm-difficulty-badge {' +
        '  display: inline-block; padding: 4px 16px; border-radius: 20px;' +
        '  font-size: 0.8rem; font-weight: 700; letter-spacing: 1px;' +
        '  text-transform: uppercase;' +
        '}' +

        '.fm-problem-card {' +
        '  width: 100%; padding: 40px 24px; text-align: center;' +
        '  background: var(--bg-2); border: 2px solid var(--primary);' +
        '  border-radius: var(--radius-lg);' +
        '  box-shadow: 0 0 25px var(--primary-glow), inset 0 1px 0 rgba(255,255,255,0.05);' +
        '  transition: border-color var(--transition), box-shadow var(--transition);' +
        '}' +

        '.fm-problem-text {' +
        '  font-family: var(--font-mono); font-size: 3.2rem; font-weight: 700;' +
        '  line-height: 1.3; user-select: none;' +
        '}' +

        '.fm-num {' +
        '  color: var(--primary); text-shadow: 0 0 12px var(--primary-glow);' +
        '}' +

        '.fm-op {' +
        '  color: var(--accent); font-weight: 400;' +
        '}' +

        '.fm-eq {' +
        '  color: var(--text-dim); font-weight: 400;' +
        '}' +

        '.fm-input-row {' +
        '  display: flex; gap: 10px; width: 100%; max-width: 400px;' +
        '}' +

        '.fm-input {' +
        '  flex: 1; padding: 14px 18px; font-size: 1.4rem; text-align: center;' +
        '  font-family: var(--font-mono); font-weight: 600;' +
        '  background: var(--surface); color: var(--text);' +
        '  border: 2px solid var(--border); border-radius: var(--radius);' +
        '  outline: none; transition: border-color var(--transition);' +
        '}' +

        '.fm-input:focus {' +
        '  border-color: var(--primary);' +
        '  box-shadow: 0 0 10px var(--primary-glow);' +
        '}' +

        '.fm-input:disabled {' +
        '  opacity: 0.5; cursor: not-allowed;' +
        '}' +

        '.fm-submit-btn {' +
        '  padding: 14px 28px; font-size: 1rem; font-weight: 700;' +
        '  background: var(--primary); color: #fff; border: none;' +
        '  border-radius: var(--radius); cursor: pointer;' +
        '  transition: background var(--transition), box-shadow var(--transition);' +
        '  text-transform: uppercase; letter-spacing: 0.5px;' +
        '}' +

        '.fm-submit-btn:hover:not(:disabled) {' +
        '  background: var(--primary-hover);' +
        '  box-shadow: 0 0 15px var(--primary-glow);' +
        '}' +

        '.fm-submit-btn:disabled {' +
        '  opacity: 0.5; cursor: not-allowed;' +
        '}' +

        '.fm-status {' +
        '  font-size: 1rem; color: var(--text-muted); text-align: center;' +
        '  min-height: 1.5em; transition: color var(--transition);' +
        '}' +

        '.fm-status-solved {' +
        '  color: var(--success); font-weight: 600;' +
        '}' +

        '.fm-status-timeout {' +
        '  color: var(--danger); font-weight: 600;' +
        '}' +

        '.fm-scores {' +
        '  width: 100%; max-width: 400px; margin-top: 8px;' +
        '}' +

        '.fm-scores-title {' +
        '  font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;' +
        '  color: var(--text-dim); margin-bottom: 8px; font-weight: 600;' +
        '}' +

        '.fm-score-row {' +
        '  display: flex; justify-content: space-between; align-items: center;' +
        '  padding: 8px 14px; margin-bottom: 4px;' +
        '  background: var(--surface); border-radius: var(--radius-sm);' +
        '  border: 1px solid transparent; transition: border-color var(--transition);' +
        '}' +

        '.fm-score-me {' +
        '  border-color: var(--primary);' +
        '  background: rgba(124, 58, 237, 0.1);' +
        '}' +

        '.fm-score-name {' +
        '  color: var(--text); font-weight: 500;' +
        '}' +

        '.fm-score-value {' +
        '  color: var(--accent); font-weight: 700; font-family: var(--font-mono);' +
        '  font-size: 1.1rem;' +
        '}';

      document.head.appendChild(style);
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
      this._prevProblem = -1;
      this._progressEl = null;
      this._diffBadgeEl = null;
      this._problemCardEl = null;
      this._problemTextEl = null;
      this._inputRowEl = null;
      this._inputEl = null;
      this._submitBtn = null;
      this._statusEl = null;
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
  SpaceGames.registerGame('fastmath', handler);
})();
