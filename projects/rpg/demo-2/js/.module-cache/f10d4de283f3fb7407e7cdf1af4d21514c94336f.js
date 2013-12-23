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

        this.sprites = [];
        this.heroSprite = null;
    };

    GameLevel.load = function(onLoad, datastore, tileSize, gridWidth, gridHeight) {
        this.tileSize = tileSize;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        var self = this;
        datastore.load(this.options.assets, function(data) {
            for (var key in data) {
                if (self[key] === null) {
                    self[key] = datastore.get(data[key]);
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
    rpg.GameLevel = GameLevel;

    var AnimLoop = function(ctx, heroSprite, sprites, bgRenderer, spriteRenderer) {
        this.animStopped = false;
        this.ctx = ctx;
        this.heroSprite = heroSprite;
        this.sprites = sprites;
        this.bgRenderer = bgRenderer;
        this.spriteRenderer = spriteRenderer;
    };

    AnimLoop.prototype.animate = function() {
        if (this.animStopped) {
            return;
        }

        this.bgRenderer.draw(this.ctx, this.heroSprite.getX(), this.heroSprite.getY());

        this.sprites.forEach(function(sprite) {
            self.spriteRenderer.draw(self.ctx, sprite);
        });

        this.sprites.forEach(function(sprite) {
            if (sprite == this.heroSprite && !sprite.hasFrames()) {
                self.keyWait = false;
            }

            if (!sprite.hasFrames() && sprite.callback) {
                sprite.callback();
                sprite.callback = null;
            }
        });

        var self = this;
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
        this.ctx = canvas.getContext('2d');
        this.el.appendChild(this.canvas);
    };

    // Loads sprite sheet image and metadata. Also loads map data.
    GameEngine.prototype.loadLevel = function(gameLevel) {
        var self = this;
        this.level = gameLevel;
        this.level.load(function() {
            self.initCanvas();
            self.animLoop = new AnimLoop(self.ctx, self.level);
            self.animLoop.animate();
            self.initKeyListener();
        }, this.datastore, this.options.tileSize, this.options.gridWidth, this.options.gridHeight);
    };

     // Key listener for movement on map.
    GameEngine.prototype.initKeyListener = function() {
        var self = this;
        $(document.body).keydown(function(e) {
            if (self.keyWait) {
                return;
            }

            if (e.which == Control.RIGHT) {
                self.heroSprite.moveRight();
            } else if (e.which == Control.LEFT) {
                self.heroSprite.moveLeft();
            } else if (e.which == Control.UP) {
                self.heroSprite.moveUp();
            } else if (e.which == Control.DOWN) {
                self.heroSprite.moveDown();
            } else if (e.which == Control.PAUSE) {
                //self.initCombatMode();
            } else {
                return;
            }
            self.keyWait = true;
            e.preventDefault();
        });
    };
    rpg.GameEngine = GameEngine;
})(window);