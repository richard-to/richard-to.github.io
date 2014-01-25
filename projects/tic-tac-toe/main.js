// Basic Tic-Tac-Toe gui to demonstrate Alpha Beta Pruning
// Decided to implement using vanilla javascript. Probably
// should have used React, but I guess it's good practice.
(function(window, undefined) {

    // CONSTANTS
    var PLAYER1 = 0;
    var PLAYER2 = 1;

    // Tic-Tac-Toe Controller/Game object
    var TicTacToe = function() {

        this.ai = null;
        this.ui = null;

        // Simple Tic-Tac-Toe model
        this.state = {
            aiPlayers: [false, false],
            players: [1, 2],
            turn: 0,
            tiles: [0, 0, 0, 0, 0, 0, 0, 0, 0]
        };
    };

    TicTacToe.prototype.handleUIUpdate = function(result) {
        this.nextTurn();
        if (result && result.winner == false && result.tie == false &&
            this.state.aiPlayers[this.state.turn]) {
            this.handleAiMove();
        }
    };

    TicTacToe.prototype.handleAiMove = function() {
        if (this.state.aiPlayers[this.state.turn]) {

            // TODO(richard-to): Handle second player turn
            this.ai.setMinMaxPlayers(
                this.state.players[this.state.turn],
                this.state.players[(this.state.turn + 1) % this.state.players.length]);

            var move = this.ai.findMove(this.state.tiles);
            // TODO(richard-to): Duplicated in handlePlayerMove
            this.state.tiles[move] = this.state.players[this.state.turn];
            var result = {
                turn: this.state.turn,
                index: move,
                winner: this.checkWinner(this.state.players[this.state.turn]),
                tie: this.checkTie()
            };
            this.ui.update(result);
        }
    };

    TicTacToe.prototype.setUI = function(ui) {
        this.ui = ui;
        ui.onUpdate = this.handleUIUpdate.bind(this);
    };

    TicTacToe.prototype.setAiPlayer = function(player) {
        if (this.ai && player < this.state.aiPlayers.length) {
            this.state.aiPlayers[player] = true;
        }
    };

    TicTacToe.prototype.setAi = function(ai) {
        this.ai = ai;
    };

    // Randomly choose who will start first
    TicTacToe.prototype.randomizeTurn = function() {
        this.state.turn = Math.floor(Math.random() * this.state.players.length);
    };

    TicTacToe.prototype.checkWinner = function(player) {
        var tiles = this.state.tiles;
        if (
                (tiles[0] == player && tiles[1] == player && tiles[2] == player) ||
                (tiles[3] == player && tiles[4] == player && tiles[5] == player) ||
                (tiles[6] == player && tiles[7] == player && tiles[8] == player) ||
                (tiles[0] == player && tiles[3] == player && tiles[6] == player) ||
                (tiles[1] == player && tiles[4] == player && tiles[7] == player) ||
                (tiles[2] == player && tiles[5] == player && tiles[8] == player) ||
                (tiles[0] == player && tiles[4] == player && tiles[8] == player) ||
                (tiles[2] == player && tiles[4] == player && tiles[6] == player)
            ) {
            return true;
        } else {
           return false;
        }
    };

    TicTacToe.prototype.checkTie = function() {
        var tiles = this.state.tiles;
        for (var i = 0; i < tiles.length; i++) {
            if (tiles[i] == 0) {
                return false;
            }
        }
        return true;
    };

    TicTacToe.prototype.nextTurn = function() {
        this.state.turn = (this.state.turn + 1) % this.state.players.length;
    };

    // Click Event Handler. Returns a result object that
    // acts like view model that tells describes how to update
    // UI.
    TicTacToe.prototype.handlePlayerMove = function(index) {
        var tiles = this.state.tiles;
        if (tiles[index] == 0 && this.state.aiPlayers[this.state.turn] == false) {
            tiles[index] = this.state.players[this.state.turn];
            var result = {
                turn: this.state.turn,
                index: index,
                winner: this.checkWinner(this.state.players[this.state.turn]),
                tie: this.checkTie()
            };
            return result;
        } else {
            return null;
        }
    };

    // Tic-Tac-Toe UI view object to update HTML
    var TicTacToeUI = function() {
        // TODO(richard-to): Maybe don't hardcode these.
        this.symbols = ['X', 'O'];
        this.statusEl = document.getElementById('status');
        this.boardEl = document.getElementById('board');
        this.tileEls =  this.boardEl.getElementsByTagName('div');
        this.player1Label = document.getElementById('player1-label');
        this.player2Label = document.getElementById('player2-label');

        this.labels = [this.player1Label, this.player2Label];
    };

    TicTacToeUI.prototype.displayWinner = function(player) {
        this.statusEl.textContent = "Player " + (player + 1) + " Wins!";
        this.statusEl.className = '';
    };

    TicTacToeUI.prototype.displayTie = function() {
        this.statusEl.textContent = "Tie Game!";
        this.statusEl.className = '';
    };

    TicTacToeUI.prototype.highlightPlayerLabel = function(player) {
        this.labels[player].className = 'selected';
    };

    TicTacToeUI.prototype.unhighlightPlayerLabel = function(player) {
        this.labels[player].className = '';
    };

    // Remove events handlers from tile
    TicTacToeUI.prototype.removeTileListeners = function() {
         for (var i = 0; i < this.tileEls.length; i++) {
            var tile = this.tileEls[i].cloneNode(true);
            this.tileEls[i].parentNode.replaceChild(tile, this.tileEls[i]);
         }
    };

    // Update the UI based on result view model
    TicTacToeUI.prototype.update = function(result) {
        this.tileEls[result.index].textContent = this.symbols[result.turn];
        if (result.winner) {
            this.displayWinner(result.turn);
            this.removeTileListeners(this.tileEls);
            this.unhighlightPlayerLabel(PLAYER1);
            this.unhighlightPlayerLabel(PLAYER2);
        } else if (result.tie) {
            this.displayTie();
            this.removeTileListeners(this.tileEls);
            this.unhighlightPlayerLabel(PLAYER1);
            this.unhighlightPlayerLabel(PLAYER2);
        } else {
            var turn = result.turn;
            this.unhighlightPlayerLabel(turn);
            turn = (turn + 1) % this.symbols.length;
            this.highlightPlayerLabel(turn);
        }

        this.onUpdate(result);
    };

    TicTacToeUI.prototype.onUpdate = function() {};

    // Initialize the tile listeners
    TicTacToeUI.prototype.initTileListeners = function(handler) {
        var self = this;
        for (var i = 0; i < this.tileEls.length; i++) {
            // TODO(richard-to): There's probably a simpler less convoluted way
            //                   to do this right?
            this.tileEls[i].addEventListener('click', (function() {
                var index = i;
                return function(event) {
                    var result = handler(index);
                    if (result) {
                        self.update(result);
                    }
                }
            })());
        }
    };

    // Implementation of Minimax pruning for Tic-Tac-Toe
    var TicTacToeMiniMax = function() {
        this.minPlayer = 1;
        this.maxPlayer = 2;
    };

    TicTacToeMiniMax.prototype.setMinMaxPlayers = function(maxPlayer, minPlayer) {
        this.minPlayer = minPlayer;
        this.maxPlayer = maxPlayer;
    }

    TicTacToeMiniMax.prototype.cloneBoard = function(board) {
        return board.slice(0);
    };

    // Use separate implementation of check winner here for more portability.
    // Most likely will use web workers here
    TicTacToeMiniMax.prototype.checkWinner = function(player, board) {
        if (
            (board[0] == player && board[1] == player && board[2] == player) ||
            (board[3] == player && board[4] == player && board[5] == player) ||
            (board[6] == player && board[7] == player && board[8] == player) ||
            (board[0] == player && board[3] == player && board[6] == player) ||
            (board[1] == player && board[4] == player && board[7] == player) ||
            (board[2] == player && board[5] == player && board[8] == player) ||
            (board[0] == player && board[4] == player && board[8] == player) ||
            (board[2] == player && board[4] == player && board[6] == player)
            ) {
            return true;
        } else {
            return false;
        }
    };

    // Use separate implementation of check tie here for more portability.
    // Most likely will use web workers here
    TicTacToeMiniMax.prototype.checkTie = function(board) {
        for (var i = 0; i < board.length; i++) {
            if (board[i] == 0) {
                return false;
            }
        }
        return true;
    };

    TicTacToeMiniMax.prototype.makeMove = function(move, player, board) {

        var newBoard = this.cloneBoard(board);
        if (newBoard[move] == 0) {
            newBoard[move] = player;
            return newBoard;
        } else {
            return null;
        }
    };

    TicTacToeMiniMax.prototype.findMove = function(board) {
        var bestMoveValue = -100;
        var move = 0;
        for (var i = 0; i < board.length; i++) {
            var newBoard = this.makeMove(i, this.maxPlayer, board);
            if (newBoard) {
                var predictedMoveValue = this.minValue(newBoard);
                if (predictedMoveValue > bestMoveValue) {
                    bestMoveValue = predictedMoveValue;
                    move = i;
                }
            }
        }
        return move;
    };

    TicTacToeMiniMax.prototype.minValue = function(board) {
        if (this.checkWinner(this.maxPlayer, board)) {
            return 1;
        } else if (this.checkWinner(this.minPlayer, board)) {
            return -1;
        } else if (this.checkTie(board)) {
            return 0;
        } else {
            var bestMoveValue = 100;
            var move = 0;
            for (var i = 0; i < board.length; i++) {
                var newBoard = this.makeMove(i, this.minPlayer, board);
                if (newBoard) {
                    var predictedMoveValue = this.maxValue(newBoard);
                    if (predictedMoveValue < bestMoveValue) {
                        bestMoveValue = predictedMoveValue;
                        move = i;
                    }
                }
            }
            return bestMoveValue;
        }
    };

    TicTacToeMiniMax.prototype.maxValue = function(board) {
        if (this.checkWinner(this.maxPlayer, board)) {
            return 1;
        } else if (this.checkWinner(this.minPlayer, board)) {
            return -1;
        } else if (this.checkTie(board)) {
            return 0;
        } else {
            var bestMoveValue = -100;
            var move = 0;
            for (var i = 0; i < board.length; i++) {
                var newBoard = this.makeMove(i, this.maxPlayer, board);
                if (newBoard) {
                    var predictedMoveValue = this.minValue(newBoard);
                    if (predictedMoveValue > bestMoveValue) {
                        bestMoveValue = predictedMoveValue;
                        move = i;
                    }
                }
            }
            return bestMoveValue;
        }
    };

    // Main Game Logic
    var game = new TicTacToe();
    game.setAi(new TicTacToeMiniMax());
    game.setAiPlayer(PLAYER2)
    game.randomizeTurn();

    var ui = new TicTacToeUI();
    ui.highlightPlayerLabel(game.state.turn);
    ui.initTileListeners(game.handlePlayerMove.bind(game));

    game.setUI(ui);
    game.handleAiMove();

})(window);
