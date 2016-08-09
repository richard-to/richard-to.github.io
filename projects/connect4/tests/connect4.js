
test("Test game board state", function() {
    var cols = 7;
    var rows = 6;
    var moves = 2;

    var board = new Connect4.Board(null, moves);
    ok(board.cols === cols);
    ok(board.rows === rows);
    ok(board.maxMoves === cols * rows);
    ok(board.moveCount === moves);
    ok(board.state.length === rows);
    ok(board.state[0].length === cols);
});

test("Test game board clone", function() {
    var rows = 6;    
    var cols = 7;
    var moves = 2;

    var board = new Connect4.Board(null, moves);
    board.state[5][4] = Connect4.BoardState.P1;
    var newBoard = board.clone();

    ok(board.state[5][4] === newBoard.state[5][4]);
    ok(board.moveCount === newBoard.moveCount);

    newBoard.state[5][4] = Connect4.BoardState.P2;
    ok(board.state[5][4] !== newBoard.state[5][4]);

    ++board.moveCount;
    ok(board.moveCount === newBoard.moveCount + 1);
});

test("Test game piece coords", function() {
    var row = 5;
    var col = 4;
    var speed = 0;    
    var gamePiece = new Connect4.GamePieceViewModel(Connect4.BoardState.P1, row, col);
    
    gamePiece.startAnimation(speed);
    gamePiece.animateStep();

    var finalCoords = gamePiece.finalCoords();
    ok(finalCoords.x === col);
    ok(finalCoords.y === row);

    var coords = gamePiece.coords();
    ok(coords.x === col);
    ok(coords.y === 0);    
});

test("Test game piece view model animation", function() {
    var row = 6;
    var col = 2;
    var speed = 0;
    var gamePiece = new Connect4.GamePieceViewModel(Connect4.BoardState.P1, row, col);
    
    gamePiece.startAnimation(speed);
    var i = 0;
    for (i = 0; i <= row; ++i) {
        gamePiece.animateStep();
        if (gamePiece.animationFinished()) {
            break;
        }
    }

    ok(i === row);
    ok(gamePiece.animationFinished() === true);
    ok(gamePiece.animating() === false);
});

test("Test who goes first", function() {
    var attempts = 5;
    var service = new Connect4.GameOperations();
    for (var i = 0; i < attempts; ++i) {
        var playerTurn = service.whoGoesFirst();
        ok(playerTurn === Connect4.BoardState.P1 || playerTurn === Connect4.BoardState.P2); 
    }
});

test("Test toggle player turn", function() {
    var playerTurn = Connect4.BoardState.P1;
    var service = new Connect4.GameOperations();
    playerTurn = service.togglePlayerTurn(playerTurn);
    ok(playerTurn === Connect4.BoardState.P2);
    playerTurn = service.togglePlayerTurn(playerTurn);
    ok(playerTurn === Connect4.BoardState.P1);
});

test("Test create game piece", function() {
    var playerTurn = Connect4.BoardState.P1;
    var board = new Connect4.Board();
    var service = new Connect4.GameOperations();
    var gamePiece = service.createGamePiece(board, playerTurn);
    var coords = gamePiece.coords();
    var finalCoords = gamePiece.finalCoords();

    ok(gamePiece.playerTurn === playerTurn);
    ok(coords.x === 0);
    ok(coords.y === -1);
    ok(finalCoords.x === 0);
    ok(finalCoords.y === 5);
});

test("Test calc destination", function() {
    var playerTurn = Connect4.BoardState.P1;
    var board = new Connect4.Board();
    board.state[5][2] = Connect4.BoardState.P1;
    var service = new Connect4.GameOperations();
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, null, 0);
    gamePiece.changeColumn(2);

    service.calcDestination(board, gamePiece);
    var finalCoords = gamePiece.finalCoords();

    ok(finalCoords.x === 2);
    ok(finalCoords.y === 4);
});

test("Test calc destination full", function() {
    var col = 0;
    var playerTurn = Connect4.BoardState.P1;
    var board = new Connect4.Board();
    for (var y = 0; y < board.rows; ++y) {
        board.state[y][col] = Connect4.BoardState.P1;
    }

    var service = new Connect4.GameOperations();
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, null, 0);

    service.calcDestination(board, gamePiece);
    var finalCoords = gamePiece.finalCoords();

    ok(finalCoords.x === col);
    ok(finalCoords.y === -1);
});

