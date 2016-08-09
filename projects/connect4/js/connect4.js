(function(window) {

    // Namespace for Connect 4 game
    var Connect4 = {};


    var Util = {
        isUndefOrNull: function(value) {
            return value === undefined || value === null;
        }
    };
    Connect4.Util = Util;

    // Constants to represent states of board pieces
    var BoardState = {
        EMPTY: 0,
        P1: 1,
        P2: 2
    };
    Connect4.BoardState = BoardState;


    var PlayerAction = {
        NOOP: 0,
        MOVE: 1,
        SELECT: 2
    };
    Connect4.PlayerAction = PlayerAction;


    // Constants for game state
    var GameState = {
        TIE_GAME: 0,
        P1_WINNER: 1,
        P2_WINNER: 2,
        CPU_TURN: 3
    };
    Connect4.GameState = GameState;


    // Data model for Connect 4 game
    var Board = function(state, moveCount) {
        this.cols = 7;
        this.rows = 6;
        this.maxMoves = this.cols * this.rows;
        this.moveCount = moveCount || 0;
        this.state = state || this.init(this.rows, this.cols);
    };

    Board.prototype.init = function(rows, cols) {
        var state = new Array(rows);
        for (var y = 0; y < rows; ++y) {
            state[y] = new Array(cols);
            for (var x = 0; x < cols; ++x) {
                state[y][x] = BoardState.EMPTY;
            }
        }
        return state;
    };

    Board.prototype.clone = function() {
        var rows = this.state.length;
        var cols = this.state[0].length;
        var state = new Array(rows);
        for (var y = 0; y < rows; ++y) {
            state[y] = new Array(cols);
            for (var x = 0; x < cols; x++) {
                state[y][x] = this.state[y][x];
            }
        }
        return new Board(state, this.moveCount);
    };
    Connect4.Board = Board;


    // View Model for game piece. Handles coordinates for animation
    var GamePieceViewModel = function(playerTurn, y, x) {
        this.playerTurn = playerTurn;        
        this.y = -1;
        this.finalX = Util.isUndefOrNull(x) ? -1 : x;
        this.finalY = Util.isUndefOrNull(y) ? -1 : y;
        this.animate = false;
        this.gravityFrame = 0;
        this.gravity = 0;        
    };

    GamePieceViewModel.prototype.finalCoords = function() {
        return {
            y: this.finalY, 
            x: this.finalX
        };
    };

    GamePieceViewModel.prototype.coords = function() {
        return {
            y: this.y, 
            x: this.finalX
        };
    };

    GamePieceViewModel.prototype.changeColumn = function(x) {
        this.finalX = x;
    };

    GamePieceViewModel.prototype.setEndpoint = function(y) {
        this.finalY = y;
    };

    GamePieceViewModel.prototype.animateStep = function() {
        if (this.gravityFrame >= this.gravity) {
            this.y += 1;
            this.gravityFrame = 0;            
            return true;
        } else {
            ++this.gravityFrame;
            return false;
        }
    };

    GamePieceViewModel.prototype.startAnimation = function(speed) {
        this.gravity = speed;
        this.gravityFrame = 0;
        this.animate = true;
    };
    
    GamePieceViewModel.prototype.animating = function() {
        return this.animate;
    };

    GamePieceViewModel.prototype.animationFinished = function() {
        if (this.y === this.finalY) {
            this.animate = false;
            return true;
        } else {
            return false;
        }
    };
    Connect4.GamePieceViewModel = GamePieceViewModel;


    // Service methods to handle gameplay operations and state
    var GameOperations = function() {};

    GameOperations.prototype.whoGoesFirst = function() {
        return Math.floor(Math.random() * (2)) + 1;
    };
    
    GameOperations.prototype.togglePlayerTurn = function(playerTurn) {
        return (playerTurn === BoardState.P1) ? BoardState.P2 : BoardState.P1;
    };
    
    GameOperations.prototype.createGamePiece = function(board, playerTurn) {
        var gamePiece = new GamePieceViewModel(playerTurn, null, 0);
        this.calcDestination(board, gamePiece);
        return gamePiece;
    };

    GameOperations.prototype.calcDestination = function(board, gamePiece) {
        var rows = board.rows;
        var coords = gamePiece.coords();        
        for (var y = rows - 1; y >= 0; --y) {
            if ( board.state[y][coords.x] === BoardState.EMPTY) {
                gamePiece.setEndpoint(y);
                break;
            }
        }
    }

    GameOperations.prototype.updateBoard = function(board, gamePiece) {
        var newBoard = board.clone();
        var coords = gamePiece.finalCoords();
        newBoard.state[coords.y][coords.x] = gamePiece.playerTurn;
        ++newBoard.moveCount;
        return newBoard;
    };

    GameOperations.prototype.isValidMove = function(board, gamePiece) {
        var coords = gamePiece.finalCoords();
        return (coords.y >= 0 && coords.y < board.rows &&
                coords.x >= 0 && coords.x < board.cols &&
                board.state[coords.y][coords.x] === BoardState.EMPTY);        
    };
    
    GameOperations.prototype.checkTie = function(board) {
        return (board.moveCount === board.maxMoves);
    }

    GameOperations.prototype.checkWinner = function(board, gamePiece) {
        var movesNeeded = 4;

        var state = board.state;

        var coords = gamePiece.finalCoords();
        var playerTurn = gamePiece.playerTurn;

        var downCount = 0;
  
        var leftCount = 0;
        var rightCount = 0;
        
        var upLeftCount = 0;
        var downRightCount = 0;
        
        var upRightCount = 0;
        var downLeftCount = 0;

        var y = 0;
        var x = 0;

        // Check for a winner going down
        for (y = coords.y; y < board.rows; ++y) {
            if (state[y][coords.x] === playerTurn) {
                ++downCount;
            } else {
                break;
            }

            if (downCount === movesNeeded) {
                return true;
            }        
        }


        // Check for a winner going left
        for (x = coords.x; x >= 0; --x) {
            if (state[coords.y][x] === playerTurn) {
                ++leftCount;
            } else {
                break;
            }

            if (leftCount === movesNeeded) {
                return true;
            }
        }

        // Check for a winner going right
        for (x = coords.x; x < board.rows; ++x) {
            if (state[coords.y][x] === playerTurn) {
                ++rightCount;
            } else {
                break;
            }

            if (rightCount === movesNeeded) {
                return true;
            }        
        }
        
        // Check for a winner going left/right
        if (leftCount + rightCount === movesNeeded + 1) {
            return true;
        }


        // Check for a winner going up-left
        y = coords.y;
        x = coords.x;
        while (y >= 0 && x >= 0) {
            if (state[y][x] === playerTurn) {
                ++upLeftCount;
            } else {
                break;
            }

            if (upLeftCount === movesNeeded) {
                return true;
            }
            --y;
            --x;
        }        

        // Check for a winner going down-right
        y = coords.y;
        x = coords.x;
        while (y < board.rows && x < board.cols) {
            if (state[y][x] === playerTurn) {
                ++downRightCount;
            } else {
                break;
            }

            if (downRightCount === movesNeeded) {
                return true;
            }
            ++y;
            ++x;
        } 

        // Check for a winner going up-left/down-right
        if (upLeftCount + downRightCount === movesNeeded + 1) {
            return true;
        }

        // Check for a winner going down-left
        y = coords.y;
        x = coords.x;
        while (y < board.rows && x >= 0) {
            if (state[y][x] === playerTurn) {
                ++downLeftCount;
            } else {
                break;
            }

            if (downLeftCount === movesNeeded) {
                return true;
            }
            ++y;
            --x;
        }

        // Check for a winner going up-right
        y = coords.y;
        x = coords.x;        
        while (y >= 0 && x < board.cols) {
            if (state[y][x] === playerTurn) {
                ++upRightCount;
            } else {
                break;
            }

            if (upRightCount === movesNeeded) {
                return true;
            }
            --y;
            ++x;
        }
        
        // Check for a winner going down-left/up-right
        if (downLeftCount + upRightCount === movesNeeded + 1) {
            return true;
        }

        // No winners found
        return false;
    };
    Connect4.GameOperations = GameOperations;


    // Main game controller
    var Game = function(view, statusDiv) {
        this.settings = {
            animSpeed: 10,
            aiDepth: 5
        };

        this.statusDiv = statusDiv;
        this.service = new GameOperations();         
        this.board = new Board();
        this.view = view;        
        this.updateView();
    };

    Game.prototype.startGame = function(ai) {
        this.ai = ai;
        this.displayGameStatus();
        this.board = new Board();
        this.playerTurn = this.service.whoGoesFirst();
        this.gamePiece = this.service.createGamePiece(this.board, this.playerTurn);           
        this.updateView();
        
        if (this.aiTurn()) {
            this.aiAction();
        }

        this.view.startEventListeners(this.onAction.bind(this));             
    };


    Game.prototype.aiTurn = function() {
        return (this.ai && this.playerTurn === BoardState.P2);
    };

    Game.prototype.aiAction = function() {
        this.displayGameStatus(GameState.CPU_TURN);
        var move = this.ai.findMove(this.board, this.settings.aiDepth);
        this.gamePiece.changeColumn(move);
        this.service.calcDestination(this.board, this.gamePiece);
        if (this.service.isValidMove(this.board, this.gamePiece)) {
            this.startMoveAnimation();
        }        
        this.displayGameStatus();
    };

    Game.prototype.onAction = function(operation, column) {
        if ((this.gamePiece && this.gamePiece.animating()) || this.aiTurn()) {
            return;
        }

        if (operation === PlayerAction.MOVE) {
            this.gamePiece.changeColumn(column);    
            this.updateView();
        } else if (operation === PlayerAction.SELECT) {
            this.gamePiece.changeColumn(column);
            this.service.calcDestination(this.board, this.gamePiece);
            if (this.service.isValidMove(this.board, this.gamePiece)) {
                this.startMoveAnimation();
            }
            this.updateView();
        }
    };

    // Sets up and starts the move animation
    Game.prototype.startMoveAnimation = function() {
        this.gamePiece.startAnimation(this.settings.animSpeed);
        this.animateMove();
    };

    // Animates the move and then checks if there is a winner or tie game
    Game.prototype.animateMove = function() {
        if (this.gamePiece.animateStep()) {
            if (this.gamePiece.animationFinished()) {
                this.board = this.service.updateBoard(this.board, this.gamePiece);
                if (this.service.checkWinner(this.board, this.gamePiece)) {
                    this.displayGameStatus(this.playerTurn);
                    this.gamePiece = null;
                    this.updateView();
                } else if (this.service.checkTie(this.board)) {
                    this.displayGameStatus(GameState.TIE_GAME);
                    this.gamePiece = null;
                    this.updateView();
                } else {
                    this.playerTurn = this.service.togglePlayerTurn(this.playerTurn);
                    this.gamePiece = this.service.createGamePiece(this.board, this.playerTurn);
                    this.updateView();
                    if (this.aiTurn()) {
                        this.aiAction();
                    }
                }
            } else {
                this.updateView();
                if (this.gamePiece.animating()) {        
                    requestAnimationFrame(this.animateMove.bind(this));               
                }    
            }
        } else if (this.gamePiece.animating()) {        
            requestAnimationFrame(this.animateMove.bind(this));               
        }    
    };    

    // Displays text show winner or tie game
    Game.prototype.displayGameStatus = function(state) {
        var text = undefined;
        if (state === GameState.P1_WINNER) {
            text = 'Player 1 Wins!';
        } else if (state === GameState.P2_WINNER) {
            text = 'Player 2 Wins!';
        } else if (state === GameState.TIE_GAME) {
            text = 'Tie Game!';
        } else if (state === GameState.CPU_TURN) {
            text = 'Player 2 is thinking...';
        }

        if (state) {
            this.statusDiv.innerHTML = text;
            this.statusDiv.classList.remove('hide');
        } else {
            this.statusDiv.classList.add('hide');
        }
    }

    // Updates the graphical view.
    Game.prototype.updateView = function() {
        this.view.paint(this.board, this.gamePiece);
    };
    Connect4.Game = Game;    


    // View that represents game with HTML5 Canvas
    var CanvasView = function(canvas, settings) {
        var settings = settings || {};
        this.gridSize = settings.gridSize || 75;
        this.gridCenter = Math.round(this.gridSize / 2);
        this.circleRadius = Math.round(this.gridSize / 2.5);
        this.boardColor = settings.boardColor || '#1162e9';
        this.emptyColor = settings.boardColor || '#fff';
        this.p1Color = settings.boardColor || '#ddd900';        
        this.p2Color = settings.boardColor || '#d50000';
        this.canvas = canvas;
    };

    CanvasView.prototype.startEventListeners = function(callback) {
        var self = this;
        this.canvas.addEventListener('mousemove', function(e) {
            var column = self.convertMousePosToColumn(e);
            callback(PlayerAction.MOVE, column);
        }, false);

        this.canvas.addEventListener('click', function(e) {
            var column = self.convertMousePosToColumn(e);
            callback(PlayerAction.SELECT, column);
        }, false);
    };

    CanvasView.prototype.convertMousePosToColumn = function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var cx = e.clientX - rect.left;
        return Math.floor(cx / this.gridSize);
    };

    CanvasView.prototype.paint = function(board, gamePiece) {
        var context = this.canvas.getContext("2d");
        var state = board.state;
        var rows = board.rows;
        var cols = board.cols;
        var pi2 = 2 * Math.PI;
        var cy = 0;
        var cx = 0;

        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        context.beginPath();
        context.rect(0, this.gridSize, cols * this.gridSize, rows * this.gridSize);
        context.fillStyle = this.boardColor;
        context.fill();

        for (var y = 0; y < rows; ++y) {
            for (var x = 0; x < cols; ++x) {
                cy = y * this.gridSize + this.gridSize;
                cx = x * this.gridSize;
                var fillColor = this.emptyColor;             
                if (state[y][x] === BoardState.P1) {
                    fillColor = this.p1Color;
                } else if (state[y][x] === BoardState.P2) {
                    fillColor = this.p2Color;
                }
                context.beginPath();
                context.arc(cx + this.gridCenter, cy + this.gridCenter, this.circleRadius, 0, pi2, false);
                context.fillStyle = fillColor;
                context.fill();                  
            }
        }

        if (gamePiece) {
            var coords = gamePiece.coords(); 

            if (gamePiece.playerTurn === BoardState.P1) {
                fillColor = this.p1Color;
            }  else {
                fillColor = this.p2Color;
            }
            context.beginPath();            
            cy = coords.y * this.gridSize + this.gridSize;
            cx = coords.x * this.gridSize;
            context.arc(cx + this.gridCenter, cy + this.gridCenter, this.circleRadius, 0, pi2, false);
            context.fillStyle = fillColor;
            context.fill(); 
        }  
    };
    Connect4.CanvasView = CanvasView;

    window.Connect4 = Connect4;

})(window);