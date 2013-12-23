/** @jsx React.DOM */
(function(window, undefined) {

    var entity = {};


    var Entity = function(options) {
        this.attr = {
            id: null,
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
        if (this.attr.hp < 0) {
            this.attr.hp = 0;
        }
    };

    Entity.prototype.isDead = function() {
        return this.prototype.hp == 0;
    };
    entity.Entity = Entity;


    var Enemy = function(options) {
        Entity.call(this, {
            name: 'Enemy',
            hp: 140,
            hpMax: 140,
            mp: 0,
            mpMax: 0,
            attack: 10,
            exp: 5
        });
        _.extend(this.attr, options);
    };
    Enemy.prototype = Object.create(Entity.prototype);
    Enemy.prototype.constructor = Entity;
    entity.Enemy = Enemy;


    var Player = function(options) {
        Entity.call(this, {
            name: 'Player',
            hp: 200,
            hpMax: 200,
            mp: 20,
            mpMax: 20,
            attack: 20,
            exp: 0,
            level: 1
        });
        _.extend(this.attr, options);
    };
    Player.prototype = Object.create(Entity.prototype);
    Player.prototype.constructor = Entity;
    entity.Player = Player;

    if (window.rpg === undefined) {
        window.rpg = {};
    }
    window.rpg.entity = entity;
})(window);