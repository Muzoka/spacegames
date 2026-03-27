(function () {
  'use strict';

  // Unicode piece map
  var PIECE_UNICODE = {
    wk: '\u2654', wq: '\u2655', wr: '\u2656', wb: '\u2657', wn: '\u2658', wp: '\u2659',
    bk: '\u265A', bq: '\u265B', br: '\u265C', bb: '\u265D', bn: '\u265E', bp: '\u265F'
  };

  // Column labels
  var COL_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  // ---- Move validation helpers ----

  function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function pieceColor(piece) {
    return piece ? piece[0] : null;
  }

  function pieceType(piece) {
    return piece ? piece[1] : null;
  }

  function isEnemy(board, r, c, color) {
    var p = board[r][c];
    return p !== null && pieceColor(p) !== color;
  }

  function isEmpty(board, r, c) {
    return board[r][c] === null;
  }

  function addIfValid(moves, board, r, c, color) {
    if (!inBounds(r, c)) return false;
    if (isEmpty(board, r, c)) {
      moves.push({ r: r, c: c, capture: false });
      return true;
    }
    if (isEnemy(board, r, c, color)) {
      moves.push({ r: r, c: c, capture: true });
    }
    return false; // blocked
  }

  function slideMoves(moves, board, r, c, color, dirs) {
    for (var d = 0; d < dirs.length; d++) {
      var dr = dirs[d][0], dc = dirs[d][1];
      var nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) {
        if (isEmpty(board, nr, nc)) {
          moves.push({ r: nr, c: nc, capture: false });
        } else {
          if (isEnemy(board, nr, nc, color)) {
            moves.push({ r: nr, c: nc, capture: true });
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  }

  function getValidMoves(board, r, c, state) {
    var piece = board[r][c];
    if (!piece) return [];
    var color = pieceColor(piece);
    var type = pieceType(piece);
    var moves = [];
    var nr, nc, d;

    switch (type) {
      case 'p': {
        var dir = color === 'w' ? -1 : 1;
        var startRow = color === 'w' ? 6 : 1;
        // Forward one
        nr = r + dir;
        if (inBounds(nr, c) && isEmpty(board, nr, c)) {
          moves.push({ r: nr, c: c, capture: false });
          // Forward two from start
          if (r === startRow) {
            var nr2 = r + dir * 2;
            if (isEmpty(board, nr2, c)) {
              moves.push({ r: nr2, c: c, capture: false });
            }
          }
        }
        // Diagonal captures
        var capCols = [c - 1, c + 1];
        for (d = 0; d < capCols.length; d++) {
          nc = capCols[d];
          if (inBounds(nr, nc)) {
            if (isEnemy(board, nr, nc, color)) {
              moves.push({ r: nr, c: nc, capture: true });
            }
            // En passant
            if (state.enPassant && state.enPassant.r === nr && state.enPassant.c === nc) {
              moves.push({ r: nr, c: nc, capture: true });
            }
          }
        }
        break;
      }
      case 'r':
        slideMoves(moves, board, r, c, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
        break;
      case 'b':
        slideMoves(moves, board, r, c, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
        break;
      case 'q':
        slideMoves(moves, board, r, c, color, [
          [-1, 0], [1, 0], [0, -1], [0, 1],
          [-1, -1], [-1, 1], [1, -1], [1, 1]
        ]);
        break;
      case 'n': {
        var knightMoves = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (d = 0; d < knightMoves.length; d++) {
          addIfValid(moves, board, r + knightMoves[d][0], c + knightMoves[d][1], color);
        }
        break;
      }
      case 'k': {
        var kingDirs = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1],  [1, 0],  [1, 1]
        ];
        for (d = 0; d < kingDirs.length; d++) {
          addIfValid(moves, board, r + kingDirs[d][0], c + kingDirs[d][1], color);
        }
        // Castling
        if (state.castling) {
          var rights = state.castling[color];
          if (rights) {
            var row = color === 'w' ? 7 : 0;
            if (r === row && c === 4) {
              // Kingside
              if (rights.k && isEmpty(board, row, 5) && isEmpty(board, row, 6) &&
                  board[row][7] && board[row][7] === color + 'r') {
                moves.push({ r: row, c: 6, capture: false, castle: 'k' });
              }
              // Queenside
              if (rights.q && isEmpty(board, row, 3) && isEmpty(board, row, 2) && isEmpty(board, row, 1) &&
                  board[row][0] && board[row][0] === color + 'r') {
                moves.push({ r: row, c: 2, capture: false, castle: 'q' });
              }
            }
          }
        }
        break;
      }
    }
    return moves;
  }

  // ---- Notation helper ----

  function moveToNotation(board, fromR, fromC, toR, toC) {
    var piece = board[fromR][fromC];
    if (!piece) return '?';
    var type = pieceType(piece);
    var isCapture = board[toR][toC] !== null;
    var dest = COL_LABELS[toC] + (8 - toR);
    var prefix = '';
    if (type === 'p') {
      if (isCapture || fromC !== toC) {
        prefix = COL_LABELS[fromC] + 'x';
      }
      return prefix + dest;
    }
    if (type === 'k' && Math.abs(toC - fromC) === 2) {
      return toC > fromC ? 'O-O' : 'O-O-O';
    }
    var typeChar = type.toUpperCase();
    if (typeChar === 'N') typeChar = 'N';
    else if (typeChar === 'K') typeChar = 'K';
    return typeChar + (isCapture ? 'x' : '') + dest;
  }

  // ---- Rendering ----

  function createHandler() {
    var _container = null;
    var _ctx = null;
    var _state = null;
    var _selectedCell = null;
    var _validMoves = [];
    var _lastMove = null;
    var _myColor = null;
    var _flipped = false;

    function getMyColor() {
      if (!_state || !_state.colors || !_ctx) return null;
      return _state.colors[_ctx.playerId] || null;
    }

    function isMyTurn() {
      if (!_state || !_myColor) return false;
      var turnColor = _state.turn % 2 === 0 ? 'w' : 'b';
      return turnColor === _myColor;
    }

    function currentTurnColor() {
      if (!_state) return 'w';
      return _state.turn % 2 === 0 ? 'w' : 'b';
    }

    function getPlayerName(color) {
      if (!_state || !_state.players) return color === 'w' ? 'White' : 'Black';
      var pid = color === 'w' ? _state.players[0] : _state.players[1];
      if (!pid) return color === 'w' ? 'White' : 'Black';
      if (_ctx.players) {
        for (var i = 0; i < _ctx.players.length; i++) {
          if (_ctx.players[i].id === pid) return _ctx.players[i].name;
        }
      }
      if (_ctx.gamePlayers) {
        for (var j = 0; j < _ctx.gamePlayers.length; j++) {
          if (_ctx.gamePlayers[j].id === pid) return _ctx.gamePlayers[j].name;
        }
      }
      return pid;
    }

    function renderPlayerBar() {
      var bar = document.createElement('div');
      bar.className = 'game-players-bar';

      var whiteInfo = document.createElement('div');
      whiteInfo.className = 'game-player-info' + (currentTurnColor() === 'w' ? ' active' : '');
      whiteInfo.innerHTML = '<span class="chess-piece-icon">\u2654</span> ' + escapeHtml(getPlayerName('w'));

      var vs = document.createElement('span');
      vs.textContent = ' vs ';
      vs.style.margin = '0 12px';
      vs.style.opacity = '0.5';

      var blackInfo = document.createElement('div');
      blackInfo.className = 'game-player-info' + (currentTurnColor() === 'b' ? ' active' : '');
      blackInfo.innerHTML = '<span class="chess-piece-icon">\u265A</span> ' + escapeHtml(getPlayerName('b'));

      bar.appendChild(whiteInfo);
      bar.appendChild(vs);
      bar.appendChild(blackInfo);
      return bar;
    }

    function renderTurnIndicator() {
      var div = document.createElement('div');
      div.className = 'game-turn-indicator';
      var turnColor = currentTurnColor();
      if (isMyTurn()) {
        div.textContent = 'Your turn (' + (turnColor === 'w' ? 'White' : 'Black') + ')';
      } else if (_myColor) {
        div.textContent = (turnColor === 'w' ? 'White' : 'Black') + "'s turn";
      } else {
        div.textContent = (turnColor === 'w' ? 'White' : 'Black') + "'s turn (spectating)";
      }
      return div;
    }

    function renderCapturedPieces(color) {
      var div = document.createElement('div');
      div.className = 'chess-captured';
      div.style.minHeight = '28px';
      div.style.fontSize = '20px';
      div.style.padding = '2px 4px';
      div.style.display = 'flex';
      div.style.flexWrap = 'wrap';
      div.style.gap = '2px';
      if (_state.captured && _state.captured[color]) {
        var pieces = _state.captured[color];
        for (var i = 0; i < pieces.length; i++) {
          var span = document.createElement('span');
          span.textContent = PIECE_UNICODE[pieces[i]] || pieces[i];
          div.appendChild(span);
        }
      }
      return div;
    }

    function renderBoard() {
      var board = _state.board;
      var boardEl = document.createElement('div');
      boardEl.className = 'chess-board';

      for (var ri = 0; ri < 8; ri++) {
        for (var ci = 0; ci < 8; ci++) {
          var r = _flipped ? (7 - ri) : ri;
          var c = _flipped ? (7 - ci) : ci;

          var cell = document.createElement('div');
          var isLight = (r + c) % 2 === 0;
          cell.className = 'chess-cell ' + (isLight ? 'light' : 'dark');

          // Last move highlight
          if (_lastMove) {
            if ((r === _lastMove.fromR && c === _lastMove.fromC) ||
                (r === _lastMove.toR && c === _lastMove.toC)) {
              cell.classList.add('last-move');
            }
          }

          // Selected highlight
          if (_selectedCell && _selectedCell.r === r && _selectedCell.c === c) {
            cell.classList.add('selected');
          }

          // Valid move / capture indicators
          var isValidTarget = false;
          var isCaptureTarget = false;
          for (var m = 0; m < _validMoves.length; m++) {
            if (_validMoves[m].r === r && _validMoves[m].c === c) {
              isValidTarget = true;
              isCaptureTarget = _validMoves[m].capture;
              break;
            }
          }
          if (isValidTarget) {
            cell.classList.add(isCaptureTarget ? 'capture-move' : 'valid-move');
          }

          // Piece
          var piece = board[r][c];
          if (piece) {
            var pieceSpan = document.createElement('span');
            pieceSpan.className = 'chess-piece';
            pieceSpan.textContent = PIECE_UNICODE[piece] || piece;
            cell.appendChild(pieceSpan);
          }

          // Click handler
          cell.dataset.row = r;
          cell.dataset.col = c;
          cell.addEventListener('click', onCellClick);

          boardEl.appendChild(cell);
        }
      }
      return boardEl;
    }

    function renderMoveHistory() {
      var div = document.createElement('div');
      div.className = 'chess-move-history';
      div.style.maxHeight = '120px';
      div.style.overflowY = 'auto';
      div.style.fontSize = '13px';
      div.style.padding = '8px';
      div.style.marginTop = '8px';
      div.style.fontFamily = 'monospace';
      div.style.lineHeight = '1.6';

      if (!_state.moveHistory || _state.moveHistory.length === 0) {
        div.textContent = 'No moves yet.';
        return div;
      }

      var text = '';
      for (var i = 0; i < _state.moveHistory.length; i += 2) {
        var moveNum = Math.floor(i / 2) + 1;
        text += moveNum + '. ' + _state.moveHistory[i];
        if (i + 1 < _state.moveHistory.length) {
          text += ' ' + _state.moveHistory[i + 1];
        }
        text += '  ';
      }
      div.textContent = text;
      // Scroll to end
      setTimeout(function () { div.scrollTop = div.scrollHeight; }, 0);
      return div;
    }

    function render() {
      if (!_container || !_state) return;
      _container.innerHTML = '';

      var wrapper = document.createElement('div');
      wrapper.className = 'chess-game';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '8px';

      // Player bar
      wrapper.appendChild(renderPlayerBar());

      // Turn indicator
      wrapper.appendChild(renderTurnIndicator());

      // Top captured pieces (opponent's captured, or black if not flipped)
      var topColor = _flipped ? 'w' : 'b';
      wrapper.appendChild(renderCapturedPieces(topColor));

      // Board
      wrapper.appendChild(renderBoard());

      // Bottom captured pieces
      var bottomColor = _flipped ? 'b' : 'w';
      wrapper.appendChild(renderCapturedPieces(bottomColor));

      // Move history
      wrapper.appendChild(renderMoveHistory());

      _container.appendChild(wrapper);
    }

    function onCellClick(e) {
      var cell = e.currentTarget;
      var r = parseInt(cell.dataset.row, 10);
      var c = parseInt(cell.dataset.col, 10);

      if (!isMyTurn()) return;

      var board = _state.board;
      var piece = board[r][c];

      // If we have a selected piece, try to move
      if (_selectedCell) {
        // Check if clicking a valid destination
        var targetMove = null;
        for (var i = 0; i < _validMoves.length; i++) {
          if (_validMoves[i].r === r && _validMoves[i].c === c) {
            targetMove = _validMoves[i];
            break;
          }
        }

        if (targetMove) {
          var moveData = {
            fromR: _selectedCell.r,
            fromC: _selectedCell.c,
            toR: r,
            toC: c
          };

          // Pawn promotion
          var movingPiece = board[_selectedCell.r][_selectedCell.c];
          if (movingPiece && pieceType(movingPiece) === 'p') {
            var promoRow = pieceColor(movingPiece) === 'w' ? 0 : 7;
            if (r === promoRow) {
              moveData.promotion = 'q'; // Auto-promote to queen
            }
          }

          _ctx.socket.emit('game-move', { move: moveData });
          _selectedCell = null;
          _validMoves = [];
          render();
          return;
        }

        // Clicking own piece selects it instead
        if (piece && pieceColor(piece) === _myColor) {
          _selectedCell = { r: r, c: c };
          _validMoves = getValidMoves(board, r, c, _state);
          render();
          return;
        }

        // Click elsewhere deselects
        _selectedCell = null;
        _validMoves = [];
        render();
        return;
      }

      // No selection yet, select own piece
      if (piece && pieceColor(piece) === _myColor) {
        _selectedCell = { r: r, c: c };
        _validMoves = getValidMoves(board, r, c, _state);
        render();
      }
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    // ---- Public handler interface ----

    return {
      _active: false,

      init: function (container, ctx) {
        _container = container;
        _ctx = ctx;
        _state = ctx.gameState;
        _selectedCell = null;
        _validMoves = [];
        _lastMove = null;
        this._active = true;

        _myColor = getMyColor();
        _flipped = _myColor === 'b';

        render();
      },

      onUpdate: function (data) {
        if (!this._active) return;
        if (data.state) {
          _state = data.state;
          _myColor = getMyColor();
        }
        if (data.lastMove) {
          _lastMove = data.lastMove;
        }
        _selectedCell = null;
        _validMoves = [];
        render();
      },

      destroy: function () {
        this._active = false;
        _container = null;
        _ctx = null;
        _state = null;
        _selectedCell = null;
        _validMoves = [];
        _lastMove = null;
        _myColor = null;
      }
    };
  }

  // Register with SpaceGames
  if (typeof SpaceGames !== 'undefined' && SpaceGames.registerGame) {
    SpaceGames.registerGame('chess', createHandler());
  }
})();
