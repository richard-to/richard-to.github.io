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

    gameEl.appendChild(canvas);

    var GameCanvas = function(ctx, party, enemies) {
        this.ctx = ctx;
        this.party = party;
        this.enemies = enemies;
    };

    GameCanvas.prototype.draw = function() {
        this.ctx.beginPath();
        this.ctx.rect(0, 0, 640, 480);
        this.ctx.fillStyle = 'black';
        this.ctx.fill();

        var py = 75;
        for (var i = 0; i < this.enemies.length; i++) {
            this.ctx.beginPath();
            this.ctx.arc(75, py, 50, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
            this.ctx.font = '14px Calibri';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(this.enemies[i].attr.name, 75-50+10, py-50+25-7);
            py += 125;
        }

        var py = 100;
        for (var i = 0; i < this.party.length; i++) {
            this.ctx.beginPath();
            this.ctx.arc(640-100, py, 50, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = 'green';
            this.ctx.fill();
            this.ctx.font = '14px Calibri';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(this.party[0].attr.name, 640-150, py+25-7);
            py += 125;
        }
    };

    var EnemyMenu = React.createClass({displayName: 'EnemyMenu',
        handleClick: function(entity, event) {
            this.props.onEnemySelect(entity, event);
        },
        render: function() {
            var self = this;
            var createItem = function(entity) {
                return (
                    React.DOM.tr( {onClick:self.handleClick.bind(self, entity)}, 
                        React.DOM.td( {className:"name"}, entity.attr.name),
                        React.DOM.td( {className:"hp"}, entity.attr.hp,"/",entity.attr.hpMax),
                        React.DOM.td( {className:"mp"}, entity.attr.mp,"/",entity.attr.mpMax)
                    )
                )
            };
            return (
                React.DOM.div( {className:"enemy-wrap"}, 
                React.DOM.table( {className:"entity-status"}, 
                    React.DOM.tr(null, React.DOM.td(null),React.DOM.td(null, "HP"),React.DOM.td(null, "MP")),
                    this.props.enemies.map(createItem)
                )
                )
            );
        }
    });

    var ActionMenu = React.createClass({displayName: 'ActionMenu',
        handleAttack: function(event) {
            this.props.onActionSelect(event);
        },
        render: function() {
            return (
                React.DOM.div( {className:"action-wrap"}, 
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
        }
    });

    var PartyMenu = React.createClass({displayName: 'PartyMenu',
        render: function() {
            var createItem = function(entity) {
                return (
                    React.DOM.tr(null, 
                        React.DOM.td( {className:"name"}, entity.attr.name),
                        React.DOM.td( {className:"hp"}, entity.attr.hp,"/",entity.attr.hpMax),
                        React.DOM.td( {className:"mp"}, entity.attr.mp,"/",entity.attr.mpMax)
                    )
                )
            };
            return (
                React.DOM.div( {className:"party-wrap"}, 
                React.DOM.table( {className:"entity-status"}, 
                    React.DOM.tr(null, React.DOM.td(null),React.DOM.td(null, "HP"),React.DOM.td(null, "MP")),
                    this.props.party.map(createItem)
                )
                )
            );
        }
    });

    var CombatApp = React.createClass({displayName: 'CombatApp',
        getInitialState: function() {
            return {showActions: true};
        },
        handleActionSelect: function(event) {
            this.setState({showActions: false});
        },
        handleEnemySelect: function(entity, event) {
            entity.takeDamage(this.props.party[0].attack());
            this.props.party[0].takeDamage(this.props.enemies[0].attack());
            this.props.party[0].takeDamage(this.props.enemies[1].attack());
            this.setState({showActions: true});
        },
        render: function() {
            if (this.state.showActions) {
                return (
                    React.DOM.div( {className:"combat-wrap"}, 
                        ActionMenu( {onActionSelect:this.handleActionSelect} ),
                        PartyMenu( {party:this.props.party} )
                    )
                );
            } else {
                return (
                    React.DOM.div( {className:"combat-wrap"}, 
                        EnemyMenu( {enemies:this.props.enemies, onEnemySelect:this.handleEnemySelect} ),
                        PartyMenu( {party:this.props.party} )
                    )
                );
            }
        }
    });

    var orc1 = new Enemy({name: "Orc 1"});
    var orc2 = new Enemy({name: "Orc 2"});
    var hero = new Player({name: "Hero"});

    var party = [hero];
    var enemies = [orc1, orc2];

    var gameCanvas = new GameCanvas(ctx, party, enemies);
    gameCanvas.draw();

    React.renderComponent(
        CombatApp( {party:party, enemies:enemies, gameCanvas:gameCanvas} ),
        document.getElementById('game-combat-wrap')
    );

})(window);
