/* ═══════════════════════════════════════
   Tic Tac Toe - SpaceGames Module
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  var _active = false;
  var _container = null;
  var _ctx = null;

  // All eight possible winning lines (cell indices).
  var WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  // ─── Helpers ───

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /** Return the player id whose turn it is based on state.turn. */
  function currentTurnId(state) {
    var idx = state.turn % 2;
    return state.players[idx];
  }

  /** Detect a winning line on the board. Returns the [a,b,c] triple or null. */
  function findWinLine(board) {
    for (var i = 0; i < WIN_LINES.length; i++) {
      var line = WIN_LINES[i];
      var a = line[0], b = line[1], c = line[2];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return line;
      }
    }
    return null;
  }

  /** True when the local player is one of the two game participants. */
  function isPlayer() {
    return _ctx && _ctx.gamePlayers && _ctx.gamePlayers.indexOf(_ctx.playerId) !== -1;
  }

  /** True when it is the local player's turn. */
  function isMyTurn(state) {
    return isPlayer() && currentTurnId(state) === _ctx.playerId;
  }

  // ─── Rendering ───

  function render(state) {
    if (!_container) return;
    _container.innerHTML = '';

    var winLine = findWinLine(state.board);
    var winSet = {};
    if (winLine) {
      winSet[winLine[0]] = true;
      winSet[winLine[1]] = true;
      winSet[winLine[2]] = true;
    }

    // -- Player bar --
    var bar = document.createElement('div');
    bar.className = 'game-players-bar';

    for (var p = 0; p < state.players.length; p++) {
      var pid = state.players[p];
      var mark = state.marks[pid];
      var name = (_ctx.players && _ctx.players[pid]) || 'Player ' + (p + 1);
      var isTurn = currentTurnId(state) === pid && !winLine;
      var isYou = pid === _ctx.playerId;

      var card = document.createElement('div');
      card.className = 'game-player-info' + (isTurn ? ' active' : '');

      var markerSpan = document.createElement('span');
      markerSpan.className = 'gp-marker';
      markerSpan.textContent = mark;
      card.appendChild(markerSpan);

      var nameSpan = document.createElement('span');
      nameSpan.className = 'gp-name';
      nameSpan.textContent = name;
      card.appendChild(nameSpan);

      if (isYou) {
        var youSpan = document.createElement('span');
        youSpan.className = 'gp-you';
        youSpan.textContent = SpaceGames.t('you');
        card.appendChild(youSpan);
      }

      bar.appendChild(card);
    }

    _container.appendChild(bar);

    // -- Turn indicator --
    var indicator = document.createElement('div');
    indicator.className = 'game-turn-indicator';

    if (winLine) {
      var winnerId = currentTurnId({ turn: state.turn - 1, players: state.players });
      var winnerName = (_ctx.players && _ctx.players[winnerId]) || 'Someone';
      if (winnerId === _ctx.playerId) {
        indicator.innerHTML = 'You won!';
      } else {
        indicator.innerHTML = '<span class="turn-name">' + esc(winnerName) + '</span> wins!';
      }
    } else if (state.board.every(function (c) { return c !== null; })) {
      indicator.textContent = "It's a draw!";
    } else if (!isPlayer()) {
      var spectatingName = (_ctx.players && _ctx.players[currentTurnId(state)]) || 'a player';
      indicator.innerHTML = 'Watching \u2014 <span class="turn-name">' + esc(spectatingName) + '</span>\'s turn';
    } else if (isMyTurn(state)) {
      indicator.innerHTML = SpaceGames.t('your_turn');
    } else {
      var oppId = currentTurnId(state);
      var oppName = (_ctx.players && _ctx.players[oppId]) || 'Opponent';
      indicator.innerHTML = SpaceGames.t('waiting_for', {name: '<span class="turn-name">' + esc(oppName) + '</span>'});
    }

    _container.appendChild(indicator);

    // -- Board --
    var prevBoard = _container._prevBoard || [];
    var board = document.createElement('div');
    board.className = 'ttt-board';

    for (var i = 0; i < 9; i++) {
      (function (cellIdx) {
        var cell = document.createElement('div');
        var val = state.board[cellIdx];

        var classes = 'ttt-cell';
        if (val) {
          classes += ' taken';
          // Mark as new if this cell just appeared
          if (!prevBoard[cellIdx] && val) classes += ' new';
        }
        if (winSet[cellIdx]) {
          classes += ' win';
        }
        cell.className = classes;

        // Render SVG marks instead of text
        if (val === 'X') {
          cell.innerHTML = '<svg class="ttt-mark x-mark" viewBox="0 0 100 100"><line x1="20" y1="20" x2="80" y2="80"/><line x1="80" y1="20" x2="20" y2="80"/></svg>';
        } else if (val === 'O') {
          cell.innerHTML = '<svg class="ttt-mark o-mark" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35"/></svg>';
        }

        if (!val && !winLine && isMyTurn(state)) {
          cell.addEventListener('click', function () {
            _ctx.socket.emit('game-move', { move: { cell: cellIdx } });
          });
        }

        board.appendChild(cell);
      })(i);
    }

    _container._prevBoard = state.board.slice();
    _container.appendChild(board);
  }

  // ─── Handler ───

  var handler = {
    get _active() { return _active; },
    set _active(v) { _active = v; },

    init: function (container, ctx) {
      _active = true;
      _container = container;
      _ctx = ctx;
      render(ctx.gameState);
    },

    onUpdate: function (data) {
      if (!_active || !_container) return;
      // Merge updated state into our context so subsequent renders use fresh data.
      if (data.state) {
        _ctx.gameState = data.state;
      }
      render(_ctx.gameState);
    },

    destroy: function () {
      _active = false;
      if (_container) {
        _container.innerHTML = '';
      }
      _container = null;
      _ctx = null;
    }
  };

  SpaceGames.registerGame('tictactoe', handler);
})();
