---
layout: post
title: "AI for Owari - Part 2: Minimax with Tic-Tac-Toe"
---

Before I started work on my Owari AI, I implemented the Minimax algorithm on Tic-Tac-Toe, which is a much a simpler problem. This simplicity proved to be a problem when I developed my strategy for Owari because it made me think that I could calculate all the game states in a few hours. If I remember correctly, Tic-Tac-Toe has about 180,000 states in its game tree and allowed my JavaScript implementation of Minimax to find the first move in less than a second. Total unique permutations is about 2,400 and allowed me to replace the algorithm with a hash table in my original implementation in Python.

Minimax is a surprisingly simple algorithm. It basically simulates all possible games to find the optimal move. The algorithm assumes the opponent plays optimally and will pick a move that forces them into the worst move possible. Against non-optimal players, the algorithm performs even better. The drawback is that simulating all permutations is impossible for more complicated games, such as Chess and even Owari. Alpha-Beta pruning improves on Minimax by pruning subtrees that are known to be bad moves based on previous results. Although this improves the speed of simulating games, it's still not fast enough. This forces us to rely on heuristics to evaluate moves at specific depth thresholds. Iterative deepening, move ordering, transposition tables, and windowing are other optimizations that can improve your AI. I plan to go into some detail about some of these optimizations in later posts.

Here is a screen shot of my Tic-Tac-Toe demo that implements Minimax:

![Tic-Tac-Toe game screen shot](/images/tic-tac-toe.png)

Originally I implemented this as a console application using Python. Unfortunately I can't demo Python programs from the web, so I wrote a JavaScript version. Took a me a bit longer than I expected. I used vanilla JavaScript and it just reminded me how great React is. Dealing with the DOM is a pain. I also ran into a dumb bug where I ran Minimax to find the optimal move for the human player instead of the computer. That's actually the second or third time I made that mistake.

You can [view the Tic-Tac-Toe demo here](/projects/tic-tac-toe/). See if you can win!

Here is my annotated implementation of minimax for Tic-Tac-Toe. I should probably refactor this algorithm to make it less specific to one game. Good practice though having to write the minimax algorithm so many times. I'm also wondering if should just post these as gists in the future.

```js
var TicTacToeMiniMax = function() {
    this.minPlayer = 1;
    this.maxPlayer = 2;
};

// My Tic-Tac-Toe game engine uses 1 for X and 2 for O. Usually the CPU is player 2, so we
// need to make sure they are max. Otherwise they will make moves to help you win!
TicTacToeMiniMax.prototype.setMinMaxPlayers = function(maxPlayer, minPlayer) {
    this.minPlayer = minPlayer;
    this.maxPlayer = maxPlayer;
}

// Since we are using primitive ints, a simple shallow clone works fine.
// We need to clone the board because each move down the tree needs a unique
// board.
TicTacToeMiniMax.prototype.cloneBoard = function(board) {
    return board.slice(0);
};

// This is essentially the same function to check the winner in the
// main game engine. I repeated it here because I didn't think the
// the game engine itself should be dependent on the AI.
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

// Same reason as for the previous method. It may make sense to
// combine both methods actually.
TicTacToeMiniMax.prototype.checkTie = function(board) {
    for (var i = 0; i < board.length; i++) {
        if (board[i] == 0) {
            return false;
        }
    }
    return true;
};

// This method is another game specific method that tests if a move
// is valid or not. For example, the CPU should only be able to
// pick squares that have not been marked.
TicTacToeMiniMax.prototype.makeMove = function(move, player, board) {

    var newBoard = this.cloneBoard(board);
    if (newBoard[move] == 0) {
        newBoard[move] = player;
        return newBoard;
    } else {
        return null;
    }
};

// This is the main method that will find the optimal move
// for the CPU.
//
// The algorithm runs recursively, switching between min and max
// players until we reach a stop condition. In this case, the condition
// is when a someone has won the game or no moves are left.
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

// This method simulates an optimal opponent, whose goal
// is to minimize the CPU's move score at x each depth
// The best move is then returned to the previous level
// until we reach the top.
TicTacToeMiniMax.prototype.minValue = function(board) {

    // The first three conditions check are the stop
    // conditions for the loop.
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

// This is the same as the minValue method except this for the CPU
// player who is trying to maximize their move score. So they will
// pick the move that gets them best score x depth.
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
```
