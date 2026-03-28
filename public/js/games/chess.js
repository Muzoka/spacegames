(function () {
  'use strict';

  // Piece unicode for captured pieces display
  var PIECE_CHAR = {
    wk: '\u2654', wq: '\u2655', wr: '\u2656', wb: '\u2657', wn: '\u2658', wp: '\u2659',
    bk: '\u265A', bq: '\u265B', br: '\u265C', bb: '\u265D', bn: '\u265E', bp: '\u265F'
  };

  var COL_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  // ═══════════════════════════════════════
  // BOARD STATE CONVERTERS
  // ═══════════════════════════════════════

  // Convert SpaceGames board (2D array) to FEN piece placement
  function boardToFen(board) {
    var fen = '';
    for (var r = 0; r < 8; r++) {
      var empty = 0;
      for (var c = 0; c < 8; c++) {
        var p = board[r][c];
        if (!p) { empty++; continue; }
        if (empty > 0) { fen += empty; empty = 0; }
        var ch = p[1]; // k, q, r, b, n, p
        fen += p[0] === 'w' ? ch.toUpperCase() : ch;
      }
      if (empty > 0) fen += empty;
      if (r < 7) fen += '/';
    }
    return fen;
  }

  // Convert row,col to algebraic (e.g. 0,4 → "e8")
  function toSquare(r, c) {
    return COL_LABELS[c] + (8 - r);
  }

  // Convert algebraic to row,col
  function fromSquare(sq) {
    return { r: 8 - parseInt(sq[1]), c: COL_LABELS.indexOf(sq[0]) };
  }

  // ═══════════════════════════════════════
  // MOVE VALIDATION (needed for legal move hints)
  // ═══════════════════════════════════════

  function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function pieceColor(p) { return p ? p[0] : null; }
  function pieceType(p) { return p ? p[1] : null; }
  function isEnemy(b, r, c, col) { return b[r][c] !== null && pieceColor(b[r][c]) !== col; }
  function isEmpty(b, r, c) { return b[r][c] === null; }

  function addIfValid(moves, b, r, c, col) {
    if (!inBounds(r, c)) return false;
    if (isEmpty(b, r, c)) { moves.push(toSquare(r, c)); return true; }
    if (isEnemy(b, r, c, col)) { moves.push(toSquare(r, c)); }
    return false;
  }

  function slideMoves(moves, b, r, c, col, dirs) {
    for (var d = 0; d < dirs.length; d++) {
      var nr = r + dirs[d][0], nc = c + dirs[d][1];
      while (inBounds(nr, nc)) {
        if (isEmpty(b, nr, nc)) { moves.push(toSquare(nr, nc)); }
        else { if (isEnemy(b, nr, nc, col)) moves.push(toSquare(nr, nc)); break; }
        nr += dirs[d][0]; nc += dirs[d][1];
      }
    }
  }

  function getValidMoves(board, r, c, state) {
    var piece = board[r][c];
    if (!piece) return [];
    var color = pieceColor(piece), type = pieceType(piece), moves = [];

    switch (type) {
      case 'p': {
        var dir = color === 'w' ? -1 : 1, startRow = color === 'w' ? 6 : 1;
        var nr = r + dir;
        if (inBounds(nr, c) && isEmpty(board, nr, c)) {
          moves.push(toSquare(nr, c));
          if (r === startRow) { var nr2 = r + dir * 2; if (isEmpty(board, nr2, c)) moves.push(toSquare(nr2, c)); }
        }
        [c - 1, c + 1].forEach(function (nc) {
          if (inBounds(nr, nc)) {
            if (isEnemy(board, nr, nc, color)) moves.push(toSquare(nr, nc));
            if (state.enPassant && state.enPassant.r === nr && state.enPassant.c === nc) moves.push(toSquare(nr, nc));
          }
        });
        break;
      }
      case 'r': slideMoves(moves, board, r, c, color, [[-1,0],[1,0],[0,-1],[0,1]]); break;
      case 'b': slideMoves(moves, board, r, c, color, [[-1,-1],[-1,1],[1,-1],[1,1]]); break;
      case 'q': slideMoves(moves, board, r, c, color, [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]); break;
      case 'n':
        [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(function (m) { addIfValid(moves, board, r + m[0], c + m[1], color); });
        break;
      case 'k':
        [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(function (m) { addIfValid(moves, board, r + m[0], c + m[1], color); });
        if (state.castling) {
          var rights = state.castling[color], row = color === 'w' ? 7 : 0;
          if (rights && r === row && c === 4) {
            if (rights.k && isEmpty(board, row, 5) && isEmpty(board, row, 6) && board[row][7] === color + 'r')
              moves.push(toSquare(row, 6));
            if (rights.q && isEmpty(board, row, 3) && isEmpty(board, row, 2) && isEmpty(board, row, 1) && board[row][0] === color + 'r')
              moves.push(toSquare(row, 2));
          }
        }
        break;
    }
    return moves;
  }

  // Build Chessground dests map from board state
  function buildDests(board, color, state) {
    var dests = new Map();
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var piece = board[r][c];
        if (piece && pieceColor(piece) === color) {
          var moves = getValidMoves(board, r, c, state);
          if (moves.length > 0) {
            dests.set(toSquare(r, c), moves);
          }
        }
      }
    }
    return dests;
  }

  // ═══════════════════════════════════════
  // HANDLER
  // ═══════════════════════════════════════

  function createHandler() {
    var _container = null, _ctx = null, _state = null;
    var _myColor = null, _flipped = false;
    var _cg = null; // Chessground instance
    var _Chessground = null; // Chessground constructor

    function getMyColor() {
      return (_state && _state.colors && _ctx) ? (_state.colors[_ctx.playerId] || null) : null;
    }
    function currentTurnColor() { return _state ? (_state.turn % 2 === 0 ? 'w' : 'b') : 'w'; }
    function cgColor(c) { return c === 'w' ? 'white' : 'black'; }

    function getPlayerName(color) {
      if (!_state || !_state.players) return color === 'w' ? 'White' : 'Black';
      var pid = color === 'w' ? _state.players[0] : _state.players[1];
      if (_ctx.players && _ctx.players[pid]) return _ctx.players[pid];
      return color === 'w' ? 'White' : 'Black';
    }

    function getPlayerAvatar(color) {
      if (!_state || !_state.players) return '😎';
      var pid = color === 'w' ? _state.players[0] : _state.players[1];
      if (typeof SpaceGames !== 'undefined' && SpaceGames.currentRoom) {
        var players = SpaceGames.currentRoom.players;
        if (players) {
          for (var i = 0; i < players.length; i++) {
            if (players[i].id === pid) return players[i].avatar || '😎';
          }
        }
      }
      return '😎';
    }

    function isMyTurn() {
      return _myColor && currentTurnColor() === _myColor;
    }

    // ─── Player bar ───
    function renderPlayerBar(color, position) {
      var bar = document.createElement('div');
      bar.className = 'chess-player-bar ' + position;
      var active = currentTurnColor() === color;

      var info = document.createElement('div');
      info.className = 'chess-player-info' + (active ? ' active' : '');

      var dot = document.createElement('span');
      dot.className = 'chess-turn-dot ' + (active ? 'active' : 'inactive');
      info.appendChild(dot);

      var avatar = document.createElement('span');
      avatar.textContent = getPlayerAvatar(color);
      avatar.style.fontSize = '1.2rem';
      info.appendChild(avatar);

      var name = document.createElement('span');
      name.className = 'chess-player-name';
      name.textContent = getPlayerName(color);
      info.appendChild(name);

      var captured = document.createElement('div');
      captured.className = 'chess-captured-pieces';
      if (_state.captured && _state.captured[color]) {
        _state.captured[color].forEach(function (p) {
          var span = document.createElement('span');
          span.textContent = PIECE_CHAR[p] || '';
          captured.appendChild(span);
        });
      }

      bar.appendChild(info);
      bar.appendChild(captured);
      return bar;
    }

    // ─── Move history ───
    function renderMoveHistory() {
      var div = document.createElement('div');
      div.className = 'chess-move-list';
      if (!_state.moveHistory || _state.moveHistory.length === 0) {
        div.innerHTML = '<span style="opacity:0.4;font-style:italic">No moves yet</span>';
        return div;
      }
      var html = '';
      for (var i = 0; i < _state.moveHistory.length; i += 2) {
        html += '<span class="chess-move-num">' + (Math.floor(i / 2) + 1) + '.</span>';
        html += '<span class="chess-move-white">' + _state.moveHistory[i] + '</span>';
        if (i + 1 < _state.moveHistory.length)
          html += '<span class="chess-move-black">' + _state.moveHistory[i + 1] + '</span>';
      }
      div.innerHTML = html;
      setTimeout(function () { div.scrollTop = div.scrollHeight; }, 0);
      return div;
    }

    // ─── Update Chessground ───
    function updateBoard() {
      if (!_cg || !_state) return;

      var turnColor = cgColor(currentTurnColor());
      var myTurn = isMyTurn();

      _cg.set({
        fen: boardToFen(_state.board),
        turnColor: turnColor,
        check: _state.inCheck ? true : false,
        movable: {
          free: false,
          color: myTurn ? cgColor(_myColor) : undefined,
          dests: myTurn ? buildDests(_state.board, _myColor, _state) : new Map(),
          showDests: true
        },
        lastMove: _state._lastMoveSquares || undefined
      });
    }

    // ─── Render wrapper (player bars + move history) ───
    function renderChrome() {
      if (!_container || !_state) return;

      // Remove old chrome but keep board
      _container.querySelectorAll('.chess-player-bar, .chess-move-list').forEach(function (el) { el.remove(); });

      var wrapper = _container.querySelector('.chess-game');
      if (!wrapper) return;

      var boardWrap = wrapper.querySelector('.chess-board-wrap');

      // Top player bar (opponent)
      var topColor = _flipped ? 'w' : 'b';
      var bottomColor = _flipped ? 'b' : 'w';

      var topBar = renderPlayerBar(topColor, 'top');
      wrapper.insertBefore(topBar, boardWrap);

      var bottomBar = renderPlayerBar(bottomColor, 'bottom');
      boardWrap.after(bottomBar);

      // Move history
      var oldHistory = wrapper.querySelector('.chess-move-list');
      if (oldHistory) oldHistory.remove();
      wrapper.appendChild(renderMoveHistory());
    }

    // ─── Handle player move via Chessground ───
    function onMove(orig, dest) {
      var from = fromSquare(orig);
      var to = fromSquare(dest);

      var moveData = { fromR: from.r, fromC: from.c, toR: to.r, toC: to.c };

      // Check pawn promotion
      var piece = _state.board[from.r][from.c];
      if (piece && pieceType(piece) === 'p') {
        var promoRow = pieceColor(piece) === 'w' ? 0 : 7;
        if (to.r === promoRow) moveData.promotion = 'q';
      }

      _ctx.socket.emit('game-move', { move: moveData });
    }

    // ─── Init Chessground ───
    function initBoard() {
      var wrapper = document.createElement('div');
      wrapper.className = 'chess-game';

      var boardWrap = document.createElement('div');
      boardWrap.className = 'chess-board-wrap';
      wrapper.appendChild(boardWrap);

      _container.innerHTML = '';
      _container.appendChild(wrapper);

      var turnColor = cgColor(currentTurnColor());
      var myTurn = isMyTurn();

      _cg = _Chessground(boardWrap, {
        fen: boardToFen(_state.board),
        orientation: _flipped ? 'black' : 'white',
        turnColor: turnColor,
        coordinates: true,
        autoCastle: true,
        animation: { enabled: true, duration: 200 },
        draggable: { enabled: true, showGhost: true },
        movable: {
          free: false,
          color: myTurn ? cgColor(_myColor) : undefined,
          dests: myTurn ? buildDests(_state.board, _myColor, _state) : new Map(),
          showDests: true,
          events: { after: onMove }
        },
        highlight: { lastMove: true, check: true },
        premovable: { enabled: false },
        check: _state.inCheck ? true : false
      });

      renderChrome();
    }

    // ═══════════════════════════════════════
    // PUBLIC INTERFACE
    // ═══════════════════════════════════════

    return {
      _active: false,

      init: function (container, ctx) {
        _container = container;
        _ctx = ctx;
        _state = ctx.gameState;
        this._active = true;
        _myColor = getMyColor();
        _flipped = _myColor === 'b';

        // Show loading
        _container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Loading chess board...</div>';

        // Dynamic import of Chessground
        var self = this;
        import('https://cdn.jsdelivr.net/npm/chessground@9.2.1/+esm').then(function (mod) {
          if (!self._active) return;
          _Chessground = mod.Chessground;
          initBoard();
        }).catch(function (err) {
          console.error('Failed to load Chessground:', err);
          _container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--danger)">Failed to load chess board. Please refresh.</div>';
        });
      },

      onUpdate: function (data) {
        if (!this._active) return;
        var lastMove = data.lastMove;
        if (data.state) {
          _state = data.state;
          _myColor = getMyColor();
          // Store last move as algebraic squares for Chessground highlight
          if (lastMove) {
            _state._lastMoveSquares = [
              toSquare(lastMove.fromR, lastMove.fromC),
              toSquare(lastMove.toR, lastMove.toC)
            ];
          }
        }
        if (_cg) {
          updateBoard();
          renderChrome();
        }
      },

      destroy: function () {
        if (_cg) { _cg.destroy(); _cg = null; }
        this._active = false;
        _container = null; _ctx = null; _state = null; _myColor = null;
        _Chessground = null;
      }
    };
  }

  if (typeof SpaceGames !== 'undefined' && SpaceGames.registerGame) {
    SpaceGames.registerGame('chess', createHandler());
  }
})();
