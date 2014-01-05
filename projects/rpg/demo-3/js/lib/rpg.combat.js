/** @jsx React.DOM */
(function(window, undefined) {

    var combat = {};

    // TODO(richard-to): Need to make sure util loaded. Time to use RequireJS?
    var util = rpg.util;
    var Control = util.Control;


    var EnemyMenu = React.createClass({displayName: 'EnemyMenu',
        getInitialState: function() {
            return {
                enemies: new util.CircularList(this.props.enemies.asArray()),
                ignoreHover: false
            };
        },
        componentDidMount: function() {
            $(window).on('rpg:keyup.menu', this.handleKeyUp);
             this.props.onEnemyHover(this.state.enemies.getCurrent());
        },
        componentWillUnmount: function() {
            $(window).off('rpg:keyup.menu');
        },
        handleKeyUp: function(e, key) {
            var enemies = this.state.enemies;
            if (key == Control.UP) {
                enemies.prev();
                this.props.onEnemyHover(enemies.getCurrent());
                this.setState({enemies: enemies, ignoreHover: true});
            } else if (key == Control.DOWN) {
                enemies.next();
                this.props.onEnemyHover(enemies.getCurrent());
                this.setState({enemies: enemies, ignoreHover: true});
            } else if (key == Control.ENTER) {
                this.handleClick(enemies.getCurrent());
            }
        },
        handleClick: function(entity) {
            this.props.onEnemySelect(entity);
        },
        handleHover: function(entity) {
            if (entity === null) {
                this.setState({ignoreHover: false});
                return;
            }

            if (this.state.ignoreHover) {
                return;
            }

            var enemies = this.state.enemies;
            enemies.setCurrent(entity);
            this.props.onEnemyHover(entity);
        },
        render: function() {
            var self = this;
            var selectedEnemy = this.state.enemies.getCurrent();
            var createItem = function(entity) {
                if (entity == selectedEnemy) {
                    return (
                        React.DOM.li(
                            {className:"selected",
                            onClick:self.handleClick.bind(self, entity),
                            onMouseEnter:self.handleHover.bind(self, entity),
                            onMouseLeave:self.handleHover.bind(self, null)}, 
                            React.DOM.h3( {className:"skill-name"}, entity.attr.name)
                        )
                    );
                } else {
                    return (
                        React.DOM.li(
                            {onClick:self.handleClick.bind(self, entity),
                            onMouseEnter:self.handleHover.bind(self, entity),
                            onMouseLeave:self.handleHover.bind(self, null)}, 
                            React.DOM.h3( {className:"skill-name"}, entity.attr.name)
                        )
                    );
                }
            };
            return (
                React.DOM.div( {className:"menu-wrap entity-wrap"}, 
                    React.DOM.ul( {className:"menu-tabs"}, 
                        React.DOM.li( {className:"menu-tab-selected"}, "Enemies")
                    ),
                    React.DOM.ul( {className:"menu-list"}, 
                        this.state.enemies.asArray().map(createItem)
                    )
                )
            );
        }
    });
    combat.EnemyMenu = EnemyMenu;


    var ActionMenu = React.createClass({displayName: 'ActionMenu',
        getInitialState: function() {
            return {
                ignoreHover: false,
                actions: new util.CircularList(this.props.actions)
            };
        },
        componentDidMount: function() {
            $(window).on('rpg:keyup.menu', this.handleKeyUp);
        },
        componentWillUnmount: function() {
            $(window).off('rpg:keyup.menu');
        },
        handleKeyUp: function(e, key) {
            var actions = this.state.actions;
            if (key == Control.UP) {
                actions.prev();
                this.setState({actions: actions, ignoreHover: true});
            } else if (key == Control.DOWN) {
                actions.next();
                this.setState({actions: actions, ignoreHover: true});
            } else if (key == Control.ENTER) {
                this.handleSelectAction(actions.getCurrent());
            }
        },
        handleHover: function(action) {
            if (action === null) {
                this.setState({ignoreHover: false});
                return;
            }

            if (this.state.ignoreHover) {
                return;
            }

            var actions = this.state.actions;
            actions.setCurrent(action);
            this.setState({actions: actions});
        },
        handleSelectAction: function(action) {
            // TODO(richard-to): Currently all actions selected will be handled as attack
            this.props.onActionSelect(action);
        },
        render: function() {
            var self = this;
            var selectedAction = this.state.actions.getCurrent();
            var createItem = function(action) {
                if (action.attr.name == selectedAction.attr.name) {
                    return (
                        React.DOM.li(
                            {className:"selected",
                            onClick:self.handleSelectAction.bind(self, action),
                            onMouseEnter:self.handleHover.bind(self, action),
                            onMouseLeave:self.handleHover.bind(self, null)}, 
                            React.DOM.h3( {className:"skill-name"}, action.attr.name, " Level ", action.attr.lvl),
                            React.DOM.p( {className:"skill-description"}, action.attr.description)
                        )
                    );
                } else {
                    return (
                        React.DOM.li(
                            {onClick:self.handleSelectAction.bind(self, action),
                            onMouseEnter:self.handleHover.bind(self, action),
                            onMouseLeave:self.handleHover.bind(self, null)}, 
                            React.DOM.h3( {className:"skill-name"}, action.attr.name, " Level ", action.attr.lvl),
                            React.DOM.p( {className:"skill-description"}, action.attr.description)
                        )
                    );
                }
            };
            return (
                React.DOM.div( {className:"menu-wrap skill-wrap"}, 
                    React.DOM.ul( {className:"menu-tabs"}, 
                        React.DOM.li( {className:"menu-tab-selected"}, "Skills"),
                        React.DOM.li(null, "Items")
                    ),
                    React.DOM.ul( {className:"menu-list"}, 
                        this.state.actions.asArray().map(createItem)
                    )
                )
            );
        }
    });
    combat.ActionMenu = ActionMenu;


    var BattleMenu = React.createClass({displayName: 'BattleMenu',
        getInitialState: function() {
            return {
                messages: new util.CircularList(this.props.messages),
            };
        },
        componentDidMount: function() {
            $(window).on('rpg:keyup.menu', this.handleKeyUp);
        },
        componentWillUnmount: function() {
            $(window).off('rpg:keyup.menu');
        },
        handleKeyUp: function(e, key) {
            if (key == Control.ENTER) {
                this.handleNextMsg();
            }
        },
        handleNextMsg: function() {
            if (!this.state.messages.isLast()) {
                var messages = this.state.messages;
                messages.next();
                this.setState({
                    messages: messages
                });
            } else if (!this.props.heroes.isEmpty()) {
                this.props.onMsgsRead();
            }
        },
        render: function() {
            return (
                React.DOM.div( {className:"battle-result-wrap overlay-wrap", onClick:this.handleNextMsg}, 
                    this.state.messages.getCurrent()
                )
            );
        }
    });
    combat.BattleMenu = BattleMenu;


    var MathMenu = React.createClass({displayName: 'MathMenu',
        getInitialState: function() {
            var problemSet = this.props.action.select();
            problemSet.nextProblem();
            return {
                problemSet: problemSet
            };
        },
        componentDidMount: function() {
            this.refs.answer.getDOMNode().focus();
        },
        handleAnswer: function(e) {
            if (e.which == Control.ENTER || e.type === 'click') {
                this.state.problemSet.validate(this.refs.answer.getDOMNode().value);
                if (this.state.problemSet.empty()) {
                    this.props.onAnsweredProblem(
                        this.props.action.calcAttack(this.state.problemSet));
                } else {
                    this.refs.answer.getDOMNode().value = "";
                    this.state.problemSet.nextProblem();
                    this.setState({
                        problemSet: this.state.problemSet
                    });
                }
            }
        },
        render: function() {
            var self = this;
            var action = this.props.action;
            var attempted = this.state.problemSet.attempted;
            var correct = this.state.problemSet.correct;

            var steps = _.range(1, action.attr.numProblems + 1);

            var displaySteps = function(step) {
                if (step === attempted) {
                    return (React.DOM.td( {className:"step-current"}, step));
                } else {
                    return (React.DOM.td(null, step));
                }
            };

            var displayMeter = function(step) {
                if (step <= correct) {
                    return (React.DOM.td( {className:"meter-fill"}));
                } else {
                    return (React.DOM.td(null));
                }
            };
            // TODO(richard-to): After all problems answered hide last problem to prevent accidental input
            return (
                React.DOM.div( {className:"problem-wrap menu-wrap"}, 
                    React.DOM.div( {className:"skill-header"}, 
                        React.DOM.h3( {className:"skill-name"}, action.attr.name, " Level ", action.attr.lvl),
                        React.DOM.p( {className:"skill-description"}, 
                            action.attr.description
                        )
                    ),
                    React.DOM.div( {className:"steps-wrap"}, 
                        React.DOM.table( {className:"step-tabs"}, 
                            React.DOM.tr(null, 
                                steps.map(displaySteps)
                            )
                        ),
                        React.DOM.p( {className:"step-description"}, this.state.problemSet.instructions())
                    ),
                   React.DOM.div( {className:"meter-wrap"}, 
                        React.DOM.table(null, 
                            React.DOM.tr(null, 
                                steps.map(displayMeter)
                            )
                        )
                    ),
                    React.DOM.div( {className:"problem-space"}, 
                        React.DOM.span( {className:"problem-text"}, 
                            this.state.problemSet.display()
                        ),
                        React.DOM.input( {type:"text", ref:"answer", onKeyUp:this.handleAnswer} ),
                        React.DOM.input( {type:"submit", value:"Perform Step", onClick:this.handleAnswer} )
                    )
                )
            );
        }
    });

    var PartyMenu = React.createClass({displayName: 'PartyMenu',
        render: function() {
            var selectedEntity = this.props.selected;
            var createItem = function(entity) {
                if (entity.isDead()) {
                    return React.DOM.tr(null);
                }

                if (selectedEntity == entity) {
                    return (
                        React.DOM.tr(null, 
                            React.DOM.td( {className:"name selected"}, entity.attr.name),
                            React.DOM.td( {className:"hp"}, entity.attr.hp,"/",entity.attr.hpMax),
                            React.DOM.td( {className:"mp"}, entity.attr.mp,"/",entity.attr.mpMax)
                        )
                    );
                } else {
                    return (
                        React.DOM.tr(null, 
                            React.DOM.td( {className:"name"}, entity.attr.name),
                            React.DOM.td( {className:"hp"}, entity.attr.hp,"/",entity.attr.hpMax),
                            React.DOM.td( {className:"mp"}, entity.attr.mp,"/",entity.attr.mpMax)
                        )
                    );
                }
            };
            return (
                React.DOM.div( {className:"party-wrap overlay-wrap"}, 
                React.DOM.table( {className:"entity-status"}, 
                    this.props.heroes.asArray().map(createItem)
                )
                )
            );
        }
    });
    combat.PartyMenu = PartyMenu;


    var MenuContext = {
        NO_ACTIONS: 0,
        SELECT_ACTION: 1,
        SELECT_ENEMY: 2,
        SHOW_RESULTS: 3,
        SHOW_MATH: 4
    };

    var App = React.createClass({displayName: 'App',
        getInitialState: function() {
            var sprites = new util.EntityHashTable();
            sprites.addFromArrays(this.props.heroes, this.props.heroSprites)
                .addFromArrays(this.props.enemies, this.props.enemySprites);
            // TODO(richard-to): Temp fix for now
            var heroes = new util.CircularList(this.props.heroes);
            return {
                showActions: MenuContext.SELECT_ACTION,
                action: null,
                enemies: new util.CircularList(this.props.enemies),
                heroes: heroes.filter(function(hero) { return !hero.isDead(); }),
                sprites: sprites,
                messages: []
            };
        },
        componentDidMount: function() {
            var sprite = this.state.sprites.get(this.state.heroes.getCurrent());
            sprite.showHighlight();
        },
        handleMsgsRead: function() {
            this.props.onBattleFinished();
        },
        handleActionSelect: function(action) {
            this.setState({
                action: action,
                showActions: MenuContext.SELECT_ENEMY});
        },
        handleEnemySelect: function(target) {
            this.setState({
                showActions: MenuContext.SHOW_MATH,
                target: target
            });
        },
        handleAnsweredProblem: function(success) {
            var self = this;
            var heroes = this.state.heroes;
            var enemies = this.state.enemies;
            var sprites = this.state.sprites;
            var target = this.state.target;

            this.setState({
                showActions: MenuContext.NO_ACTIONS,
                target: null
            });

            var hero = heroes.getCurrent();
            var attackDamage = (success) ? target.takeDamage(hero.attack(success)) : 0;
            var heroSprite = sprites.get(hero);

            heroSprite.hideHighlight();
            heroSprite.attackLeft(function() {
                enemies.reset();
                while (true) {
                    var enemy = enemies.getCurrent();
                    var enemySprite = sprites.get(enemy);

                    enemySprite.hideHighlight();
                    if (enemy == target) {
                        enemySprite.showDamage(attackDamage);
                    }

                    if (enemy.isDead()) {
                        enemySprite.faint();
                    }

                    if (enemies.isLast()) {
                        break;
                    } else {
                        enemies.next();
                    }
                }

                if (target.isDead()) {
                    enemies.remove(target);
                }

                self.setState({
                    heroes: heroes,
                    enemies: enemies
                });

                if (enemies.isEmpty()) {
                    // TODO(richard-to): Clean this up. Also exp, coins need to be added
                    // appropriately
                    var expGained = 0;
                    var coinsEarned = 0;
                    for (var i = 0; i < self.props.enemies.length; i++) {
                        expGained += self.props.enemies[i].attr.exp;
                        coinsEarned += self.props.enemies[i].attr.coins;
                    }
                    self.setState({
                        messages: [
                            "You gained " + expGained + " exp.",
                            "You earned " + coinsEarned + " coins."
                        ],
                        showActions: MenuContext.SHOW_RESULTS
                    });
                } else if (heroes.isLast()) {
                    heroes.reset();
                    enemies.reset();
                    self.runEnemyAttackSequence();
                } else {
                    heroes.next();
                    nextHeroSprite = sprites.get(heroes.getCurrent());
                    nextHeroSprite.showHighlight();
                    self.setState({
                        showActions: MenuContext.SELECT_ACTION
                    });
                }
            });
        },
        runEnemyAttackSequence: function() {
            var self = this;
            var heroes = this.state.heroes;
            var enemies = this.state.enemies;
            var sprites = this.state.sprites;

            var enemy = enemies.getCurrent();
            var target = heroes.getRandom();
            var attackDamage = target.takeDamage(enemy.attack());
            var enemySprite = sprites.get(enemy);

            enemySprite.attackRight(function() {
                var heroToRemove = null;
                while (true) {
                    var hero = heroes.getCurrent();
                    var heroSprite = sprites.get(hero);

                    if (hero == target) {
                        heroSprite.showDamage(attackDamage);
                    }

                    if (hero.isDead()) {
                        heroSprite.faint();
                        heroToRemove = hero;
                    }

                    if (heroes.isLast()) {
                        break;
                    } else {
                        heroes.next();
                    }
                }

                heroes.remove(heroToRemove);

                if (heroes.isEmpty()) {
                    // TODO(richard-to): For now the game just freezes when you lose.
                    self.setState({
                        messages: [
                            "You lost. Reload to restart the game."
                        ],
                        showActions: MenuContext.SHOW_RESULTS
                    });
                } else if (enemies.isLast()) {
                    enemies.reset();
                    heroes.reset();
                    var nextHeroSprite = sprites.get(heroes.getCurrent());
                    nextHeroSprite.showHighlight();
                    self.setState({
                        showActions: MenuContext.SELECT_ACTION,
                        heroes: heroes,
                        enemies: enemies
                    });
                } else {
                    enemies.next();
                    self.runEnemyAttackSequence();
                }
            });
        },
        handleEnemyHover: function(entity) {
            var enemies = this.state.enemies;
            if (enemies.isEmpty()) {
                return;
            }
            enemies.reset();
            while (true) {
                var enemy = enemies.getCurrent();
                var sprite = this.state.sprites.get(enemy);
                if (enemy === entity) {
                    sprite.showHighlight();
                } else {
                    sprite.hideHighlight();
                }

                if (enemies.isLast()) {
                    break;
                } else {
                    enemies.next();
                }
            }
        },
        render: function() {
            if (this.state.showActions == MenuContext.SELECT_ACTION) {
                return (
                    React.DOM.div( {className:"combat-wrap"}, 
                        PartyMenu(
                            {heroes:this.state.heroes,
                            selected:this.state.heroes.getCurrent()} ),
                        ActionMenu(
                            {onActionSelect:this.handleActionSelect,
                            actions:this.state.heroes.getCurrent().getActions()} )
                    )
                );
            } else if (this.state.showActions == MenuContext.SELECT_ENEMY) {
                return (
                    React.DOM.div( {className:"combat-wrap"}, 
                        PartyMenu(
                            {heroes:this.state.heroes,
                            selected:this.state.heroes.getCurrent()} ),
                        EnemyMenu(
                            {enemies:this.state.enemies,
                            onEnemySelect:this.handleEnemySelect,
                            onEnemyHover:this.handleEnemyHover} )
                    )
                );
            } else if (this.state.showActions == MenuContext.SHOW_RESULTS) {
                return (
                    React.DOM.div( {className:"combat-wrap"}, 
                        BattleMenu(
                            {messages:this.state.messages,
                            heroes:this.state.heroes,
                            onMsgsRead:this.handleMsgsRead} )
                    )
                    );
            } else if (this.state.showActions == MenuContext.SHOW_MATH) {
                return (
                    React.DOM.div( {className:"combat-wrap"}, 
                        PartyMenu(
                            {heroes:this.state.heroes,
                            selected:this.state.heroes.getCurrent()} ),
                        MathMenu(
                            {action:this.state.action,
                            onAnsweredProblem:this.handleAnsweredProblem} )
                    )
                );
            } else {
                return (
                    React.DOM.div( {className:"combat-wrap"}, 
                        PartyMenu( {heroes:this.state.heroes} ),
                        MathMenu(
                            {action:this.state.action,
                            onAnsweredProblem:this.handleAnsweredProblem} )
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