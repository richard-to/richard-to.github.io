(function(window, undefined) {

    var symbols = ['X', 'O'];
    var players = [1, 2];
    var turn = 0;
    var tiles = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    var statusEl = document.getElementById('status');
    var boardEl = document.getElementById('board');
    var tileEls =  boardEl.getElementsByTagName('div');
    var player1Label = document.getElementById('player1-label');
    var player2Label = document.getElementById('player2-label');

    var checkWinner = function(player) {
        if (
                (tiles[0] == player && tiles[1] == player && tiles[2] == player) ||
                (tiles[3] == player && tiles[4] == player && tiles[5] == player) ||
                (tiles[6] == player && tiles[7] == player && tiles[8] == player) ||
                (tiles[0] == player && tiles[4] == player && tiles[8] == player) ||
                (tiles[2] == player && tiles[4] == player && tiles[6] == player)
            ) {
            return true;
        } else {
            return false;
        }
    };

    var displayWinner = function(player) {
        statusEl.textContent = "Player " + player + " Wins!";
        statusEl.className = '';
    };

    for (var i = 0; i < tileEls.length; i++) {
        tileEls[i].addEventListener('click', (function() {
            var index = i;
            return function(event) {
                if (tiles[index] == 0) {
                    tiles[index] = players[turn];
                    event.target.textContent = symbols[turn];
                    displayWinner(players[turn]);
                    turn = (turn + 1) % 2;
                }
            }
        })());
    }

})(window);