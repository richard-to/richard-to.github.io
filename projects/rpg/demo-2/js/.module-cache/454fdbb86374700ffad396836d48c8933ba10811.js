(function(window, undefined) {

    var Entity = function(options) {
        this.attr = {
            name: 'Entity',
            hp: 100,
            hpMax: 100,
            mp: 10,
            mpMax: 10,
            attack: 2
        };
        _.extend(this.attr, options);
    };

    Entity.prototype.attack = function() {
        return this.attr.attack;
    };

    Entity.prototype.takeDamage = function(damage) {
        this.attr.hp -= damage;
        if (this.hp < 0) {
            this.hp = 0;
        }
    };
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
