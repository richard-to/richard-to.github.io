(function(window, undefined) {
    var gameEl = document.getElementById('game-wrap');

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    canvas.width = 640;
    canvas.height = 480;

    ctx.beginPath();
    ctx.rect(0, 0, 640, 480);
    ctx.fillStyle = 'black';
    ctx.fill();


    ctx.beginPath();
    ctx.rect(50, 140, 50, 100);
    ctx.fillStyle = 'red';
    ctx.fill();

    ctx.beginPath();
    ctx.rect(640 - (50 + 50), 140, 50, 100);
    ctx.fillStyle = 'green';
    ctx.fill();

    gameEl.appendChild(canvas);
})(window);
