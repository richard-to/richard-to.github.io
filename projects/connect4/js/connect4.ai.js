(function(window) {

    // Namespace for Connect 4 AI
    var Connect4AI = {};

    var MoveCost = {
        MAX: 1000,
        MIN: -1000,
        MIN_WIN: -100,
        MAX_WIN: 100,
        TIE: 0,
        EVAL_HEURISTIC: 20
    };

    // Implementation of Minimax pruning for Connect 4
    var Connect4AlphaBeta = function() {
        this.service = new Connect4.GameOperations();
        this.minPlayer = Connect4.BoardState.P1;
        this.maxPlayer = Connect4.BoardState.P2;
    };

    Connect4AlphaBeta.prototype.setPlayers = function(maxPlayer, minPlayer) {
        this.minPlayer = minPlayer;
        this.maxPlayer = maxPlayer;
    }

    Connect4AlphaBeta.prototype.makeMove = function(board, gamePiece) {        
        this.service.calcDestination(board, gamePiece);
        if (this.service.isValidMove(board, gamePiece)) {
            return this.service.updateBoard(board, gamePiece);
        } else {
            return null;
        }
    };

    Connect4AlphaBeta.prototype.findMove = function(board, maxDepth) {
        var bestMoveValue = MoveCost.MIN;
        var move = 0;

        var depth = 0;
        var alpha = MoveCost.MIN;
        var beta = MoveCost.MAX;

        for (var i = 0; i < board.cols; ++i) {
            var newGamePiece = new Connect4.GamePieceViewModel(this.maxPlayer, null, i);
            var newBoard = this.makeMove(board, newGamePiece);
            if (newBoard) {
                var predictedMoveValue = this.minValue(
                        newBoard, newGamePiece, alpha, beta, depth, maxDepth);
                if (predictedMoveValue > bestMoveValue) {
                    bestMoveValue = predictedMoveValue;
                    move = i;
                }
            }
        }
        return move;
    };

    // TODO(richard-to): Implement a real eval heuristic
    Connect4AlphaBeta.prototype.eval = function(board) {
        return MoveCost.EVAL_HEURISTIC;
    };

    Connect4AlphaBeta.prototype.minValue = function(
                board, gamePiece, alpha, beta, depth, maxDepth) {       
        if (this.service.checkWinner(board, gamePiece)) {
            return MoveCost.MAX_WIN;
        } else if (this.service.checkTie(board)) {
            return MoveCost.TIE;
        } else if (depth === maxDepth) {
            return this.eval(board);
        } else {
            var bestMoveValue = MoveCost.MAX;
            for (var i = 0; i < board.cols; ++i) {
                var newGamePiece = new Connect4.GamePieceViewModel(this.minPlayer, null, i);                
                var newBoard = this.makeMove(board, newGamePiece);
                if (newBoard) {
                    var predictedMoveValue = this.maxValue(
                            newBoard, newGamePiece, alpha, beta, depth + 1, maxDepth);
                    if (predictedMoveValue < bestMoveValue) {
                        bestMoveValue = predictedMoveValue;
                    }

                    if (bestMoveValue <= alpha) {
                        return bestMoveValue;
                    }

                    if (bestMoveValue < beta) {
                        beta = bestMoveValue;
                    }
                }
            }
            return bestMoveValue;
        }
    };

    Connect4AlphaBeta.prototype.maxValue = function(
                board, gamePiece, alpha, beta, depth, maxDepth) {
        if (this.service.checkWinner(board, gamePiece)) {
            return MoveCost.MIN_WIN;
        } else if (this.service.checkTie(board)) {
            return MoveCost.TIE;
        } else if (depth === maxDepth) {
            return this.eval(board);            
        } else {
            var bestMoveValue = MoveCost.MIN;
            for (var i = 0; i < board.cols; ++i) {
                var newGamePiece = new Connect4.GamePieceViewModel(this.maxPlayer, null, i);
                var newBoard = this.makeMove(board, newGamePiece);
                if (newBoard) {
                    var predictedMoveValue = this.minValue(
                        newBoard, newGamePiece, alpha, beta, depth + 1, maxDepth);
                    if (predictedMoveValue > bestMoveValue) {
                        bestMoveValue = predictedMoveValue;
                    }

                    if (bestMoveValue >= beta) {
                        return bestMoveValue;
                    }

                    if (bestMoveValue > alpha) {
                        alpha = bestMoveValue;
                    }                 
                }
            }
            return bestMoveValue;
        }
    };    
    Connect4AI.Connect4AlphaBeta = Connect4AlphaBeta;

    window.Connect4AI = Connect4AI;
})(window);