test("Test update board", function() {
    var playerTurn = Connect4.BoardState.P1;
    var board = new Connect4.Board();
    board.state[5][2] = Connect4.BoardState.P1;
    var service = new Connect4.GameOperations();
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, null, 0);    
    gamePiece.changeColumn(2);
    service.calcDestination(board, gamePiece);    

    var newBoard = service.updateBoard(board, gamePiece);
    var coords = gamePiece.finalCoords();   

    ok(board.state[coords.y][coords.x] === Connect4.BoardState.EMPTY);
    ok(board.moveCount === 0);
    ok(newBoard.state[coords.y][coords.x] === Connect4.BoardState.P1);
    ok(newBoard.moveCount === 1);
});

test("Test valid moves", function() {
    var playerTurn = Connect4.BoardState.P1;
    var board = new Connect4.Board();
    board.state[5][2] = Connect4.BoardState.P1;
    var service = new Connect4.GameOperations();
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 4, 2);
    ok(service.isValidMove(board, gamePiece) === true);
    
    gamePiece = new Connect4.GamePieceViewModel(playerTurn, 4, 3);
    ok(service.isValidMove(board, gamePiece) === true);    
});

test("Test invalid moves", function() {
    var col = 0;    
    var playerTurn = Connect4.BoardState.P1;
    var board = new Connect4.Board();
    for (var y = 0; y < board.rows; ++y) {
        board.state[y][col] = Connect4.BoardState.P1;
    }
    var service = new Connect4.GameOperations();
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 0, 0);
    ok(service.isValidMove(board, gamePiece) === false);
    
    gamePiece = new Connect4.GamePieceViewModel(playerTurn);
    ok(service.isValidMove(board, gamePiece) === false);

    gamePiece = new Connect4.GamePieceViewModel(playerTurn, 6, 7);
    ok(service.isValidMove(board, gamePiece) === false);  
});

test("Test is not tie game", function() {
    var board = new Connect4.Board();    
    var service = new Connect4.GameOperations();

    board.moveCount = 0;    
    ok(service.checkTie(board) === false);

    board.moveCount = (board.rows * board.cols) - 1;    
    ok(service.checkTie(board) === false);
});

test("Test tie game", function() {
    var board = new Connect4.Board();    
    var service = new Connect4.GameOperations();

    board.moveCount = (board.rows * board.cols);    
    ok(service.checkTie(board) === true);
});

test("Test no winner", function() {
    var playerTurn = Connect4.BoardState.P1;    
    var board = new Connect4.Board();
    board.state[5][0] == playerTurn;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 5, 0); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === false);
});

test("Test no winner 2", function() {
    var playerTurn = Connect4.BoardState.P1;    
    var board = new Connect4.Board();
    var a = Connect4.BoardState.P1;
    var b = Connect4.BoardState.P2;
    var c = Connect4.BoardState.EMPTY;
    var state = [
        [c, c, c, a, c, c, c],
        [c, c, c, a, c, c, c],
        [c, c, c, a, c, c, c],
        [c, c, c, b, c, c, c],
        [c, c, c, b, c, c, c],
        [c, c, c, b, b, c, c],
    ];
    board.state = state;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 0, 3); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === false);
});

test("Test down winner", function() {
    var playerTurn = Connect4.BoardState.P1;    
    var board = new Connect4.Board();
    var a = Connect4.BoardState.P1;
    var b = Connect4.BoardState.P2;
    var c = Connect4.BoardState.EMPTY;
    var state = [
        [c, c, c, a, c, c, c],
        [c, c, c, a, c, c, c],
        [c, c, c, a, c, c, c],
        [c, c, c, a, c, c, c],
        [c, c, c, b, c, c, c],
        [c, c, c, b, c, c, c],
    ];
    board.state = state;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 0, 3); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === true);
});

test("Test left winner", function() {
    var playerTurn = Connect4.BoardState.P1;    
    var board = new Connect4.Board();
    var a = Connect4.BoardState.P1;
    var b = Connect4.BoardState.P2;
    var c = Connect4.BoardState.EMPTY;
    var state = [
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [a, a, a, a, c, c, c],
        [b, a, b, b, c, c, c],
        [b, b, a, b, c, c, c],
    ];
    board.state = state;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 3, 3); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === true);
});

