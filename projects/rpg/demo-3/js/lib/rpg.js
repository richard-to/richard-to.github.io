/** @jsx React.DOM */
(function(window, undefined) {

    var rpg = window.rpg;
    var combat = rpg.combat;
    var graphics = rpg.graphics;
    var entities = rpg.entities;
    var util = rpg.util;

    var Control = util.Control;


    // Animation loop. Draws sprites and backgrounds in a continous loop.
    var AnimLoop = function(ctx, canvas, level) {
        this.animStopped = false;
        this.keyWait = false;
        this.ctx = ctx;
        this.canvas = canvas;
        this.heroSprite = level.heroSprite;
        this.sprites = level.sprites;
        this.bgRenderer = level.bgRenderer;
        this.spriteRenderer = level.spriteRenderer;
    };

    // Animate is called recursively unless the animation loop is explicitly
    // stopped using this.animStopped.
    AnimLoop.prototype.animate = function() {
        if (this.animStopped) {
            return;
        }
        var self = this;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.bgRenderer.draw(this.ctx, this.heroSprite.getX(), this.heroSprite.getY());

        this.sprites.forEach(function(sprite) {
            self.spriteRenderer.draw(self.ctx, sprite);
        });

        this.sprites.forEach(function(sprite) {
            if (sprite == self.heroSprite && !sprite.hasFrames()) {
                self.keyWait = false;
            }

            if (!sprite.hasFrames() && sprite.callback) {
                sprite.callback();
                sprite.callback = null;
            }
        });

        requestAnimationFrame(function() {
            self.animate();
        });
    };
    rpg.AnimLoop = AnimLoop;


    var GameDungeon = function(levelMediator, party, datastore, options) {
        this.levelMediator = levelMediator;
        this.party = party;
        this.datastore = datastore;

        this.options = options;

        this.ctx = this.options.ctx;
        this.canvas = this.options.canvas;
        this.screen = this.options.screen;
        this.assets = this.options.assets.dungeon;
        this.levelData = this.options.levelData.dungeon;
        this.playerData = this.options.playerData;

        this.heroList = this.options.heroList;
        this.heroFrames = this.options.heroFrames;
        this.enemyList = this.options.enemyList;
        this.enemyFrames = this.options.enemyFrames;

        this.map = null;
        this.spritemeta = null;
        this.spritesheet = null;

        this.tileFactory = null;
        this.bgRenderer = null;
        this.spriteRenderer = null;

        this.sprites = [];
        this.heroSprite = null;
        this.animLoop = null;
    };

    // Loads necessary assets.
    GameDungeon.prototype.load = function() {
        var self = this;
        var assets = this.assets;
        var datastore = this.datastore;
        datastore.load(assets, function() {
            for (var key in assets) {
                if (self[key] === null) {
                    self[key] = datastore.get(assets[key]);
                }
            }
            self.onAssetsLoad();
        });
    };

    // Once external assets are loaded, everything else is initialized.
    // TODO(richard-to): Clean up reloading dungeon/battles multiple times
    GameDungeon.prototype.onAssetsLoad = function() {
        if (this.tileFactory == null) {
            this.initTiles();
        }
        if (this.spriteRenderer == null) {
            this.initSprites();
        }

        if (this.heroSprite == null) {
            this.initHero();
        }

        // TODO(richard-to): Move this elsewhere. Why passing in whole object?
        this.animLoop = new AnimLoop(this.ctx, this.canvas, this);
        this.animLoop.animate();
        $(window).on('rpg:keydown.dungeon', this.onKeyDown.bind(this));
    };

    // Initializes tiles and background renderer.
    GameDungeon.prototype.initTiles = function() {
        var tileList = this.options.tileList;
        this.tileFactory = [];

        for (var i = 0; i < tileList.length; i++) {
            this.tileFactory.push(new graphics.SpriteTile(
                this.spritemeta.frames[tileList[i]].frame, this.spritesheet));
        }
        this.bgRenderer = new graphics.BgRenderer(
            this.map, this.tileFactory, this.options.screen);
    };

    // Initializes sprite renderer.
    GameDungeon.prototype.initSprites = function() {
        this.spriteRenderer = new graphics.SpriteRenderer(
            this.map, this.spritesheet, this.screen);
    };

    // Initializes hero sprite.
    GameDungeon.prototype.initHero = function() {
        var playerData = this.playerData;
        var levelData = this.levelData;
        var heroFrames = this.heroFrames[playerData.leader];
        var frames = {};
        for (var name in heroFrames) {
            frames[name] = this.spritemeta.frames[heroFrames[name]]
        }
        this.heroSprite = new graphics.SpriteAnim(frames, this.map);
        this.heroSprite.x = levelData.start.x;
        this.heroSprite.y = levelData.start.y;
        this.heroSprite.faceRight();
        this.sprites.unshift(this.heroSprite);
    };

    GameDungeon.prototype.suspend = function() {
        // TODO(richard-to): Need a good way to create unique identifiers. Use underscore uniqueId?
        $(window).off('.dungeon');
        if (this.animLoop) {
            this.animLoop.animStopped = true;
        }
    };

    // Handles controls for this aspect of the game.
    GameDungeon.prototype.onKeyDown = function(e, key) {
        if (this.animLoop.keyWait) {
            return;
        }

        if (Math.random() < this.levelData.combatProbability
            && (key == Control.RIGHT || key == Control.LEFT ||
                key == Control.UP || key == Control.DOWN)
            ) {
            this.levelMediator.load('arena');
            return;
        }
        if (key == Control.RIGHT) {
            this.moveRight();
        } else if (key == Control.LEFT) {
            this.moveLeft();
        } else if (key == Control.UP) {
            this.moveUp();
        } else if (key == Control.DOWN) {
            this.moveDown();
        } else {
            return;
        }

        this.animLoop.keyWait = true;
    };

    GameDungeon.prototype.isPath = function(tile) {
        var walkableTiles = this.levelData.walkableTiles;
        for (var i = 0; i < walkableTiles.length; i++) {
            if (tile == walkableTiles[i]) {
                return true;
            }
        }
        return false;
    };

    GameDungeon.prototype.moveRight = function() {
        var y = this.heroSprite.y;
        var x = this.heroSprite.x + 1;
        if (x < this.map[0].length && this.isPath(this.map[y][x])) {
            this.heroSprite.moveRight();
        } else {
            this.heroSprite.faceRight();
        }
    };

    GameDungeon.prototype.moveLeft = function() {
        var y = this.heroSprite.y;
        var x = this.heroSprite.x - 1;

        if (x >= 0 && this.isPath(this.map[y][x])) {
            this.heroSprite.moveLeft();
        } else {
            this.heroSprite.faceLeft();
        }
    };

    GameDungeon.prototype.moveUp = function() {
        var y = this.heroSprite.y - 1;
        var x = this.heroSprite.x;
        if (y >= 0 && this.isPath(this.map[y][x])){
            this.heroSprite.moveUp();
        } else {
            this.heroSprite.faceUp();
        }
    };

    GameDungeon.prototype.moveDown = function() {
        var y = this.heroSprite.y + 1;
        var x = this.heroSprite.x;
        if (y < this.map.length && this.isPath(this.map[y][x])) {
            this.heroSprite.moveDown();
        } else {
            this.heroSprite.faceDown();
        }
    };
    rpg.GameDungeon = GameDungeon;


    // Loads the combat aspect of the game.
    var GameArena = function(levelMediator, party, datastore, options) {
        this.levelMediator = levelMediator;
        this.party = party;
        this.datastore = datastore;

        this.options = options;

        this.ctx = this.options.ctx;
        this.canvas = this.options.canvas;
        this.screen = this.options.screen;
        this.assets = this.options.assets.arena;
        this.levelData = this.options.levelData.arena;
        this.playerData = this.options.playerData;

        this.heroList = this.options.heroList;
        this.heroFrames = this.options.heroFrames;
        this.enemyList = this.options.enemyList;
        this.enemyFrames = this.options.enemyFrames;

        this.map = null;
        this.spritemeta = null;
        this.spritesheet = null;

        this.tileFactory = null;
        this.bgRenderer = null;
        this.spriteRenderer = null;

        this.sprites = [];
        this.partySprites = [];
        this.enemySprites = [];
        this.enemies = null;

        this.menu = null;

        this.animLoop = null;
    };

    // Loads the assets needed to run this aspect of the game.
    GameArena.prototype.load = function() {
        var assets = this.assets;
        var datastore = this.datastore;
        var self = this;
        datastore.load(assets, function() {
            for (var key in assets) {
                if (self[key] === null) {
                    self[key] = datastore.get(assets[key]);
                }
            }
            self.onAssetsLoad();
        });
    };

    // Once external assets are loaded, everything else is initialized.
    // Clean this up. Same with Dungeon class here too
    GameArena.prototype.onAssetsLoad = function() {
        this.sprites = [];
        this.partySprites = [];
        this.enemySprites = [];

        if (this.tileFactory == null) {
            this.initTiles();
        }

        if (this.spriteRenderer == null) {
            this.initSprites();
        }

        this.initHero();
        this.initParty();
        this.initEnemies();
        this.initMenu();

        // TODO(richard-to): Move this elsewhere. Why passing in whole object?
        this.animLoop = new AnimLoop(this.ctx, this.canvas, this);
        this.animLoop.animate();
    };

    // Initializes tiles and background renderer.
    GameArena.prototype.initTiles = function() {
        var tileList = this.options.tileList;
        this.tileFactory = [];

        for (var i = 0; i < tileList.length; i++) {
            this.tileFactory.push(new graphics.SpriteTile(
                this.spritemeta.frames[tileList[i]].frame, this.spritesheet));
        }

        this.bgRenderer = new graphics.BgRenderer(
            this.map, this.tileFactory, this.screen);
    };

    // Initializes sprite renderer.
    GameArena.prototype.initSprites = function() {
        this.spriteRenderer = new graphics.SpriteRenderer(
            this.map, this.spritesheet, this.screen);
    };

    // Initializes hero sprite.
    GameArena.prototype.initHero = function() {
        var playerData = this.playerData;
        var levelData = this.levelData;
        var heroFrames = this.heroFrames[playerData.leader];
        var frames = {};
        for (var name in heroFrames) {
            frames[name] = this.spritemeta.frames[heroFrames[name]];
        }
        this.heroSprite = new graphics.SpriteAnim(frames);
        this.heroSprite.x = 8;
        this.heroSprite.y = 2;
        this.heroSprite.faceLeft();
        this.partySprites.unshift(this.heroSprite);
        // TODO(richard-to): Is Alive instead?
        if (!this.party[0].isDead()) {
            this.sprites.unshift(this.heroSprite);
        }
    };

    // Initializes party members.
    // TODO(richard-to): Needs fixing
    GameArena.prototype.initParty = function() {
        var party = this.playerData.party;
        for (var i = 0; i < party.length; i++) {
            if (!this.party[i + 1].isDead()) {
                var frames = {};
                for (var name in this.heroFrames[party[i]]) {
                    frames[name] = this.spritemeta.frames[this.heroFrames[party[i]][name]];
                }
                var partyMember = new graphics.SpriteAnim(frames, this.map);
                partyMember.x = 8;
                partyMember.y = 2 + (i + 1) * 2;
                partyMember.faceLeft();
                this.partySprites.push(partyMember);
                this.sprites.unshift(partyMember);
            }
        }
    };

    // Initializes enemies.
    GameArena.prototype.initEnemies = function() {
        var maxEnemies = 2;
        var numEnemies = Math.floor((Math.random() * maxEnemies) + 1);
        var enemies = [];
        var enemySprites = [];
        var x = 1;
        var y = 2;
        for (var i = 0; i < numEnemies; i++) {
            var enemyType = (Math.floor((Math.random() * this.enemyList.length)));
            var enemyFrame = this.enemyFrames[enemyType];
            enemies.push(new this.enemyList[enemyType]());
            var enemySprite = new graphics.SpriteEnemy(this.spritemeta.frames[enemyFrame]);
            enemySprite.x = x;
            enemySprite.y = y;
            enemySprite.faceRight();
            enemySprites.push(enemySprite);
            this.sprites.unshift(enemySprite);
            x += 1;
            y += 2;
        }
        this.enemies = enemies;
        this.enemySprites = enemySprites;
    };

    // Initializes combat menu.
    GameArena.prototype.initMenu = function() {
        var handleBattleFinished = this.handleBattleFinished.bind(this);
        var CombatApp = rpg.combat.App;
        this.menu = React.renderComponent(
            CombatApp(
                {onBattleFinished:handleBattleFinished,
                heroes:this.party,
                enemies:this.enemies,
                heroSprites:this.partySprites,
                enemySprites:this.enemySprites} ),
            this.levelData.menuDiv
        );
    };

    GameArena.prototype.handleBattleFinished = function() {
        React.unmountComponentAtNode(this.levelData.menuDiv);
        this.levelMediator.load('dungeon');
    };

    GameArena.prototype.suspend = function() {
        if (this.animLoop) {
            this.animLoop.animStopped = true;
        }
    };

    rpg.GameArena = GameArena;


    var GameLevel = function(datastore, party, options) {
        this.options = $.extend(true, {
            screen: {},
            ctx: null,
            canvas: null,
            assets: {
                dungeon: {
                    map: '',
                    spritesheet: '',
                    spritemeta: ''
                },
                arena: {
                    map: '',
                    spritesheet: '',
                    spritemeta: ''
                }
            },
            tileList: {},
            heroList: {},
            heroFrames: {},
            enemyList: [],
            enemyFrames: [],
            playerData: {
                leader: '',
                party: [],
            },
            levelData: {
                dungeon: {
                    start: {x: 0 , y: 0},
                    walkableTiles: [],
                    combatProbability: 0.0
                },
                arena: {
                    start: {x: 0 , y: 0},
                    menuDiv: ''
                }
            }
        }, options);

        this.datastore = datastore;
        this.party = party;

        // TODO(richard-to): Make this a stack? Mostly yes, but not now.
        this.currentScene = null;

        var levelMediator = {
            load: this.load.bind(this)
        };
        this.dungeon = new GameDungeon(levelMediator, this.party, this.datastore, this.options);
        this.arena = new GameArena(levelMediator, this.party, this.datastore, this.options);
    };

    GameLevel.prototype.run = function() {
        this.loadDungeon();
    };

    GameLevel.prototype.load = function(scene) {
        if (scene === 'dungeon') {
            this.loadDungeon();
        } else if (scene === 'arena') {
            this.loadArena();
        }
    }
    // Loads exploration mode.
    GameLevel.prototype.loadDungeon = function() {
        if (this.currentScene) {
            this.currentScene.suspend();
        }
        this.dungeon.load();
        this.currentScene = this.dungeon;
    };

    // Loads combat mode.
    GameLevel.prototype.loadArena = function() {
        if (this.currentScene) {
            this.currentScene.suspend();
        }
        this.arena.load();
        this.currentScene = this.arena;
    };
    rpg.GameLevel = GameLevel;


    // Game Engine is the main controller for swapping out levels, managing
    // animation, delegate key events. Need to make this thinner.
    var GameEngine = function(el, options) {
        this.options = options;

        this.datastore = new util.Datastore();
        this.el = el;
        this.$el = $(el);

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.screen.width;
        this.canvas.height = this.options.screen.height;

        this.ctx = this.canvas.getContext('2d');
        this.el.appendChild(this.canvas);

        this.party = [];
        for (key in this.options.heroList) {
            this.party.push(new this.options.heroList[key]());
        }

        this.options.canvas = this.canvas;
        this.options.ctx = this.ctx;

        // TODO(richard-to): Not a huge fan of passing the party array everywhere...
        this.level = new GameLevel(this.datastore, this.party, this.options);

        var self = this;
        $(window).on('keydown', function(e) {
            for (var key in Control) {
                if (Control[key] === e.which) {
                    e.preventDefault();
                    break;
                }
            }
            $.event.trigger('rpg:keydown', [e.which]);
        }).on('keyup', function(e) {
            for (var key in Control) {
                if (Control[key] === e.which) {
                    e.preventDefault();
                    break;
                }
            }
            $.event.trigger('rpg:keyup', [e.which]);
        });
    };

    // Starts the game in exploration mode.
    GameEngine.prototype.run = function() {
        this.level.run();
    };
    rpg.GameEngine = GameEngine;

})(window);