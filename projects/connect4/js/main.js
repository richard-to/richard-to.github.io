(function(window) {
    var canvas = document.getElementById('board');
    var statusDiv = document.getElementById('game-winner-container');
    var playerSelect = document.getElementById('player-count-select')
    var startButton = document.getElementById('start-game-btn');

    var board = new Connect4.Board();
    var view = new Connect4.CanvasView(canvas);
    var game = new Connect4.Game(view, statusDiv, new Connect4AI.Connect4AlphaBeta());

    startButton.addEventListener('click', function(e) {
        if (playerSelect.options[playerSelect.selectedIndex].value == Connect4.BoardState.P1) {
            game.startGame(new Connect4AI.Connect4AlphaBeta());
        } else {
            game.startGame();
        }
        startButton.innerHTML = "Reset Game";      
    });
})(window);