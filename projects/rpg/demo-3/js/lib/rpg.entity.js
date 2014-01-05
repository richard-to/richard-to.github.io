/** @jsx React.DOM */
(function(window, undefined) {

    // TODO(richard-to): Need to make sure actions loaded. Time to use RequireJS?
    var actions = rpg.actions;

    var entity = {};

    // Base Entity to represent heroes, enemies and NPCs
    var Entity = function(options) {
        this.attr = {
            name: '',
            hp: 0,
            hpMax: 0,
            mp: 0,
            mpMax: 0,
            def: 0,
            att: 0,
            acc: 0,
            exp: 0,
            lvl: 1,
            coins: 0,
            expGained: 0
        };
        _.extend(this.attr, options);
        this.prefix = this.attr.name.replace(' ', '_');
        this.key =  _.uniqueId(this.prefix);
        if (this.attr.hpMax < this.attr.hp) {
            this.attr.hpMax = this.attr.hp;
        }

        if (this.attr.mpMax < this.attr.mp) {
            this.attr.mpMax = this.attr.mp;
        }
    };

    // TODO(richard-to): Need to account for skill bonus along with base attack
    Entity.prototype.attack = function(bonus) {
        var attack = (bonus) ? (bonus + this.attr.att) : this.attr.att;
        return Math.floor(Math.random() * (attack - this.attr.acc + 1)) + this.attr.acc;
    };

    Entity.prototype.takeDamage = function(damage) {
        var actualDamage = damage - Math.floor((Math.random() * this.attr.def) + 1);
        if (actualDamage < 0) {
            actualDamage = 0;
        }
        this.attr.hp -= actualDamage;
        if (this.attr.hp < 0) {
            this.attr.hp = 0;
        }
        return actualDamage;
    };

    Entity.prototype.isDead = function() {
        return this.attr.hp == 0;
    };
    entity.Entity = Entity;

    // Well-rounded character with good attack, accuracy, and defense.
    // Also can cast magic.
    var Corrina = function(options) {
        Entity.call(this, {
            name: 'Corrina',
            hp: 300,
            mp: 20,
            att: 20,
            acc: 15,
            def: 5,
        });
    };
    Corrina.prototype = Object.create(Entity.prototype);
    Corrina.prototype.constructor = Entity;
    // TODO(richard-to): Improve this. Not now though...
    Corrina.prototype.getActions = function() {
        return [new actions.Slash(), new actions.Strike()];
    };
    entity.Corrina = Corrina;

    // Character with a powerful attack, but low accuracy, defense, and
    // has no magic.
    var Seth = function(options) {
        Entity.call(this, {
            name: 'Seth',
            hp: 250,
            mp: 0,
            att: 40,
            acc: 10,
            def: 2,
        });
    };
    Seth.prototype = Object.create(Entity.prototype);
    Seth.prototype.constructor = Seth;
    Seth.prototype.getActions = function() {
        return [new actions.Strike(), new actions.Slash()];
    };
    entity.Seth = Seth;

    // First level enemy
    var EyeballScout = function(options) {
        Entity.call(this, {
            name: 'Eyeball Scout',
            hp: 30,
            mp: 0,
            att: 5,
            acc: 3,
            def: 5,
            exp: 5,
            coins: 5
        });
    };
    EyeballScout.prototype = Object.create(Entity.prototype);
    EyeballScout.prototype.constructor = EyeballScout;
    entity.EyeballScout = EyeballScout;

    // Stronger first level enemy
    var EvilBear = function(options) {
        Entity.call(this, {
            name: "Evil Bear",
            hp: 50,
            mp: 0,
            att: 20,
            acc: 10,
            def: 5,
            exp: 10,
            coins: 10
        });
    };
    EvilBear.prototype = Object.create(Entity.prototype);
    EvilBear.prototype.constructor = EvilBear;
    entity.EvilBear = EvilBear;

    if (window.rpg === undefined) {
        window.rpg = {};
    }
    window.rpg.entity = entity;
})(window);