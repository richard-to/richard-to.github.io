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


    // Game Engine to control map rendering and intialization.
    //
    // Very rough implementation.
    //
    // el: DOM element to render canvas. Do not pass in jQuery object.
    // options: Various options to pass in. See options object for defaults.
    //
    var GameEngine = function(el, options) {
        this.options = $.extend({
            mapUrl: 'map.json',
            combatMapUrl: 'combatMap.json',
            spriteSheetUrl: 'sprites.png',
            spriteSheetMetaUrl: 'sprites.json',
            tileSize: 64,
            gridWidth: 10,
            gridHeight: 7
        }, options);

        this.el = el;
        this.$el = $(el);

        this.mode = GameMode.EXPLORE;

        this.map = null;
        this.combatMap = null;
        this.frames = null;
        this.spriteSheet = null;

        this.canvas = null;
        this.ctx = null;

        this.tileLookup = null;
        this.tileFactory = null;
        this.bgRenderer = null;
        this.heroSprite = null;
        this.keyWait = false;

        this.sprites = [];
        this.heroSprites = [];
    }

    // Loads sprite sheet image and metadata. Also loads map data.
    GameEngine.prototype.init = function() {
        var self = this;
        this.spriteSheet = new Image();
        this.spriteSheet.src = this.options.spriteSheetUrl;
        this.spriteSheet.onload = function() {
            self.onAssetsLoad();
        };

        $.getJSON(self.options.spriteSheetMetaUrl, function(data) {
            self.frames = data.frames;
            self.onAssetsLoad();
        });

        $.getJSON(self.options.mapUrl, function(data) {
            self.map = data;
            self.onAssetsLoad();
        });

        $.getJSON(self.options.combatMapUrl, function(data) {
            self.combatMap = data;
            self.onAssetsLoad();
        });
    };

    // Once external assets are loaded, everything else is initialized.
    GameEngine.prototype.onAssetsLoad = function() {
        if (this.spriteSheet.naturalWidth && this.frames && this.map && this.combatMap) {
            this.initCanvas();
            this.initTiles();
            this.initSprites();
            this.initHero();
            this.initKeyListener();
            this.animate();
        }
    };

    // Creates the canvas to render world.
    GameEngine.prototype.initCanvas = function() {
        var canvas = this.canvas = document.createElement('canvas');
        var ctx = this.ctx = canvas.getContext('2d');

        var canvasWidth = this.options.tileSize * this.options.gridWidth;
        var canvasHeight = this.options.tileSize * this.options.gridHeight;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        this.el.appendChild(canvas);
    };

    // Initialize tiles and background renderer.
    //
    // For now, will need to edit or override this method to change/add tiles.
    //
    GameEngine.prototype.initTiles = function() {
        this.tileLookup = [
            'grass',
            'water',
            'cliff'
        ];

        this.tileFactory = {
            grass: new rpg.graphics.SpriteTile(this.frames['grass.png'].frame, this.spriteSheet),
            water: new rpg.graphics.SpriteTile(this.frames['water2.png'].frame, this.spriteSheet),
            cliff: new rpg.graphics.SpriteTile(this.frames['cliff.png'].frame, this.spriteSheet)
        };

        this.bgRenderer = new rpg.graphics.BgRenderer(
            this.map, this.tileLookup, this.tileFactory,
            this.options.tileSize, this.options.gridWidth, this.options.gridHeight);
    };

    // Initialize sprite renderer.
    GameEngine.prototype.initSprites = function() {
        this.spriteRenderer = new rpg.graphics.SpriteRenderer(
            this.map, this.spriteSheet,
            this.options.tileSize, this.options.gridWidth, this.options.gridHeight);
    };

    // Initialize hero sprite.
    GameEngine.prototype.initHero = function() {
        this.heroSprite = new rpg.graphics.SpriteAnim(this.frames, this.map);
        this.heroSprite.faceRight();
    };

    GameEngine.prototype.initCombatMode = function() {
        this.mode = GameMode.COMBAT;
        this.heroSprite.clearQueue();
        this.bgRenderer.map = this.combatMap;
        this.spriteRenderer.map = this.combatMap;
        this.heroSprite.map = this.combatMap;
        this.heroSprite.x = 8;
        this.heroSprite.y = 2;
        this.heroSprite.faceLeft();

        this.heroSprites = [
            this.heroSprite,
            new rpg.graphics.SpriteAnim(this.frames, this.combatMap)
        ];

        this.sprites = [
            new rpg.graphics.SpriteAnim(this.frames, this.combatMap),
            new rpg.graphics.SpriteAnim(this.frames, this.combatMap)
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

        React.renderComponent(
            App( {party:party, gameState:gameState, enemies:enemies,
                heroSprites:this.heroSprites, sprites:this.sprites} ),
            document.getElementById('combat-menu-container')
        );
    };

    // Animation/Game loop.
    GameEngine.prototype.animate = function() {
        var self = this;

        this.bgRenderer.draw(this.ctx, this.heroSprite.getX(), this.heroSprite.getY());
        /*
        var radius = 24;
        this.ctx.beginPath();
        this.ctx.arc(0.5 * 64, 1.6 * 64, radius, 0, 2 * Math.PI, false);
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = '#ffbb00';
        this.ctx.fill();
        this.ctx.lineWidth = 4;
        this.ctx.globalAlpha = 0.8;
        this.ctx.strokeStyle = '#c9960c';
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
        */
        this.spriteRenderer.draw(this.ctx, this.heroSprite);

        if (this.heroSprites.length > 1) {
            this.spriteRenderer.draw(this.ctx, this.heroSprites[1]);
        }

        if (this.sprites) {
            this.sprites.forEach(function(sprite) {
                self.spriteRenderer.draw(self.ctx, sprite);
            });
        }

        if (!this.heroSprite.hasFrames()) {
            self.keyWait = false;
            if (this.heroSprite.callback) {
                this.heroSprite.callback();
                this.heroSprite.callback = null;
            }
        }

        if (this.heroSprites.length > 1) {
            if (!this.heroSprites[1].hasFrames()) {
                self.keyWait = false;
                if (this.heroSprites[1].callback) {
                    this.heroSprites[1].callback();
                    this.heroSprites[1].callback = null;
                }
            }
        }

        if (this.sprites) {
            this.sprites.forEach(function(sprite) {
                if (!sprite.hasFrames() && sprite.callback) {
                    sprite.callback();
                    sprite.callback = null;
                }
            });
        }

        requestAnimationFrame(function() {
            self.animate();
        });
    };

    // Key listener for movement on map.
    GameEngine.prototype.initKeyListener = function() {
        var self = this;
        this.$el.keydown(function(e) {
            if (self.mode == GameMode.EXPLORE) {
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
                    self.initCombatMode();
                } else {
                    return;
                }
                self.keyWait = true;
                e.preventDefault();
            } else if (self.mode == GameMode.COMBAT) {
                if (e.which == Control.ATTACK) {
                    self.heroSprite.attackLeft();
                }
            }
        });
    };

    if (window.rpg === undefined) {
        window.rpg = {};
    }
    window.rpg.GameEngine = GameEngine;
})(window);