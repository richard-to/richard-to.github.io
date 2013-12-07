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
        handleClick: function(event, entity) {
            console.log(event);
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
        handleHandleEnemySelect: function(event) {
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

    React.renderComponent(
        CombatApp( {party:party, enemies:enemies} ),
        document.getElementById('game-combat-wrap')
    );

})(window);
