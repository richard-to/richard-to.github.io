/** @jsx React.DOM */
(function(window, undefined) {

    var combat = {};


    var EnemyMenu = React.createClass({displayName: 'EnemyMenu',
        handleClick: function(entity, event) {
            this.props.onEnemySelect(entity, event);
        },
        handleHover: function(entity, event) {
            this.props.onEnemyHover(entity, event);
        },

        render: function() {
            var self = this;
            var createItem = function(entity) {
                return (
                    React.DOM.tr(
                        {onClick:self.handleClick.bind(self, entity),
                        onMouseEnter:self.handleHover.bind(self, entity),
                        onMouseLeave:self.handleHover.bind(self, null)}, 
                        React.DOM.td( {className:"name"}, entity.attr.name)
                    )
                )
            };
            return (
                React.DOM.div( {className:"enemy-wrap"}, 
                React.DOM.table( {className:"entity-status"}, 
                    this.props.enemies.map(createItem)
                )
                )
            );
        }
    });
    combat.EnemyMenu = EnemyMenu;


    var ActionMenu = React.createClass({displayName: 'ActionMenu',
        handleAttack: function(event) {
            this.props.onActionSelect(event);
        },
        render: function() {
            return (
                React.DOM.div( {className:"action-wrap"}, 
                React.DOM.table( {className:"action-status"}, 
                    React.DOM.tr(null, 
                        React.DOM.td( {onClick:this.handleAttack}, "Attack")
                    ),React.DOM.tr(null, 
                        React.DOM.td(null, "Defend")
                    ),React.DOM.tr(null, 
                        React.DOM.td(null, "Magic")
                    ),React.DOM.tr(null, 
                        React.DOM.td(null, "Items")
                    ),React.DOM.tr(null, 
                        React.DOM.td(null, "Run")
                    )
                )
                )
            );
        }
    });
    combat.ActionMenu = ActionMenu;


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
                React.DOM.table( {className:"party-status"}, 
                    this.props.party.map(createItem)
                )
                )
            );
        }
    });
    combat.PartyMenu = PartyMenu;


    var App = React.createClass({displayName: 'App',
        getInitialState: function() {
            return {showActions: 1, eturn: 0, hturn: 0};
        },
        handleActionSelect: function(event) {
            this.setState({showActions: 2});
        },
        handleEnemySelect: function(entity, event) {
            var self = this;
            var hturn = this.state.hturn;
            if (hturn < this.props.party.length) {
                entity.takeDamage(this.props.party[hturn].attack());
                this.props.gameState.partyTurn = null;
                this.props.gameState.selectedEnemy = null;
                this.setState({showActions: 0});
                this.props.heroSprites[hturn].attackLeft(function() {
                    if (hturn < self.props.party.length) {
                        self.setState({showActions: 1});
                    } else {
                        self.runEnemyAttackSequence();
                    }
                });
                this.setState({hturn: ++hturn});
            }
        },
        runEnemyAttackSequence: function() {
            var self = this;
            var eturn = this.state.eturn;
            if (eturn < this.props.sprites.length) {
                this.props.party[0].takeDamage(this.props.enemies[eturn].attack());
                this.props.sprites[eturn].attackRight(this.runEnemyAttackSequence);
                this.setState({eturn: ++eturn});
            } else {
                this.setState({eturn: 0});
                this.setState({showActions: 1});
                this.setState({hturn: 0});
            }
        },
        handleEnemyHover: function(entity, event) {
            this.props.gameState.selectedEnemy = entity;
        },
        render: function() {
            if (this.state.showActions == 1) {
                return (
                    React.DOM.div( {className:"combat-wrap"}, 
                        ActionMenu( {onActionSelect:this.handleActionSelect} ),
                        PartyMenu( {party:this.props.party} )
                    )
                );
            } else if (this.state.showActions == 2) {
                return (
                    React.DOM.div( {className:"combat-wrap"}, 
                        EnemyMenu(
                            {enemies:this.props.enemies,
                            onEnemySelect:this.handleEnemySelect,
                            onEnemyHover:this.handleEnemyHover} ),
                        PartyMenu( {party:this.props.party} )
                    )
                );
            } else {
                return (
                    React.DOM.div( {className:"combat-wrap"}, 
                        PartyMenu( {party:this.props.party} )
                    )
                );
            }
        }
    });
    combat.App = App;

    if (window.rpg === undefined) {
        window.rpg = {};
    }
    window.rpg.combat = combat;
})(window);