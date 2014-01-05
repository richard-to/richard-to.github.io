(function(window, undefined) {
    var canvas = document.getElementById('game-canvas');
    var ctx = canvas.getContext('2d');
    var button = document.getElementById('step-button');

    var controller = new Controller();
    var generation = controller.generations;
    controller.render(ctx);
    controller.plotStats();
    function animate() {
        controller.update();
        controller.render(ctx);
        if (generation != controller.generations) {
            generation = controller.generations;
            controller.plotStats();
        }

        requestAnimationFrame(function() {
            animate();
        });
    }
    animate();
}(window));