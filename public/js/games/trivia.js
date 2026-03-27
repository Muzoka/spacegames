/* ═══════════════════════════════════════
   SPACEGAMES - Trivia Battle Game Module
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Handler ───
  var handler = {
    _active: false,
    _container: null,
    _ctx: null,
    _state: null,
    _selectedAnswer: null,

    // ─── Init ───
    init: function (container, ctx) {
      this._active = true;
      this._container = container;
      this._ctx = ctx;
      this._state = ctx.gameState;
      this._selectedAnswer = null;

      container.innerHTML = '';

      var wrapper = document.createElement('div');
      wrapper.className = 'trivia-container';
      container.appendChild(wrapper);

      this._render();
    },

    // ─── On Update ───
    onUpdate: function (data) {
      if (!this._active) return;

      var prevPhase = this._state ? this._state.phase : null;
      this._state = data.state;

      // Reset selection when a new question arrives
      if (data.state.phase === 'question' && prevPhase !== 'question') {
        this._selectedAnswer = null;
      }

      this._render();
    },

    // ─── Full Render ───
    _render: function () {
      if (!this._container || !this._state) return;

      var wrapper = this._container.querySelector('.trivia-container');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'trivia-container';
        this._container.innerHTML = '';
        this._container.appendChild(wrapper);
      }

      var state = this._state;
      var q = state.currentQuestion;
      var html = '';

      // Progress
      html += '<div class="trivia-progress">' + SpaceGames.t('question_of', {n: state.currentQ, t: state.totalQuestions}) + '</div>';

      // Category badge
      if (q && q.category) {
        html += '<div class="trivia-category">' + escHtml(q.category) + '</div>';
      }

      // Question text
      if (q && q.q) {
        html += '<div class="trivia-question">' + escHtml(q.q) + '</div>';
      }

      // Options
      if (q && q.options) {
        html += '<div class="trivia-options">';
        for (var i = 0; i < q.options.length; i++) {
          var classes = 'trivia-option';

          if (state.phase === 'reveal') {
            // Disable all during reveal
            classes += ' disabled';

            // Mark correct answer
            if (q.correct === i) {
              classes += ' correct';
            }

            // Mark player's selection
            if (this._selectedAnswer === i) {
              if (q.correct !== i) {
                classes += ' wrong';
              }
              classes += ' selected';
            }
          } else {
            // Question phase
            if (this._selectedAnswer === i) {
              classes += ' selected';
            }
            if (this._selectedAnswer !== null) {
              classes += ' disabled';
            }
          }

          html += '<button class="' + classes + '" data-index="' + i + '">';
          html += '<span class="trivia-option-letter">' + String.fromCharCode(65 + i) + '</span> ';
          html += escHtml(q.options[i]);
          html += '</button>';
        }
        html += '</div>';
      }

      // Reveal phase: show who answered what
      if (state.phase === 'reveal' && state.revealData) {
        html += this._renderRevealInfo(state.revealData);
      }

      // Scores
      html += this._renderScores(state.scores);

      wrapper.innerHTML = html;

      // Bind click handlers on options (only during question phase, before an answer is selected)
      if (state.phase === 'question' && this._selectedAnswer === null) {
        var buttons = wrapper.querySelectorAll('.trivia-option');
        for (var j = 0; j < buttons.length; j++) {
          buttons[j].addEventListener('click', this._onAnswerClick.bind(this));
        }
      }
    },

    // ─── Render Reveal Info ───
    _renderRevealInfo: function (revealData) {
      if (!revealData || !revealData.answered) return '';

      var html = '<div class="trivia-reveal-info">';
      var answered = revealData.answered;

      for (var pid in answered) {
        if (!answered.hasOwnProperty(pid)) continue;
        var name = this._getPlayerName(pid);
        var answerIdx = answered[pid];
        var isCorrect = revealData.correct === answerIdx;
        var letter = String.fromCharCode(65 + answerIdx);
        html += '<div class="trivia-reveal-row">';
        html += '<span class="trivia-reveal-name">' + escHtml(name) + '</span>';
        html += '<span class="trivia-reveal-answer ' + (isCorrect ? 'correct' : 'wrong') + '">';
        html += letter + (isCorrect ? ' \u2713' : ' \u2717');
        html += '</span>';
        html += '</div>';
      }

      html += '</div>';
      return html;
    },

    // ─── Render Scores ───
    _renderScores: function (scores) {
      if (!scores) return '';

      // Build sorted entries
      var entries = [];
      for (var pid in scores) {
        if (!scores.hasOwnProperty(pid)) continue;
        entries.push({ id: pid, name: this._getPlayerName(pid), score: scores[pid] });
      }
      entries.sort(function (a, b) { return b.score - a.score; });

      var html = '<div class="trivia-scores">';
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        var isMe = e.id === this._ctx.playerId;
        html += '<div class="trivia-score-card' + (isMe ? ' me' : '') + '">';
        html += '<span class="score-name">' + escHtml(e.name) + '</span>';
        html += '<span class="score-val">' + e.score + '</span>';
        html += '</div>';
      }
      html += '</div>';

      return html;
    },

    // ─── Answer Click ───
    _onAnswerClick: function (e) {
      if (!this._active || !this._state || !this._ctx) return;
      if (this._state.phase !== 'question') return;
      if (this._selectedAnswer !== null) return;

      var btn = e.currentTarget;
      var index = parseInt(btn.dataset.index, 10);
      if (isNaN(index) || index < 0 || index > 3) return;

      this._selectedAnswer = index;

      // Emit move to server
      this._ctx.socket.emit('game-move', { move: { answer: index } });

      // Re-render to show selection and disable buttons
      this._render();
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
      this._selectedAnswer = null;
    }
  };

  // ─── Helpers ───
  function escHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // ─── Register ───
  SpaceGames.registerGame('trivia', handler);
})();
