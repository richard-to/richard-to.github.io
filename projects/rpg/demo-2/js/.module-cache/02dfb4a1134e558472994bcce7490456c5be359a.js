/** @jsx React.DOM */
(function(window, undefined) {
    var rpg = window.rpg;

    // Constants for key controls
    var Control = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        PAUSE: 13,
        ATTACK: 65
    };
    window.rpg.Control = Control;

    // Game mode that we are in. Are we exploring or in combat?
    var GameMode = {
        EXPLORE: 0,
        COMBAT: 1
    };
    window.rpg.GameMode = GameMode;

    var GameLevel = function(options, tileSize, gridWidth, gridHeight) {
        this.options = $.extend({
            assets: {
                map: 'map.json',
                spritesheet: 'sprites.png',
                spritemeta: 'sprites.json',
            },
            tiles: {
                grass: 'grass.png',
                water: 'water2.png',
                cliff: 'cliff.png'
            },
        }, options);

        this.tileSize = tileSize;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;

        this.map = null;
        this.spritemeta = null;
        this.spritesheet = null;

        this.tileLookup = null;
        this.tileFactory = null;
        this.bgRenderer = null;
        this.spriteRenderer = null;

        this.sprites = [];
        this.heroSprite = null;
    };

    GameLevel.prototype.load = function(onLoad, datastore) {
        this.tileSize = tileSize;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        var self = this;
        datastore.load(this.options.assets, function() {
            for (var key in self.options.assets) {
                if (self[key] === null) {
                    self[key] = datastore.get(self.options.assets[key]);
                }
            }
            self.onAssetsLoad();
            onLoad();
        });
    };

    // Once external assets are loaded, everything else is initialized.
    GameLevel.prototype.onAssetsLoad = function() {
        this.initTiles();
        this.initSprites();
        this.initHero();
    };

    // Loads asset data from datastore
    GameLevel.initData = function() {
        for (var key in this.options.assets) {
            if (this[key] === null) {
                this[key] = this.datastore.get(this.options.assets[key]);
            }
        }
    };

    // Initialize tiles and background renderer.
    //
    GameLevel.prototype.initTiles = function() {
        this.tileLookup = [];
        this.tileFactory = {};

        for (key in this.options.tiles) {
            this.tileLookup.push(key);
            this.tileFactory[key] =
                new rpg.graphics.SpriteTile(
                    this.spritemeta.frames[this.options.tiles[key]].frame, this.spritesheet);
        }

        this.bgRenderer = new rpg.graphics.BgRenderer(
            this.map, this.tileLookup, this.tileFactory,
            this.tileSize, this.gridWidth, this.gridHeight);
    };

    // Initialize sprite renderer.
    GameLevel.prototype.initSprites = function() {
        this.spriteRenderer = new rpg.graphics.SpriteRenderer(
            this.map, this.spritesheet,
            this.tileSize, this.gridWidth, this.gridHeight);
    };

    // Initialize hero sprite.
    GameLevel.prototype.initHero = function() {
        this.heroSprite = new rpg.graphics.SpriteAnim(this.spritemeta.frames, this.map);
        this.heroSprite.faceRight();
        this.sprites.unshift(this.heroSprite);
    };

    GameLevel.prototype.onKeydown = function(e) {
        if (e.which == Control.RIGHT) {
            this.heroSprite.moveRight();
        } else if (e.which == Control.LEFT) {
            this.heroSprite.moveLeft();
        } else if (e.which == Control.UP) {
            this.heroSprite.moveUp();
        } else if (e.which == Control.DOWN) {
            this.heroSprite.moveDown();
        } else {
            return;
        }
        e.preventDefault();
    };
    rpg.GameLevel = GameLevel;


    var CombatLevel = function(options, tileSize, gridWidth, gridHeight) {
        this.options = $.extend({
            assets: {
                map: 'combatMap.json',
                spritesheet: 'sprites.png',
                spritemeta: 'sprites.json',
            },
            tiles: {
                grass: 'grass.png',
                water: 'water2.png',
                cliff: 'cliff.png'
            },
        }, options);

        this.tileSize = tileSize;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;

        this.map = null;
        this.spritemeta = null;
        this.spritesheet = null;

        this.tileLookup = null;
        this.tileFactory = null;
        this.bgRenderer = null;
        this.spriteRenderer = null;

        this.sprites = [];
        this.partySprites = [];
        this.enemySprites = [];
        this.heroSprite = null;
    };

    CombatLevel.prototype.load = function(onLoad, datastore) {
        var self = this;
        datastore.load(this.options.assets, function() {
            for (var key in self.options.assets) {
                if (self[key] === null) {
                    self[key] = datastore.get(self.options.assets[key]);
                }
            }
            self.onAssetsLoad();
            onLoad();
        });
    };

    // Once external assets are loaded, everything else is initialized.
    CombatLevel.prototype.onAssetsLoad = function() {
        this.initTiles();
        this.initSprites();
        this.initHero();
        this.initParty();
        this.initEnemies();
        this.initMenu();
    };

    // Loads asset data from datastore
    CombatLevel.initData = function() {
        for (var key in this.options.assets) {
            if (this[key] === null) {
                this[key] = this.datastore.get(this.options.assets[key]);
            }
        }
    };

    // Initialize tiles and background renderer.
    //
    CombatLevel.prototype.initTiles = function() {
        this.tileLookup = [];
        this.tileFactory = {};

        for (key in this.options.tiles) {
            this.tileLookup.push(key);
            this.tileFactory[key] =
                new rpg.graphics.SpriteTile(
                    this.spritemeta.frames[this.options.tiles[key]].frame, this.spritesheet);
        }

        this.bgRenderer = new rpg.graphics.BgRenderer(
            this.map, this.tileLookup, this.tileFactory,
            this.tileSize, this.gridWidth, this.gridHeight);
    };

    // Initialize sprite renderer.
    CombatLevel.prototype.initSprites = function() {
        this.spriteRenderer = new rpg.graphics.SpriteRenderer(
            this.map, this.spritesheet,
            this.tileSize, this.gridWidth, this.gridHeight);
    };

    // Initialize hero sprite.
    CombatLevel.prototype.initHero = function() {
        this.heroSprite = new rpg.graphics.SpriteAnim(this.spritemeta.frames, this.map);
        this.heroSprite.x = 8;
        this.heroSprite.y = 2;
        this.heroSprite.faceLeft();
        this.partySprites.unshift(this.heroSprite);
        this.sprites.unshift(this.heroSprite);
    };

    CombatLevel.prototype.initParty = function() {
        var partyMember = new rpg.graphics.SpriteAnim(this.spritemeta.frames, this.map);
        partyMember.x = 8;
        partyMember.y = 4;
        partyMember.faceLeft();
        this.partySprites.unshift(partyMember);
        this.sprites.unshift(partyMember);
    };

    CombatLevel.prototype.initEnemies = function() {
        var enemy1 = new rpg.graphics.SpriteAnim(this.spritemeta.frames, this.map);
        enemy1.x = 1;
        enemy1.y = 2;
        enemy1.faceRight();

        var enemy2 = new rpg.graphics.SpriteAnim(this.spritemeta.frames, this.map);
        enemy2.x = 1;
        enemy2.y = 4;
        enemy2.faceRight();

        this.enemySprites = [enemy1, enemy2];
        this.sprites.unshift(enemy1);
        this.sprites.unshift(enemy2);
    };

    CombatLevel.prototype.initMenu = function() {

        var hero = new rpg.entity.Player({id: 'h1', name: "Hero"});
        var hero2 = new rpg.entity.Player({id: 'h2', name: "Hero 2"});
        var orc1 = new rpg.entity.Enemy({id: 'e1', name: "Orc 1"});
        var orc2 = new rpg.entity.Enemy({id: 'e2', name: "Orc 2"});

        var party = [hero, hero2];
        var enemies = [orc1, orc2];

        var gameState = {
            partyTurn: hero,
            enemyTurn: false,
            selectedEnemy: null,
            party: party,
            enemies: enemies,
        };
        var CombatApp = rpg.combat.App;
        React.renderComponent(
            CombatApp( {party:party, gameState:gameState, enemies:enemies,
                heroSprites:this.partySprites, sprites:this.enemySprites} ),
            document.getElementById('combat-menu-container')
        );
    };

    CombatLevel.prototype.onKeydown = function(e) {};
    rpg.CombatLevel = CombatLevel;


    var AnimLoop = function(ctx, level) {
        this.animStopped = false;
        this.keyWait = false;
        this.ctx = ctx;
        this.heroSprite = level.heroSprite;
        this.sprites = level.sprites;
        this.bgRenderer = level.bgRenderer;
        this.spriteRenderer = level.spriteRenderer;
    };

    AnimLoop.prototype.animate = function() {
        if (this.animStopped) {
            return;
        }
        var self = this;

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


    // Game Engine to control map rendering and intialization.
    //
    // Very rough implementation.
    //
    // el: DOM element to render canvas. Do not pass in jQuery object.
    // options: Various options to pass in. See options object for defaults.
    //
    var GameEngine = function(el, options) {
        this.options = $.extend({
            tileSize: 64,
            gridWidth: 10,
            gridHeight: 7
        }, options);
        this.datastore = new rpg.util.Datastore();

        this.levelConfig = {
            exploration: new GameLevel(null, this.options.tileSize, this.options.gridWidth, this.options.gridHeight),
            combat: new CombatLevel(null, this.options.tileSize, this.options.gridWidth, this.options.gridHeight),
            combatProbability: 0.2
        };

        this.level = null;
        this.el = el;
        this.$el = $(el);
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.tileSize * this.options.gridWidth;
        this.canvas.height = this.options.tileSize * this.options.gridHeight;
        this.ctx = this.canvas.getContext('2d');
        this.el.appendChild(this.canvas);
    };

    GameEngine.prototype.run = function() {
        this.loadExploration();
    };

    GameEngine.prototype.loadExploration = function() {
        var self = this;
        this.pauseKeyListener();
        this.level = this.levelConfig.exploration;
        this.level.load(function() {
            self.animLoop = new AnimLoop(self.ctx, self.level);
            self.animLoop.animate();
            self.initExplorationControls();
        }, this.datastore);
    };

    GameEngine.prototype.loadCombat = function() {
        var self = this;
        this.pauseKeyListener();
        this.level = this.levelConfig.combat;
        this.level.load(function() {
            self.animLoop = new AnimLoop(self.ctx, self.level);
            self.animLoop.animate();
        }, this.datastore);
    };

    GameEngine.prototype.pauseKeyListener = function() {
        $(document.body).off('keydown');
    };

    // Key listener for movement on map.
    GameEngine.prototype.initExplorationControls = function() {
        var self = this;
        var level = self.level;
        $(document.body).on('keydown', function(e) {
            if (self.animLoop.keyWait) {
                return;
            }

            if (Math.random() < self.level.combatProbability) {
                self.loadCombat();
            } else {
                level.onKeydown(e);
            }
            self.animLoop.keyWait = true;
        });
    };
    rpg.GameEngine = GameEngine;
})(window);