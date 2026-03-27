/* ═══════════════════════════════════════
   SPACEGAMES - Connect Four Game Module
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  var ROWS = 6;
  var COLS = 7;

  // ─── Handler ───
  var handler = {
    _active: false,
    _container: null,
    _ctx: null,
    _state: null,
    _boardEl: null,
    _turnEl: null,
    _playerBarEl: null,

    // ─── Init ───
    init: function (container, ctx) {
      this._active = true;
      this._container = container;
      this._ctx = ctx;
      this._state = ctx.gameState;

      container.innerHTML = '';

      // Player bar
      this._playerBarEl = document.createElement('div');
      this._playerBarEl.className = 'game-players-bar';
      container.appendChild(this._playerBarEl);

      // Turn indicator
      this._turnEl = document.createElement('div');
      this._turnEl.className = 'game-turn-indicator';
      container.appendChild(this._turnEl);

      // Column drop buttons
      var colIndicator = document.createElement('div');
      colIndicator.className = 'c4-col-indicator';
      for (var c = 0; c < COLS; c++) {
        var btn = document.createElement('button');
        btn.className = 'c4-col-btn';
        btn.textContent = '\u25BC';
        btn.dataset.col = c;
        btn.addEventListener('click', this._onColumnClick.bind(this));
        colIndicator.appendChild(btn);
      }
      container.appendChild(colIndicator);

      // Board grid
      this._boardEl = document.createElement('div');
      this._boardEl.className = 'c4-board';
      container.appendChild(this._boardEl);

      this._renderBoard(null);
      this._renderPlayerBar();
      this._renderTurn();
    },

    // ─── Column Click ───
    _onColumnClick: function (e) {
      if (!this._active || !this._state || !this._ctx) return;

      var col = parseInt(e.currentTarget.dataset.col, 10);
      var myId = this._ctx.playerId;
      var turnIndex = this._state.turn;
      var currentPlayerId = this._state.players[turnIndex];

      // Only allow the current player to move
      if (myId !== currentPlayerId) return;

      // Only allow if the column is not full
      if (this._state.board[0][col] !== null) return;

      this._ctx.socket.emit('game-move', { move: { col: col } });
    },

    // ─── On Update ───
    onUpdate: function (data) {
      if (!this._active) return;

      this._state = data.state;
      this._renderBoard(data.lastMove || null);
      this._renderTurn();
      this._renderPlayerBar();
    },

    // ─── Render Board ───
    _renderBoard: function (lastMove) {
      if (!this._boardEl || !this._state) return;

      var board = this._state.board;
      var winCells = this._state.winCells || null;
      var html = '';

      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var val = board[r][c];
          var classes = 'c4-cell';

          if (val === 'R') classes += ' R';
          else if (val === 'Y') classes += ' Y';

          // Mark winning cells
          if (winCells) {
            for (var w = 0; w < winCells.length; w++) {
              if (winCells[w][0] === r && winCells[w][1] === c) {
                classes += ' win';
                break;
              }
            }
          }

          // Drop animation: apply to the last placed piece
          var isDrop = lastMove && lastMove.row === r && lastMove.col === c;
          if (isDrop) {
            classes += ' c4-drop';
          }

          html += '<div class="' + classes + '" data-row="' + r + '" data-col="' + c + '"></div>';
        }
      }

      this._boardEl.innerHTML = html;
    },

    // ─── Render Player Bar ───
    _renderPlayerBar: function () {
      if (!this._playerBarEl || !this._state || !this._ctx) return;

      var state = this._state;
      var players = this._ctx.players;
      var turnIndex = state.turn;
      var currentPlayerId = state.players[turnIndex];

      var html = '';
      for (var i = 0; i < state.players.length; i++) {
        var pid = state.players[i];
        var color = state.colors[pid];
        var icon = color === 'R' ? '\uD83D\uDD34' : '\uD83D\uDFE1';
        var name = this._getPlayerName(pid);
        var isActive = pid === currentPlayerId;

        html += '<div class="game-player-info' + (isActive ? ' active' : '') + '">';
        html += '<span>' + icon + ' ' + escHtml(name) + '</span>';
        if (pid === this._ctx.playerId) {
          html += '<span style="font-size:0.75rem;opacity:0.7;margin-left:4px;">(you)</span>';
        }
        html += '</div>';
      }

      this._playerBarEl.innerHTML = html;
    },

    // ─── Render Turn Indicator ───
    _renderTurn: function () {
      if (!this._turnEl || !this._state || !this._ctx) return;

      var state = this._state;

      // If the game has a winner or is a draw, the server should handle game-over.
      // But show current turn info while the game is active.
      var turnIndex = state.turn;
      var currentPlayerId = state.players[turnIndex];
      var color = state.colors[currentPlayerId];
      var icon = color === 'R' ? '\uD83D\uDD34' : '\uD83D\uDFE1';

      if (currentPlayerId === this._ctx.playerId) {
        this._turnEl.textContent = icon + ' Your turn! Drop a piece.';
      } else {
        var name = this._getPlayerName(currentPlayerId);
        this._turnEl.textContent = icon + ' ' + name + "'s turn";
      }
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
      this._boardEl = null;
      this._turnEl = null;
      this._playerBarEl = null;
    }
  };

  // ─── Helpers ───
  function escHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // ─── Register ───
  SpaceGames.registerGame('connect4', handler);
})();
