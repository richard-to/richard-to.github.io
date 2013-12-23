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

    var EnemyMenu = React.createClass({displayName: 'EnemyMenu',
        render: function() {
            var className = "";
            if (this.props.showEnemy == false) {
                className += "hide-menu";
            }
            return(
                React.DOM.div( {id:"enemy-wrap", className:className}, 
                React.DOM.table( {className:"hero-status"}, 
                    React.DOM.tr(null, React.DOM.td(null),React.DOM.td(null, "HP"),React.DOM.td(null, "MP")),
                    React.DOM.tr(null, 
                        React.DOM.td( {className:"name"}, this.props.enemy.attr.name),
                        React.DOM.td( {className:"hp"}, this.props.enemy.attr.hp,"/",this.props.enemy.attr.hpMax),
                        React.DOM.td( {className:"mp"}, this.props.enemy.attr.mp,"/",this.props.enemy.attr.mpMax)
                    )
                )
                )
            );
        }
    });


    var ActionMenu = React.createClass({displayName: 'ActionMenu',
        getInitialState: function() {
            return {show: true};
        },
        handleAttack: function(event) {
            this.setState('showAction', true);
            this.props.showAction = false;
        },
        render: function() {
            if (this.props.showAction) {
                return (
                    React.DOM.div( {id:"action-wrap"}, 
                    React.DOM.table( {className:"action-status"}, 
                        React.DOM.tr(null, 
                            React.DOM.td( {onClick:this.handleAttack}, "Attack"),
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
                    )
                );
            } else {
                return EnemyMenu( {enemy:this.props.enemy, showEnemy:this.state.showEnemy} );
            }
        }
    });

    var HeroStats = React.createClass({displayName: 'HeroStats',
        render: function() {
            var createItem = function(hero) {
                return (
                    React.DOM.tr(null, 
                        React.DOM.td( {className:"name"}, hero.attr.name),
                        React.DOM.td( {className:"hp"}, hero.attr.hp,"/",hero.attr.hpMax),
                        React.DOM.td( {className:"mp"}, hero.attr.mp,"/",hero.attr.mpMax)
                    )
                )
            };
            return (
                React.DOM.div( {id:"menu-wrap"}, 
                React.DOM.table( {className:"hero-status"}, 
                    React.DOM.tr(null, React.DOM.td(null),React.DOM.td(null, "HP"),React.DOM.td(null, "MP")),
                    this.props.items.map(createItem)
                )
                )
            );
        }
    });

    var HeroStatsApp = React.createClass({displayName: 'HeroStatsApp',
        getInitialState: function() {
            return {showAction: true, showEnemy: false};
        },
        render: function() {
            return (
                React.DOM.div(null, 
                    ActionMenu( {showAction:this.state.showAction} ),
                    HeroStats( {items:this.props.players} )
                )
            );
        }
    });

    var enemy = new Enemy({name: "Orc"});
    var hero = new Player({name: "Hero"});

    var players = [hero];

    React.renderComponent(
        HeroStatsApp( {players:players, enemy:enemy} ),
        document.getElementById('game-wrap-2')
    );

})(window);
