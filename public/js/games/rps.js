/* ═══════════════════════════════════════
   SPACEGAMES - Rock Paper Scissors Module
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  var CHOICES = ['rock', 'paper', 'scissors'];
  var CHOICE_EMOJI = { rock: '\uD83E\uDEA8', paper: '\uD83D\uDCC4', scissors: '\u2702\uFE0F' };
  var CHOICE_LABEL = { rock: function(){ return SpaceGames.t('rps_rock'); }, paper: function(){ return SpaceGames.t('rps_paper'); }, scissors: function(){ return SpaceGames.t('rps_scissors'); } };
  function choiceLabel(c) { var fn = CHOICE_LABEL[c]; return fn ? fn() : c; }
  var HIDDEN_EMOJI = '\u2753';

  // ─── Handler ───
  var handler = {
    _active: false,
    _container: null,
    _ctx: null,
    _state: null,
    _revealTimer: null,
    _countdownTimer: null,
    _myChoice: null,

    // ─── Init ───
    init: function (container, ctx) {
      this._active = true;
      this._container = container;
      this._ctx = ctx;
      this._state = ctx.gameState;
      this._myChoice = null;

      container.innerHTML = '';
      this._render();
    },

    // ─── On Update ───
    onUpdate: function (data) {
      if (!this._active) return;

      var prevLastRound = this._state.lastRound;
      this._state = data.state;

      // If a new lastRound appeared, both players have chosen - show the reveal
      if (data.state.lastRound && (!prevLastRound || prevLastRound !== data.state.lastRound)) {
        this._showReveal(data.state.lastRound);
      } else {
        this._render();
      }
    },

    // ─── Main Render ───
    _render: function () {
      if (!this._container || !this._state || !this._ctx) return;

      var state = this._state;
      var me = this._ctx.playerId;
      var opponentId = this._getOpponentId();
      var myName = this._getPlayerName(me);
      var opName = this._getPlayerName(opponentId);
      var myScore = state.scores[me] || 0;
      var opScore = state.scores[opponentId] || 0;
      var iHaveChosen = state.pendingChoices && state.pendingChoices[me];
      var opponentHasChosen = state.pendingChoices && state.pendingChoices[opponentId];
      var isPlayer = state.players.indexOf(me) !== -1;

      var html = '';

      // Arena wrapper
      html += '<div class="rps-arena">';

      // Round header
      html += '<div style="font-size:1.1rem;color:var(--text-muted);margin-bottom:6px;">';
      html += SpaceGames.t('round_of', {n: state.round, t: state.maxRounds});
      html += '</div>';

      // Score display
      html += '<div class="rps-score-display">';
      html += '<span>' + escHtml(myName) + ': <strong>' + myScore + '</strong></span>';
      html += '<span style="color:var(--text-dim);margin:0 12px;">' + SpaceGames.t('vs') + '</span>';
      html += '<span>' + escHtml(opName) + ': <strong>' + opScore + '</strong></span>';
      html += '</div>';

      // Player bar
      html += '<div class="game-players-bar" style="margin:16px 0;">';
      for (var i = 0; i < state.players.length; i++) {
        var pid = state.players[i];
        var name = this._getPlayerName(pid);
        var isMe = pid === me;
        var hasChosen = state.pendingChoices && state.pendingChoices[pid];
        html += '<div class="game-player-info' + (hasChosen ? ' active' : '') + '">';
        html += '<span>' + escHtml(name) + '</span>';
        if (isMe) html += '<span style="font-size:0.75rem;opacity:0.7;margin-left:4px;">' + SpaceGames.t('you') + '</span>';
        if (hasChosen) html += '<span style="font-size:0.75rem;color:var(--success);margin-left:6px;">\u2714</span>';
        html += '</div>';
      }
      html += '</div>';

      // Choice buttons (only for players who haven't chosen yet)
      if (isPlayer && !iHaveChosen) {
        html += '<div style="font-size:0.95rem;color:var(--text-muted);margin-bottom:12px;">' + SpaceGames.t('rps_choose') + '</div>';
        html += '<div class="rps-choices">';
        for (var c = 0; c < CHOICES.length; c++) {
          var choice = CHOICES[c];
          html += '<button class="rps-choice" data-choice="' + choice + '">';
          html += '<span style="font-size:2.5rem;">' + CHOICE_EMOJI[choice] + '</span>';
          html += '<span style="font-size:0.8rem;margin-top:4px;">' + choiceLabel(choice) + '</span>';
          html += '</button>';
        }
        html += '</div>';
      } else if (isPlayer && iHaveChosen) {
        // I have chosen, show my selection and waiting state
        html += '<div style="font-size:0.95rem;color:var(--success);margin-bottom:12px;">';
        html += '\u2714 ' + SpaceGames.t('rps_you_chose') + ' ' + (this._myChoice ? CHOICE_EMOJI[this._myChoice] + ' ' + choiceLabel(this._myChoice) : '');
        html += '</div>';
        html += '<div class="rps-choices">';
        for (var c2 = 0; c2 < CHOICES.length; c2++) {
          var ch = CHOICES[c2];
          var isSelected = this._myChoice === ch;
          html += '<button class="rps-choice' + (isSelected ? ' selected' : ' disabled') + '" disabled>';
          html += '<span style="font-size:2.5rem;">' + CHOICE_EMOJI[ch] + '</span>';
          html += '<span style="font-size:0.8rem;margin-top:4px;">' + choiceLabel(ch) + '</span>';
          html += '</button>';
        }
        html += '</div>';

        if (!opponentHasChosen) {
          html += '<div style="margin-top:16px;color:var(--text-dim);font-size:0.9rem;">';
          html += '<span class="rps-waiting-dots">' + SpaceGames.t('rps_waiting') + '</span>';
          html += '</div>';
        }
      } else {
        // Spectator view
        html += '<div style="font-size:0.95rem;color:var(--text-dim);margin:20px 0;">Watching the match...</div>';
        html += '<div class="rps-vs">';
        html += '<div class="rps-player-card">';
        html += '<div style="font-size:0.85rem;color:var(--text-muted);">' + escHtml(this._getPlayerName(state.players[0])) + '</div>';
        html += '<div class="rps-player-choice">' + (state.pendingChoices[state.players[0]] ? HIDDEN_EMOJI : '\u23F3') + '</div>';
        html += '</div>';
        html += '<div style="font-size:1.5rem;color:var(--text-dim);">' + SpaceGames.t('vs').toUpperCase() + '</div>';
        html += '<div class="rps-player-card">';
        html += '<div style="font-size:0.85rem;color:var(--text-muted);">' + escHtml(this._getPlayerName(state.players[1])) + '</div>';
        html += '<div class="rps-player-choice">' + (state.pendingChoices[state.players[1]] ? HIDDEN_EMOJI : '\u23F3') + '</div>';
        html += '</div>';
        html += '</div>';
      }

      html += '</div>'; // close rps-arena

      this._container.innerHTML = html;

      // Bind choice button clicks
      if (isPlayer && !iHaveChosen) {
        var buttons = this._container.querySelectorAll('.rps-choice');
        for (var b = 0; b < buttons.length; b++) {
          buttons[b].addEventListener('click', this._onChoiceClick.bind(this));
        }
      }
    },

    // ─── Choice Click ───
    _onChoiceClick: function (e) {
      if (!this._active || !this._ctx) return;

      var btn = e.currentTarget;
      var choice = btn.dataset.choice;
      if (!choice) return;

      this._myChoice = choice;
      this._ctx.socket.emit('game-move', { move: { choice: choice } });

      // Immediately update UI to show selection
      this._render();
    },

    // ─── Dramatic Reveal ───
    _showReveal: function (lastRound) {
      if (!this._container || !this._ctx) return;

      var self = this;
      var me = this._ctx.playerId;
      var opponentId = this._getOpponentId();
      var myName = this._getPlayerName(me);
      var opName = this._getPlayerName(opponentId);
      var state = this._state;
      var myScore = state.scores[me] || 0;
      var opScore = state.scores[opponentId] || 0;

      var myChoice = lastRound.choices[me];
      var opChoice = lastRound.choices[opponentId];
      var winner = lastRound.winner;

      var resultText, resultClass;
      if (winner === null) {
        resultText = SpaceGames.t('draw');
        resultClass = 'draw';
      } else if (winner === me) {
        resultText = SpaceGames.t('win');
        resultClass = 'win';
      } else {
        resultText = SpaceGames.t('lose');
        resultClass = 'lose';
      }

      // Phase 1: Countdown
      var countdown = 3;
      this._renderRevealCountdown(countdown, myName, opName, myScore, opScore, state);

      this._clearTimers();
      this._countdownTimer = setInterval(function () {
        countdown--;
        if (countdown > 0) {
          self._renderRevealCountdown(countdown, myName, opName, myScore, opScore, state);
        } else {
          clearInterval(self._countdownTimer);
          self._countdownTimer = null;
          // Phase 2: Show results
          self._renderRevealResult(myName, opName, myChoice, opChoice, resultText, resultClass, myScore, opScore, state);

          // Phase 3: After a pause, reset for next round
          self._revealTimer = setTimeout(function () {
            self._revealTimer = null;
            self._myChoice = null;
            if (self._active) {
              self._render();
            }
          }, 3000);
        }
      }, 600);
    },

    // ─── Render Countdown Phase ───
    _renderRevealCountdown: function (count, myName, opName, myScore, opScore, state) {
      if (!this._container) return;

      var html = '<div class="rps-arena">';

      // Round header
      html += '<div style="font-size:1.1rem;color:var(--text-muted);margin-bottom:6px;">';
      html += SpaceGames.t('round_of', {n: state.round, t: state.maxRounds});
      html += '</div>';

      // Score
      html += '<div class="rps-score-display">';
      html += '<span>' + escHtml(myName) + ': <strong>' + myScore + '</strong></span>';
      html += '<span style="color:var(--text-dim);margin:0 12px;">' + SpaceGames.t('vs') + '</span>';
      html += '<span>' + escHtml(opName) + ': <strong>' + opScore + '</strong></span>';
      html += '</div>';

      // Countdown
      html += '<div style="margin:30px 0;">';
      html += '<div style="font-size:1rem;color:var(--text-muted);margin-bottom:10px;">Revealing in...</div>';
      html += '<div style="font-size:4rem;font-weight:900;color:var(--primary);animation:pulse 0.5s ease-in-out;">' + count + '</div>';
      html += '</div>';

      // Hidden choices face-off
      html += '<div class="rps-vs">';
      html += '<div class="rps-player-card">';
      html += '<div style="font-size:0.85rem;color:var(--text-muted);">' + escHtml(myName) + '</div>';
      html += '<div class="rps-player-choice" style="animation:shake 0.3s infinite;">' + HIDDEN_EMOJI + '</div>';
      html += '</div>';
      html += '<div style="font-size:1.5rem;font-weight:700;color:var(--text-dim);">' + SpaceGames.t('vs').toUpperCase() + '</div>';
      html += '<div class="rps-player-card">';
      html += '<div style="font-size:0.85rem;color:var(--text-muted);">' + escHtml(opName) + '</div>';
      html += '<div class="rps-player-choice" style="animation:shake 0.3s infinite;">' + HIDDEN_EMOJI + '</div>';
      html += '</div>';
      html += '</div>';

      html += '</div>';
      this._container.innerHTML = html;
    },

    // ─── Render Reveal Result Phase ───
    _renderRevealResult: function (myName, opName, myChoice, opChoice, resultText, resultClass, myScore, opScore, state) {
      if (!this._container) return;

      var html = '<div class="rps-arena">';

      // Round header
      html += '<div style="font-size:1.1rem;color:var(--text-muted);margin-bottom:6px;">';
      html += SpaceGames.t('round_of', {n: state.round, t: state.maxRounds});
      html += '</div>';

      // Score
      html += '<div class="rps-score-display">';
      html += '<span>' + escHtml(myName) + ': <strong>' + myScore + '</strong></span>';
      html += '<span style="color:var(--text-dim);margin:0 12px;">' + SpaceGames.t('vs') + '</span>';
      html += '<span>' + escHtml(opName) + ': <strong>' + opScore + '</strong></span>';
      html += '</div>';

      // Choices revealed
      html += '<div class="rps-vs">';
      html += '<div class="rps-player-card">';
      html += '<div style="font-size:0.85rem;color:var(--text-muted);">' + escHtml(myName) + '</div>';
      html += '<div class="rps-player-choice" style="animation:bounceIn 0.4s ease-out;">' + (CHOICE_EMOJI[myChoice] || HIDDEN_EMOJI) + '</div>';
      html += '<div style="font-size:0.8rem;color:var(--text-muted);">' + (choiceLabel(myChoice) || '') + '</div>';
      html += '</div>';
      html += '<div style="font-size:1.5rem;font-weight:700;color:var(--text-dim);">' + SpaceGames.t('vs').toUpperCase() + '</div>';
      html += '<div class="rps-player-card">';
      html += '<div style="font-size:0.85rem;color:var(--text-muted);">' + escHtml(opName) + '</div>';
      html += '<div class="rps-player-choice" style="animation:bounceIn 0.4s ease-out;">' + (CHOICE_EMOJI[opChoice] || HIDDEN_EMOJI) + '</div>';
      html += '<div style="font-size:0.8rem;color:var(--text-muted);">' + (choiceLabel(opChoice) || '') + '</div>';
      html += '</div>';
      html += '</div>';

      // Result text
      html += '<div class="rps-result ' + resultClass + '">' + resultText + '</div>';

      html += '</div>';
      this._container.innerHTML = html;
    },

    // ─── Get Opponent ID ───
    _getOpponentId: function () {
      var me = this._ctx.playerId;
      var players = this._state.players;
      for (var i = 0; i < players.length; i++) {
        if (players[i] !== me) return players[i];
      }
      return players[0];
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

    // ─── Clear Timers ───
    _clearTimers: function () {
      if (this._revealTimer) {
        clearTimeout(this._revealTimer);
        this._revealTimer = null;
      }
      if (this._countdownTimer) {
        clearInterval(this._countdownTimer);
        this._countdownTimer = null;
      }
    },

    // ─── Destroy ───
    destroy: function () {
      this._active = false;
      this._clearTimers();
      if (this._container) {
        this._container.innerHTML = '';
      }
      this._container = null;
      this._ctx = null;
      this._state = null;
      this._myChoice = null;
    }
  };

  // ─── Helpers ───
  function escHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // ─── Register ───
  SpaceGames.registerGame('rps', handler);
})();
