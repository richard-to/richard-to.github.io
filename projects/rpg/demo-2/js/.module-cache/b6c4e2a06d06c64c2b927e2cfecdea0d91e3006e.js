(function(window, undefined) {
    var level = new rpg.CombatLevel();
    var gameEngine = new rpg.GameEngine(document.getElementById('game-container'));
    gameEngine.loadLevel(level);
}(window));