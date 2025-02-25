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

    var GameLevel = function(options) {
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

    GameLevel.prototype.load = function(onLoad, datastore, tileSize, gridWidth, gridHeight) {
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


    var CombatLevel = function(options) {
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

        this.map = null;
        this.spritemeta = null;
        this.spritesheet = null;

        this.tileLookup = null;
        this.tileFactory = null;
        this.bgRenderer = null;
        this.spriteRenderer = null;

        this.sprites = [];
        this.party = [];
        this.enemies = [];
        this.heroSprite = null;
    };

    CombatLevel.prototype.load = function(onLoad, datastore, tileSize, gridWidth, gridHeight) {
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
    CombatLevel.prototype.onAssetsLoad = function() {
        this.initTiles();
        this.initSprites();
        this.initHero();
        this.initParty();
        this.initEnemies();
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
        this.sprites.unshift(this.heroSprite);
    };

    CombatLevel.prototype.initParty = function() {
        var teammate = new rpg.graphics.SpriteAnim(this.spritemeta.frames, this.map);
        teammate.x = 8;
        teammate.y = 4;
        teammate.faceLeft();
        this.sprites.unshift(this.teammate);
    };

    GameEngine.prototype.initCombatMode = function() {

        this.heroSprite.clearQueue();
        this.bgRenderer.map = this.combatMap;
        this.spriteRenderer.map = this.combatMap;
        this.heroSprite.map = this.combatMap;
        this.heroSprite.x = 8;
        this.heroSprite.y = 2;
        this.heroSprite.faceLeft();

        this.heroSprites = [
            this.heroSprite,
            new HeroSprite(this.frames, this.combatMap)
        ];

        this.sprites = [
            new HeroSprite(this.frames, this.combatMap),
            new HeroSprite(this.frames, this.combatMap)
        ];

        this.heroSprites[1].x = 8;
        this.heroSprites[1].y = 4;
        this.heroSprites[1].faceLeft();

        this.sprites[0].x = 1;
        this.sprites[0].y = 2;
        this.sprites[0].faceRight();

        this.sprites[1].x = 1;
        this.sprites[1].y = 4;
        this.sprites[1].faceRight();

        var hero = new Player({id: 'h1', name: "Hero"});
        var hero2 = new Player({id: 'h2', name: "Hero 2"});
        var orc1 = new Enemy({id: 'e1', name: "Orc 1"});
        var orc2 = new Enemy({id: 'e2', name: "Orc 2"});

        var party = [hero, hero2];
        var enemies = [orc1, orc2];

        var gameState = {
            partyTurn: hero,
            enemyTurn: false,
            selectedEnemy: null,
            party: party,
            enemies: enemies,
        };

        React.renderComponent(
            CombatApp( {party:party, gameState:gameState, enemies:enemies,
                heroSprites:this.heroSprites, sprites:this.sprites} ),
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

        this.el = el;
        this.$el = $(el);
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.tileSize * this.options.gridWidth;
        this.canvas.height = this.options.tileSize * this.options.gridHeight;
        this.ctx = this.canvas.getContext('2d');
        this.el.appendChild(this.canvas);
    };

    // Loads sprite sheet image and metadata. Also loads map data.
    GameEngine.prototype.loadLevel = function(gameLevel) {
        var self = this;
        this.level = gameLevel;
        this.level.load(function() {
            self.animLoop = new AnimLoop(self.ctx, self.level);
            self.animLoop.animate();
            self.initKeyListener();
        }, this.datastore, this.options.tileSize, this.options.gridWidth, this.options.gridHeight);
    };

     // Key listener for movement on map.
    GameEngine.prototype.initKeyListener = function() {
        var self = this;
        var level = self.level;
        $(document.body).keydown(function(e) {
            if (self.animLoop.keyWait) {
                return;
            }
            level.onKeydown(e);
            if (e.which == Control.PAUSE) {
                //initCombatMode();
            }
            self.animLoop.keyWait = true;
        });
    };
    rpg.GameEngine = GameEngine;
})(window);