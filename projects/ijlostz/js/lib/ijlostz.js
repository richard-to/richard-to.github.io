(function(window, undefined) {

    // Main namespace for Tetris.
    var Tetris = {};

    // Settings for Tetris.
    var Settings = {
        onGameEnd: null,
        onScoreUpdated: null,
        keyListenerEl: "body",
        keysEnabled: true,
        gridsize: 25,
        colormap: ["white", "cyan", "blue", "orange", "yellow", "green", "purple", "red"],
        stroke: {enabled: false, linewidth: 1, style: "black"},
    };
    Tetris.Settings = Settings;

    // Constants for handling tetromino rotation.
    var RotationType = {
        LEFT: -1,
        RIGHT: 1
    };
    Tetris.RotationType = RotationType;

    // Constants for handling tetromino movement.
    var MoveType = {
        LEFT: {y: 0, x: -1},
        RIGHT: {y: 0, x: 1},
        SOFTDROP: {y: 1, x: 0}
    };
    Tetris.MoveType = MoveType;

    // Constants for key mapping of controls.
    //
    // Default mapping:
    //
    // - enter: pause
    // - left: move left
    // - right: move right
    // - up or x: rotate right
    // - z: rotate left
    // - down: soft drop
    // - spacebar: hard drop
    var Control = {
        HARDDROP: 32,
        LEFT: 37,
        ROTATE_RIGHT_ALT: 38,
        RIGHT: 39,
        SOFTDROP: 40,
        PAUSE: 13,
        ROTATE_RIGHT: 88,
        ROTATE_LEFT: 90
    };

    Tetris.Control = Control;

    // Constants for tetromino names.
    var ShapeName = {
        I: "I",
        J: "J",
        L: "L",
        O: "O",
        S: "S",
        T: "T",
        Z: "Z"
    };
    Tetris.ShapeName = ShapeName;

    // Tetromino objects contain the following parameters:
    //
    // - A name represented by ShapeName constants.
    // - Start coordinates for initial position.
    // - Id represents the tetromino on the game board array. The id is linked
    //   to the colormap in the settings object.
    // - An array of shapes. Each element in array is a 2d matrix representing
    //   tetromino in various rotation positions.

    var ShapeI = {
        name: ShapeName.I,
        start: {y: 0, x: 3},
        id: 1,
        shape: (function() {
            var n = 1;
            return [
                [
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                    [n, n, n, n],
                    [0, 0, 0, 0]
                ],
                [
                    [0, 0, n, 0],
                    [0, 0, n, 0],
                    [0, 0, n, 0],
                    [0, 0, n, 0]
                ]
            ]
        })()
    };
    Tetris.ShapeI = ShapeI;

    var ShapeJ = {
        name: ShapeName.J,
        start: {y: 1, x: 3},
        id: 2,
        shape: (function(){
            var n = 2;
            return [
                [
                    [0, 0, 0],
                    [n, n, n],
                    [0, 0, n]
                ],
                [
                    [0, n, 0],
                    [0, n, 0],
                    [n, n, 0],
                ],
                [
                    [n, 0, 0],
                    [n, n, n],
                    [0, 0, 0]
                ],
                [
                    [0, n, n],
                    [0, n, 0],
                    [0, n, 0],
                ],
            ];
        })()
    };
    Tetris.ShapeJ = ShapeJ;

    var ShapeL = {
        name: ShapeName.L,
        start: {y: 1, x: 3},
        id: 3,
        shape: (function(){
            var n = 3;
            return [
                [
                    [0, 0, 0],
                    [n, n, n],
                    [n, 0, 0]
                ],
                [
                    [n, n, 0],
                    [0, n, 0],
                    [0, n, 0],
                ],
                [
                    [0, 0, n],
                    [n, n, n],
                    [0, 0, 0]
                ],
                [
                    [0, n, 0],
                    [0, n, 0],
                    [0, n, n],
                ],
            ];
        })()
    };
    Tetris.ShapeL = ShapeL;

    var ShapeO = {
        name: ShapeName.O,
        start: {y: 1, x: 3},
        id: 4,
        shape: (function(){
            var n = 4;
            return [
                [
                    [0, 0, 0, 0],
                    [0, n, n, 0],
                    [0, n, n, 0],
                    [0, 0, 0, 0]
                ]
            ];
        })()
    };
    Tetris.ShapeO = ShapeO;

    var ShapeS = {
        name: ShapeName.S,
        start: {y: 1, x: 3},
        id: 5,
        shape: (function(){
            var n = 5;
            return [
                [
                    [0, 0, 0],
                    [0, n, n],
                    [n, n, 0]
                ],
                [
                    [0, n, 0],
                    [0, n, n],
                    [0, 0, n]
                ]
            ];
        })()
    };
    Tetris.ShapeS = ShapeS;

    var ShapeT = {
        name: ShapeName.T,
        start: {y: 1, x: 3},
        id: 6,
        shape: (function(){
            var n = 6;
            return [
                [
                    [0, 0, 0],
                    [n, n, n],
                    [0, n, 0]
                ],
                [
                    [0, n, 0],
                    [n, n, 0],
                    [0, n, 0]
                ],
                [
                    [0, n, 0],
                    [n, n, n],
                    [0, 0, 0]
                ],
                [
                    [0, n, 0],
                    [0, n, n],
                    [0, n, 0]
                ]
            ];
        })()
    };
    Tetris.ShapeT = ShapeT;

    var ShapeZ = {
        name: ShapeName.Z,
        start: {y: 1, x: 3},
        id: 7,
        shape: (function(){
            var n = 7;
            return [
                [
                    [0, 0, 0],
                    [n, n, 0],
                    [0, n, n]
                ],
                [
                    [0, 0, n],
                    [0, n, n],
                    [0, n, 0]
                ]
            ];
        })()
    };
    Tetris.ShapeZ = ShapeZ;

    // A ist of shapes that can be passed in to the RandomGenerator function.
    var ShapeList = [ShapeI, ShapeJ, ShapeL, ShapeO, ShapeS, ShapeT, ShapeZ];
    Tetris.ShapeList = ShapeList;

    // Represents a an individual Tetromino.
    //
    // The constructor requires a ShapeX object from above.
    // The Tetromino class keeps track of the current position and rotation of
    // a live tetromino.
    var Tetromino = function(shapeType) {
        this.shapeType = shapeType;
        this.rotation = 0;
        this.name = this.shapeType.name;
        this.shape = this.shapeType.shape[this.rotation];
        this.height = this.shape.length;
        this.width = this.shape[0].length;
        this.y = this.shapeType.start.y;
        this.x = this.shapeType.start.x;
    };

    // Clone a tetromino. Useful for when a tetromino is moved into
    // an illegal position the board. This allows us to rollback and
    // use the valid Tetromino as the current position.
    Tetromino.prototype.clone = function() {
        var tetromino = new Tetromino(this.shapeType);
        tetromino.rotation = this.rotation;
        tetromino.shape = this.shape;
        tetromino.y = this.y;
        tetromino.x = this.x;
        return tetromino;
    };
    Tetris.Tetromino = Tetromino;

    // Represents a tetris board as a 2d array
    //
    // The actual size of the board can be configured, but
    // it defaults to 10 x 22, the same size as standard Tetris.
    //
    // The first two rows are hidden rows.
    //
    // The board contains a frozen and active state.
    //
    // The frozen state is the state of the locked Tetrominos.
    // The active state represents the frozen state with a moving Tetromino.
    //
    // Everytime a Tetromino in the active state becomes locked, the active state
    // is copied to the frozen state.
    var Board = function(state) {
        this.width = 10;
        this.height = 22;
        this.rowstart = 2;
        this.state = state || this.init(this.height, this.width);
    };

    // Initializes an empty board.
    //
    // Empty cell on the board is represented by a 0.
    // Any value greater than 0 is a taken by a Tetromino.
    Board.prototype.init = function(height, width) {
        var state = new Array(height);
        for (var y = 0; y < height; ++y) {
            state[y] = new Array(width);
            for (var x = 0; x < width; ++x) {
                state[y][x] = 0;
            }
        }
        return state;
    };

    // Clones the board.
    Board.prototype.clone = function() {
        var height = this.state.length;
        var width = this.state[0].length;
        var state = new Array(height);
        for (var y = 0; y < height; y++) {
            state[y] = new Array(width);
            for (var x = 0; x < width; x++) {
                state[y][x] = this.state[y][x];
            }
        }
        return new Board(state);
    };
    Tetris.Board = Board;

    // Helper functions that manipulate tetrominos.
    // All operations are non-destructive and will return a copy.
    var TetrominoOp = {
        // Rotates a copy of a Tetromino passed into the function using
        // a direction specified in the directions constant.
        rotate: function(tetromino, direction) {
            var newTetromino = tetromino.clone();
            var newRotation = newTetromino.rotation + direction;
            if (newRotation < 0) {
                newRotation = newTetromino.shapeType.shape.length + newRotation;
            } else {
                newRotation %= newTetromino.shapeType.shape.length;
            }
            newTetromino.rotation = newRotation;
            newTetromino.shape = newTetromino.shapeType.shape[newTetromino.rotation];
            return newTetromino;
        },
        // Moves a copy of a Tetromino by using a move specified in the move
        // constants above.
        move: function(tetromino, move) {
            var newTetromino = tetromino.clone();
            newTetromino.y += move.y;
            newTetromino.x += move.x;
            return newTetromino;
        },
        rotate: function(tetromino, direction) {
            var newTetromino = tetromino.clone();
            var newRotation = newTetromino.rotation + direction;
            if (newRotation < 0) {
                newRotation = newTetromino.shapeType.shape.length + newRotation;
            } else {
                newRotation %= newTetromino.shapeType.shape.length;
            }
            newTetromino.rotation = newRotation;
            newTetromino.shape = newTetromino.shapeType.shape[newTetromino.rotation];
            return newTetromino;
        }
    };
    Tetris.TetrominoOp = TetrominoOp;

    // Helper functions that manipulate the board state.
    // All operations are non-destructive and will return a copy.
    var BoardOp = {
        // Updates board with the given Tetromino's position and rotation on the board.
        // A copy of the board is returned.
        update: function(board, tetromino) {
            var newBoard = board.clone();
            var updatedState = newBoard.state;

            var state = board.state;
            var statey = board.height;
            var statex = board.width;

            var shape = tetromino.shape;
            var height = tetromino.height;
            var width = tetromino.width;

            for (var y = 0; y < height; ++y) {
                for (var x = 0; x < width; ++x) {
                    var yPos = tetromino.y + y;
                    var xPos = tetromino.x + x;
                    if (shape[y][x] > 0 && yPos >= 0 && xPos >= 0 && yPos < statey && xPos < statex) {
                        if (updatedState[yPos][xPos] > 0) {
                            throw new Error();
                        } else {
                            updatedState[yPos][xPos] = shape[y][x];
                        }
                    }
                }
            }

            newBoard.state = updatedState;
            return newBoard;
        },
        // Checks if the Tetromino coordinates are valid given the current
        // state.
        isValid: function(board, tetromino) {
            var state = board.state;
            var statey = board.height;
            var statex = board.width;
            var shape = tetromino.shape;
            var height = tetromino.height;
            var width = tetromino.width;

            for (var y = 0; y < height; ++y) {
                for (var x = 0; x < width; ++x) {
                    var yPos = tetromino.y + y;
                    var xPos = tetromino.x + x;
                    if (shape[y][x] > 0 && (yPos < 0 || xPos < 0 ||
                            yPos >= statey || xPos >= statex || state[yPos][xPos] > 0)) {
                        return false;
                    }
                }
            }
            return true;
        },
        // Checks if the Tetromino has hit the bottom of the board or if
        // the Tetromino has connected with another Tetromino below it.
        isTetrominoLocked: function(board, tetromino) {
            var state = board.state;
            var statey = board.height;
            var statex = board.width;
            var shape = tetromino.shape;
            var height = tetromino.height;
            var width = tetromino.width;
            var tetrominoy = tetromino.y + 1;
            for (var y = 0; y < height; ++y) {
                for (var x = 0; x < width; ++x) {
                    var yPos = tetrominoy + y;
                    var xPos = tetromino.x + x;
                    if (shape[y][x] > 0 && (yPos >= statey || xPos >= statex || state[yPos][xPos] > 0)) {
                        return true;
                    }
                }
            }
            return false;
        },
        // Finds all the rows that are occupied by a Tetromino.
        // Returns null if no such lines are found. If lines are found
        // an object is returned. The object has key values that represent
        // the index of the row
        findLines: function(board) {
            var state = board.state;
            var height = board.height;
            var width = board.width;
            var foundLines = false;
            var lines = {};
            for (var y = 0; y < height; ++y) {
                var isLine = true;
                for (var x = 0; x < width; ++x) {
                    if (state[y][x] === 0) {
                        isLine = false;
                        break;
                    }
                }
                if (isLine) {
                    lines[y] = true;
                    foundLines = true;
                }
            }
            return (foundLines) ? lines : null;
        },
        // Clears completed rows from the frozen state of the board.
        // Tetrominos are moved down accordingly.
        clearLines: function(board, lines) {
            var state = board.state;

            var newBoard = new Board();
            var newState = newBoard.state;

            var height = board.height - 1;
            var width = board.widthh - 1;
            var currentHeight = height;
            for (var y = height; y >= 0; --y) {
                var isLine = true;
                if (!lines[y]) {
                    newState[currentHeight] = state[y].slice();
                    currentHeight--;

                }
            }
            return newBoard;
        }
    };
    Tetris.BoardOp = BoardOp;

    // Generates a random sequence of Tetrominos.
    //
    // Uses the "RandomGenerator" approach in which
    // seven unique Tetrominos are drawn randomly.
    //
    // When there are no more Tetrominos left, draw
    // another seven using the same approach.
    var RandomGenerator = function(shapes) {
        this.shapes = shapes;
        this.bag = this.generate(this.shapes);
    };

    // Shuffles the array of shapes and returns a new shuffled array.
    RandomGenerator.prototype.generate = function(shapes) {
        return _.shuffle(shapes);
    }

    // Picks out next shape in bag. If no shapes are left, another
    // set is generated.
    RandomGenerator.prototype.nextShape = function() {
        if (this.bag.length === 0) {
            this.bag = this.generate(this.shapes);
        }
        var shape = this.bag.pop();
        return shape;
    };
    Tetris.RandomGenerator = RandomGenerator;

    // Uses the NES scoring system.
    // The linescore array contains the base point values for
    // number of rows cleared. Array index 0 means 0 rows cleared, etc.
    var ScoreSystem = function() {
        this.lineScore = [0, 40, 100, 300, 1200];
    };

    // As the player gets to higher levels, points per row cleared increases
    // by a multiple of the current level.
    //
    // In other words at level 2, if the player got a Tetris, 2400 points (1200 x 2)
    // would be added to the score.
    ScoreSystem.prototype.calculate = function(numLines, level) {
        var baseScore = this.lineScore[numLines];
        return baseScore * (level + 1);
    }
    Tetris.ScoreSystem = ScoreSystem;

    // Paints the board state on the canvas.
    var CanvasView = function(canvas) {
        this.canvas = canvas;
    };

    CanvasView.prototype.paint = function(board, settings) {
        var context = this.canvas.getContext("2d");
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        context.lineWidth = settings.stroke.linewidth;
        context.strokeStyle = settings.stroke.style;

        var strokeEnabled = settings.stroke.enabled;
        var gridsize = settings.gridsize;
        var colormap = settings.colormap;
        var state = board.state;
        var rowstart = board.rowstart;
        var height = board.height;
        var width = board.width;

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                if (state[y][x] > 0) {
                    var cy = (y - rowstart) * gridsize;
                    var cx = x * gridsize;
                    context.beginPath();
                    context.rect(cx, cy, gridsize, gridsize);
                    context.fillStyle = colormap[state[y][x]];
                    context.fill();
                    if (strokeEnabled) {
                        context.stroke();
                    }
                }
            }
        }
    };
    Tetris.CanvasView = CanvasView;

    // Prints the current state of board to console.
    var Debug = {
        printBoardState: function(board) {
            var out = "";
            var state = board.state;
            var height = board.height;
            var width = board.width;
            for (var y = 0; y < height; ++y) {
                for (var x = 0; x < width; ++x) {
                    out += state[y][x] + " ";
                }
                out += "\n";
            }
            console.log(out);
        }
    };
    Tetris.Debug = Debug;

    // Game state enum
    var GameState = {
        RUNNING: 0,
        PAUSED: 1,
        END: 2
    };
    Tetris.GameState = GameState;

    // Manages all the parts of the game (Tetromino, Board, canvas, key events, score, etc)
    //
    // This needs refactoring badly.
    //
    // - canvas is a canvas object that represents the board.
    // - The shapeBag is the Tetromino generator. See RandomGenerator class
    //   for interface if a new random generator is desired.
    // - A settings object that can override default settings.
    var Game = function(view, shapeBag, settings) {
        this.MILLISECONDS = 1000;

        this.settings = {};
        _.extend(this.settings, Settings, settings);
        this.debug = Debug;
        this.view = view;
        this.shapeBag = shapeBag || new RandomGenerator(ShapeList);
        this.scoreSystem = new ScoreSystem();
        this.activeBoard = new Board();
        this.frozenBoard = new Board();
        this.tetrominoOp = TetrominoOp;
        this.boardOp = BoardOp;

        // Tetris runs at ~60 frames per second.
        this.fps = 60;

        // For now hardcode gravity to every 48 frames.
        // Not the best name, but gravity is the speed of which
        // tetrominos fall.
        //
        // This value should increase as player reaches new levels.
        this.gravity = 48;

        // Javascript timer uses milliseconds so need to use that to calculate
        // frame rate
        this.frameRate = this.MILLISECONDS / this.fps;

        // Keeps track of the number of frames elapsed. Resets to 0 once the
        // gravity value is reached.
        this.gravityFrame = 0;

        // Keeps track of users score.
        this.score = 0;

        // Keeps track of users level.
        this.level = 0;

        // Keeps track of game state.
        this.state = GameState.RUNNING;

        // Key events hash contains functions that correspond to key press
        // values.
        this.keyevents = {};
        this.keyevents[Control.LEFT] =  _.bind(this.handleMoveLeft, this);
        this.keyevents[Control.RIGHT] = _.bind(this.handleMoveRight, this);
        this.keyevents[Control.ROTATE_RIGHT_ALT] = _.bind(this.handleRotateRight, this);
        this.keyevents[Control.ROTATE_RIGHT] = _.bind(this.handleRotateRight, this);
        this.keyevents[Control.ROTATE_LEFT] = _.bind(this.handleRotateLeft, this);
        this.keyevents[Control.SOFTDROP] = _.bind(this.handleSoftDrop, this);
        this.keyevents[Control.HARDDROP] = _.bind(this.handleHardDrop, this);
        this.keyevents[Control.PAUSE] = _.bind(this.handlePauseToggle, this);

        if (this.settings.keysEnabled) {
            var self = this;
            var el = this.settings.keyListenerEl;
            this.$el = el instanceof $ ? el : $(el);
            this.el = this.$el[0];
            this.$el.keydown(function(e) {
                var validAction = self.handleKeyEvent(e.which);
                if (validAction) {
                    e.preventDefault();
                }
            });
        }
    };

    // The key event handler. If key press exists in hash, call corresponding function
    // and prevent default actions. This is necessary since the arrow keys can scroll the
    // page arround.
    Game.prototype.handleKeyEvent = function(keyCode) {
        var validAction = true;
        var action = this.keyevents[keyCode];
        if (_.isFunction(action) && this.state === GameState.RUNNING) {
            action();
        } else if (keyCode === Control.PAUSE) {
            this.handlePauseToggle();
        } else {
            validAction = false;
        }
        return validAction;
    };

    // Runs the game. Start games loop and paints the inital board.
    Game.prototype.run = function() {
        this.tetromino = new Tetromino(this.shapeBag.nextShape());
        this.activeBoard = this.boardOp.update(this.frozenBoard, this.tetromino);
        this.updateView();
        this.gameLoop();
    };

    // The game loop handles the animation of the Tetromino falling.
    //
    // Currently the fall rate is hardcoded at every 48 frames.
    // This only applies to level 0. This rate increases with every level.
    Game.prototype.gameLoop = function () {
        if (this.state === GameState.RUNNING) {
            if (this.gravityFrame >= this.gravity) {
                this.handleSoftDrop();
                this.gravityFrame = 0;
            } else {
                this.gravityFrame++;
            }
        }

        var self = this;
        if (this.state !== GameState.END) {
            setTimeout(function() {
                self.gameLoop();
            }, this.frameRate);
        }
    };

    Game.prototype.handlePauseToggle = function() {
        if (this.state === GameState.RUNNING) {
            this.state = GameState.PAUSED;
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.RUNNING;
        } else {
            this.state = GameState.END;
        }
    };

    // Event handler for Harddrop (spacebar).
    // NES version didn't have a harddrop, but it
    // makes things go faster.
    Game.prototype.handleHardDrop = function() {
        var tetromino = this.tetromino.clone();
        while (this.boardOp.isTetrominoLocked(this.frozenBoard, tetromino) === false) {
            tetromino = this.tetrominoOp.move(tetromino, MoveType.SOFTDROP);
        }
        this.frozenBoard = this.boardOp.update(this.frozenBoard, tetromino);
        return this.handleLineLock(tetromino);
    };

    // Event handler for soft drop. Just drops
    // the tetromino down 1 cell.
    // If the tetromino hits a another tetromino or the bottom
    // of the board, it will be locked immediately.
    Game.prototype.handleSoftDrop = function() {
        var tetromino = this.tetrominoOp.move(this.tetromino, MoveType.SOFTDROP);
        var actionResult = this.handleAction(tetromino);
        if (this.boardOp.isTetrominoLocked(this.frozenBoard, tetromino)) {
            this.frozenBoard = this.activeBoard.clone();
            actionResult = this.handleLineLock(tetromino);
        }
        return actionResult;
    };

    Game.prototype.handleMoveLeft = function() {
        this.handleAction(this.tetrominoOp.move(this.tetromino, MoveType.LEFT))
    };

    Game.prototype.handleMoveRight = function() {
        this.handleAction(this.tetrominoOp.move(this.tetromino, MoveType.RIGHT))
    };

    Game.prototype.handleRotateLeft = function() {
        this.handleAction(this.tetrominoOp.rotate(this.tetromino, RotationType.LEFT))
    };

    Game.prototype.handleRotateRight = function() {
        this.handleAction(this.tetrominoOp.rotate(this.tetromino, RotationType.RIGHT))
    };

    // Handles other movements. Left, right, and rotate.
    Game.prototype.handleAction = function(tetromino) {
        if (this.boardOp.isValid(this.frozenBoard, tetromino)) {
            this.tetromino = tetromino;
            this.activeBoard = this.boardOp.update(this.frozenBoard, tetromino);
            this.updateView();
            return true;
        } else {
            return false;
        }
    };

    // Called if a tetromino is locked. In this case we check if
    // any lines are cleared, update the score if necessary, and
    // create the next Tetromino to be dropped.
    Game.prototype.handleLineLock = function(tetromino) {
        var linesCleared = this.clearLines();
        this.updateScore(linesCleared);
        try {
            tetromino = new Tetromino(this.shapeBag.nextShape());
            this.activeBoard = this.boardOp.update(this.frozenBoard, tetromino);
            this.tetromino = tetromino;
            this.updateView();
        } catch (e) {
            this.activeBoard = this.frozenBoard.clone();
            this.updateView();
            this.endGame();
        }
        return true;
    };

    // Handles end game situation.
    //
    // - Change game state to END
    // - Unbind key listener if keys enabled
    // - Call end game callback if given
    Game.prototype.endGame = function() {
        this.state = GameState.END;
        if (this.settings.keysEnabled) {
            this.$el.unbind("keydown");
        }
        if (this.settings.onGameEnd !== null) {
            this.settings.onGameEnd(this.score);
        }
    };

    // Updates the score.
    Game.prototype.updateScore = function(linesCleared) {
        this.score += this.scoreSystem.calculate(linesCleared, this.level);
        if (linesCleared > 0 && this.settings.onScoreUpdated != null) {
            this.settings.onScoreUpdated(this.score);
        }
    };

    // Clears lines and updates state.
    Game.prototype.clearLines = function() {
        var lines = this.boardOp.findLines(this.frozenBoard);
        var numLines = 0;
        if (lines) {
            this.frozenBoard = this.boardOp.clearLines(this.frozenBoard, lines);
            for (var k in lines) {
                numLines++;
            }
        }
        return numLines
    };

    // Updates the graphical view.
    Game.prototype.updateView = function() {
        this.view.paint(this.activeBoard, this.settings);
    };
    Tetris.Game = Game;

    window.Tetris = Tetris;
})(window);