(function(window, undefined) {
    var level = new rpg.GameLevel();
    var gameEngine = new rpg.GameEngine(document.getElementById('game-container'));
    gameEngine.loadLevel(level);
}(window));