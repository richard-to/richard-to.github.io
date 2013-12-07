/** @jsx React.DOM */
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
        if (this.attr.hp < 0) {
            this.attr.hp = 0;
        }
    };

    Entity.prototype.isDead = function() {
        return this.prototype.hp == 0;
    };

    var Enemy = function(option) {
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

    var Player = function(option) {
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

    var ActionMenu = React.createClass({displayName: 'ActionMenu',
        render: function() {
            return (
                React.DOM.table( {className:"action-status"}, 
                    React.DOM.tr(null, 
                        React.DOM.td(null, "Attack"),
                        React.DOM.td(null, "Defend")
                    ),
                    React.DOM.tr(null, 
                        React.DOM.td(null, "Magic"),
                        React.DOM.td(null, "Items")
                    ),
                    React.DOM.tr(null, 
                        React.DOM.td(null, "Run")
                    )
                )
            );
        }
    });

    var HeroStats = React.createClass({displayName: 'HeroStats',
        render: function() {
            var createItem = function(hero) {
                return (
                    React.DOM.tr(null, 
                        React.DOM.td( {className:"name"}, hero.name),
                        React.DOM.td( {className:"hp"}, hero.hp,"/",hero.hp),
                        React.DOM.td( {className:"mp"}, hero.mp,"/",hero.mp)
                    )
                )
            };
            return (
                React.DOM.table( {className:"hero-status"}, 
                    React.DOM.tr(null, React.DOM.td(null),React.DOM.td(null, "HP"),React.DOM.td(null, "MP")),
                    this.props.items.map(createItem)
                )
            );
        }
    });

    var HeroStatsApp = React.createClass({displayName: 'HeroStatsApp',
        getInitialState: function() {
            return {
                items: [
                    {name: "Character 1", hp: 100, mp: 50},
                    {name: "Character 2", hp: 200, mp: 30},
                    {name: "Character 3", hp: 990, mp: 15}
                ]
            };
        },
        render: function() {
            return (
                HeroStats( {items:this.state.items} )
            );
        }
    });

    var hero = new Player();
    React.renderComponent(
        HeroStatsApp(null ),
        document.getElementById('menu-wrap')
    );

    React.renderComponent(
        ActionMenu(null ),
        document.getElementById('action-wrap')
    );

})(window);