test("Test right winner", function() {
    var playerTurn = Connect4.BoardState.P1;    
    var board = new Connect4.Board();
    var a = Connect4.BoardState.P1;
    var b = Connect4.BoardState.P2;
    var c = Connect4.BoardState.EMPTY;
    var state = [
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [a, a, a, a, c, c, c],
        [b, a, b, b, c, c, c],
        [b, b, a, b, c, c, c],
    ];
    board.state = state;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 3, 0); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === true);
});

test("Test left/right winner", function() {
    var playerTurn = Connect4.BoardState.P1;    
    var board = new Connect4.Board();
    var a = Connect4.BoardState.P1;
    var b = Connect4.BoardState.P2;
    var c = Connect4.BoardState.EMPTY;
    var state = [
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [a, a, a, a, c, c, c],
        [b, a, b, b, c, c, c],
        [b, b, a, b, c, c, c],
    ];
    board.state = state;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 3, 1); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === true);
});

test("Test down-left winner", function() {
    var playerTurn = Connect4.BoardState.P1;    
    var board = new Connect4.Board();
    var a = Connect4.BoardState.P1;
    var b = Connect4.BoardState.P2;
    var c = Connect4.BoardState.EMPTY;
    var state = [
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [c, c, c, a, c, c, c],
        [a, b, a, b, c, c, c],
        [b, a, b, b, c, c, c],
        [a, b, a, b, c, c, c],
    ];
    board.state = state;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 2, 3); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === true);
});

test("Test up-right winner", function() {
    var playerTurn = Connect4.BoardState.P1;    
    var board = new Connect4.Board();
    var a = Connect4.BoardState.P1;
    var b = Connect4.BoardState.P2;
    var c = Connect4.BoardState.EMPTY;
    var state = [
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [c, c, c, a, c, c, c],
        [c, b, a, b, c, c, c],
        [c, a, b, b, c, c, c],
        [a, b, a, b, c, c, c],
    ];
    board.state = state;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 5, 0); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === true);
});

test("Test up-right/down-left winner", function() {
    var playerTurn = Connect4.BoardState.P1;    
    var board = new Connect4.Board();
    var a = Connect4.BoardState.P1;
    var b = Connect4.BoardState.P2;
    var c = Connect4.BoardState.EMPTY;
    var state = [
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [c, c, c, a, c, c, c],
        [c, b, a, b, c, c, c],
        [b, a, b, b, c, c, c],
        [a, b, a, b, c, c, c],
    ];
    board.state = state;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 3, 2); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === true);
});

test("Test down-right winner", function() {
    var playerTurn = Connect4.BoardState.P2;    
    var board = new Connect4.Board();
    var a = Connect4.BoardState.P1;
    var b = Connect4.BoardState.P2;
    var c = Connect4.BoardState.EMPTY;
    var state = [
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [b, c, c, b, c, c, c],
        [c, b, a, b, c, c, c],
        [b, a, b, a, c, c, c],
        [a, b, a, b, c, c, c],
    ];
    board.state = state;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 2, 0); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === true);
});

test("Test up-left winner", function() {
    var playerTurn = Connect4.BoardState.P2;    
    var board = new Connect4.Board();
    var a = Connect4.BoardState.P1;
    var b = Connect4.BoardState.P2;
    var c = Connect4.BoardState.EMPTY;
    var state = [
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [b, c, c, c, c, c, c],
        [c, b, a, c, c, c, c],
        [b, a, b, c, c, c, c],
        [a, b, a, b, a, c, c],
    ];
    board.state = state;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 5, 3); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === true);
});

test("Test down-right/up-left winner", function() {
    var playerTurn = Connect4.BoardState.P2;    
    var board = new Connect4.Board();
    var a = Connect4.BoardState.P1;
    var b = Connect4.BoardState.P2;
    var c = Connect4.BoardState.EMPTY;
    var state = [
        [c, c, c, c, c, c, c],
        [c, c, c, c, c, c, c],
        [b, c, c, c, c, c, c],
        [c, b, c, c, c, c, c],
        [b, a, b, c, c, c, c],
        [a, b, a, b, a, c, c],
    ];
    board.state = state;
    var gamePiece = new Connect4.GamePieceViewModel(playerTurn, 4, 2); 
    var service = new Connect4.GameOperations();
    ok(service.checkWinner(board, gamePiece) === true);
});