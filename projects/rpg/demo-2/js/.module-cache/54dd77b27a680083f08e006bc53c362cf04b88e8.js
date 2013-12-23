/** @jsx React.DOM */
(function(window, undefined) {
    var rpg = window.rpg;

    // Constants for key controls.
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

    var heroesList = {
        corrina: {
            name: 'Corrina',
            hp: 300,
            hpMax: 300,
            mp: 20,
            mpMax: 20,
            att: 20,
            def: 5,
            exp: 0,
            level: 1,
            frames: {
                walk_left_1: 'corrina_walk_left_1.png',
                walk_left_2: 'corrina_walk_left_2.png',
                face_left: 'corrina_face_left_1.png',
                walk_right_1: 'corrina_walk_right_1.png',
                walk_right_2: 'corrina_walk_right_2.png',
                face_right: 'corrina_face_right.png',
                walk_up_1: 'corrina_walk_up_1.png',
                walk_up_2: 'corrina_walk_up_2.png',
                face_up: 'corrina_face_up.png',
                walk_down_1: 'corrina_walk_down_1.png',
                walk_down_2: 'corrina_walk_down_2.png',
                face_down: 'corrina_face_down.png',
                attack_left_1: 'corrina_attack_left_1.png',
                attack_left_2: 'corrina_attack_left_2.png'
            }
        },
        seth: {
            name: 'Seth',
            hp: 250,
            hpMax: 250,
            mp: 0,
            mpMax: 0,
            att: 30,
            def: 2,
            exp: 0,
            level: 1,
            frames: {
                walk_left_1: 'seth_walk_left_1.png',
                walk_left_2: 'seth_walk_left_2.png',
                face_left: 'seth_face_left.png',
                walk_right_1: 'seth_walk_right_1.png',
                walk_right_2: 'seth_walk_right_2.png',
                face_right: 'seth_face_right.png',
                walk_up_1: 'seth_walk_up_1.png',
                walk_up_2: 'seth_walk_up_2.png',
                face_up: 'seth_face_up.png',
                walk_down_1: 'seth_walk_down_1.png',
                walk_down_2: 'seth_walk_down_2.png',
                face_down: 'seth_face_down.png',
                attack_left_1: 'seth_attack_left_1.png',
                attack_left_2: 'seth_attack_left_2.png'
            }
        }
    };

    var enemiesList = [
        {
            name: "Eyeball Scout",
            hp: 30,
            hpMax: 30,
            mp: 0,
            mpMax: 0,
            att: 5,
            def: 5,
            exp: 5,
            sprite: 'eyeball.png'
        },
        {
            name: "Evil Bear",
            hp: 50,
            hpMax: 50,
            mp: 0,
            mpMax: 0,
            att: 10,
            def: 5,
            exp: 10,
            sprite: 'bear.png'
        },
    ];

    // Not the best name, but currently manages the part of the game
    // where the player can move around the world.
    var GameLevel = function(options, tileSize, gridWidth, gridHeight) {
        this.options = $.extend({
            assets: {
                map: 'map.json',
                spritesheet: 'sprites.png',
                spritemeta: 'sprites.json',
            },
            tiles: {
                grass: 'grass.png',
                water: 'water.png',
                cliff: 'cliff.png',
                cliff_b_grass: 'cliff_b_grass.png',
                cliff_l_grass: 'cliff_l_grass.png',
                cliff_bl_grass: 'cliff_bl_grass.png',
                cliff_rl_grass: 'cliff_rl_grass.png',
                cliff_r_grass: 'cliff_r_grass.png',
                cliff_rb_grass: 'cliff_rb_grass.png',
                cliff_t_grass: 'cliff_t_grass.png',
                cliff_tb_grass: 'cliff_tb_grass.png',
                cliff_tl_grass: 'cliff_tl_grass.png',
                cliff_tr_grass: 'cliff_tr_grass.png',
                cliff_trl_grass: 'cliff_trl_grass.png',
                cliff_tbl_grass: 'cliff_tbl_grass.png',
                cliff_trb_grass: 'cliff_trb_grass.png',
                cliff_trbl_grass: 'cliff_trbl_grass.png',
                cliff_rbl_grass: 'cliff_rbl_grass.png',
                grass_l_water: 'grass_l_water.png',
                grass_r_water: 'grass_r_water.png',
                grass_t_water: 'grass_t_water.png',
                grass_b_water: 'grass_b_water.png',
                grass_tl_water: 'grass_tl_water.png',
                grass_tb_water: 'grass_tb_water.png',
                grass_rb_water: 'grass_rb_water.png',
                water_t_grass: 'water_t_grass.png',
                cliff_bl_water: 'cliff_bl_water.png',
                cliff_b_water: 'cliff_b_water.png',
                cliff_r_water: 'cliff_r_water.png',
                grass_tb_water: 'grass_tb_water.png',
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

    // Loads necessary assets.
    GameLevel.prototype.load = function(onLoad, datastore) {
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

    // Initializes tiles and background renderer.
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

    // Initializes sprite renderer.
    GameLevel.prototype.initSprites = function() {
        this.spriteRenderer = new rpg.graphics.SpriteRenderer(
            this.map, this.spritesheet,
            this.tileSize, this.gridWidth, this.gridHeight);
    };

    // Initializes hero sprite.
    GameLevel.prototype.initHero = function() {
        var heroFrames = {};
        for (var name in heroesList.corrina.frames) {
            heroFrames[name] = this.spritemeta.frames[heroesList.corrina.frames[name]]
        }
        this.heroSprite = new rpg.graphics.SpriteAnim(heroFrames, this.map);
        this.heroSprite.x = 0;
        this.heroSprite.y = 1;
        this.heroSprite.faceRight();
        this.sprites.unshift(this.heroSprite);
    };

    // Handles controls for this aspect of the game.
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


    // Loads the combat aspect of the game.
    var CombatLevel = function(options, tileSize, gridWidth, gridHeight) {
        this.options = $.extend({
            assets: {
                map: 'combatMap.json',
                spritesheet: 'sprites.png',
                spritemeta: 'sprites.json',
            },
            tiles: {
                grass: 'grass.png',
                water: 'water.png',
                cliff: 'cliff.png',
                cliff_b_grass: 'cliff_b_grass.png',
                cliff_l_grass: 'cliff_l_grass.png',
                cliff_bl_grass: 'cliff_bl_grass.png',
                cliff_rl_grass: 'cliff_rl_grass.png',
                cliff_r_grass: 'cliff_r_grass.png',
                cliff_rb_grass: 'cliff_rb_grass.png',
                cliff_t_grass: 'cliff_t_grass.png',
                cliff_tb_grass: 'cliff_tb_grass.png',
                cliff_tl_grass: 'cliff_tl_grass.png',
                cliff_tr_grass: 'cliff_tr_grass.png',
                cliff_trl_grass: 'cliff_trl_grass.png',
                cliff_tbl_grass: 'cliff_tbl_grass.png',
                cliff_trb_grass: 'cliff_trb_grass.png',
                cliff_trbl_grass: 'cliff_trbl_grass.png',
                cliff_rbl_grass: 'cliff_rbl_grass.png',
                grass_l_water: 'grass_l_water.png',
                grass_r_water: 'grass_r_water.png',
                grass_t_water: 'grass_t_water.png',
                grass_b_water: 'grass_b_water.png',
                grass_tl_water: 'grass_tl_water.png',
                grass_tb_water: 'grass_tb_water.png',
                grass_rb_water: 'grass_rb_water.png',
                water_t_grass: 'water_t_grass.png',
                cliff_rb_water: 'cliff_rb_water.png',
                cliff_b_water: 'cliff_b_water.png',
                cliff_r_water: 'cliff_r_water.png',
                grass_tb_water: 'grass_tb_water.png',
            },
            menuDiv: 'combat-menu-container'
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
        this.party = null;
        this.enemies = null;
    };

    // Loads the assets needed to run this aspect of the game.
    CombatLevel.prototype.load = function(onLoad, datastore, party) {
        var self = this;
        this.party = party;
        datastore.load(this.options.assets, function() {
            for (var key in self.options.assets) {
                if (self[key] === null) {
                    self[key] = datastore.get(self.options.assets[key]);
                }
            }
            self.onAssetsLoad(party);
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

    // Initialize tiless and background renderer.
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

    // Initializes sprite renderer.
    CombatLevel.prototype.initSprites = function() {
        this.spriteRenderer = new rpg.graphics.SpriteRenderer(
            this.map, this.spritesheet,
            this.tileSize, this.gridWidth, this.gridHeight);
    };

    // Initializes hero sprite.
    CombatLevel.prototype.initHero = function() {
        var heroFrames = {};
        for (var name in heroesList.corrina.frames) {
            heroFrames[name] = this.spritemeta.frames[heroesList.corrina.frames[name]]
        }
        this.heroSprite = new rpg.graphics.SpriteAnim(heroFrames, this.map);
        this.heroSprite.x = 8;
        this.heroSprite.y = 2;
        this.heroSprite.faceLeft();
        this.partySprites.unshift(this.heroSprite);
        this.sprites.unshift(this.heroSprite);
    };

    // Initializes party members.
    // TODO(richard-to): Add party members dynamically.
    CombatLevel.prototype.initParty = function() {
        var heroFrames = {};
        for (var name in heroesList.seth.frames) {
            heroFrames[name] = this.spritemeta.frames[heroesList.seth.frames[name]]
        }
        for (var i = 1; i < this.party.length; i++) {
            var partyMember = new rpg.graphics.SpriteAnim(heroFrames, this.map);
            partyMember.x = 8;
            partyMember.y = 2 + i * 2;
            partyMember.faceLeft();
            this.partySprites.push(partyMember);
            this.sprites.unshift(partyMember);
        }
    };

    // Initializes enemies.
    // TODO(richard-to): Randomly generate enemies.
    CombatLevel.prototype.initEnemies = function() {
        var maxEnemies = 2;
        var numEnemies = Math.floor((Math.random() * max) + 1);
        var enemies = [];
        var enemySprites = [];
        var x = 1;
        var y = 2;
        for (var i = 0; i < numEnemies; i++) {
            var enemyConfig = enemiesList[(Math.floor((Math.random() * enemiesList.length) + 1))];
            enemies.push(new rpg.entity.Enemy(enemyConfig));
            var enemySprite = new rpg.graphics.SpriteEnemy(
                this.spritemeta.frames[enemyConfig.sprite], this.map, true)
            enemySprite.x = x;
            enemySprite.y = y;
            enemySprite.faceRight();
            enemySprites.push(enemySprite);
            this.sprites.unshift(orc1Sprite);
            x += 1;
            y += 2;
        }
        this.enemies = enemies;
        this.enemySprites = enemySprites;
        this.sprites.unshift(this.enemySprites);
    };

    // Initializes combat menu.
    // TODO(richard-to): Dynamically load party and enemy entities.
    CombatLevel.prototype.initMenu = function() {
        var CombatApp = rpg.combat.App;
        React.renderComponent(
            CombatApp(
                {party:this.party,
                enemies:this.enemies,
                partySprites:this.partySprites,
                enemySprites:this.enemySprites} ),
            document.getElementById(this.options.menuDiv)
        );
    };

    // Currently no key commands. Need to figure out how to interact with React components.
    CombatLevel.prototype.onKeydown = function(e) {};
    rpg.CombatLevel = CombatLevel;


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


    // Game Engine is the main controller for swapping out levels, managing
    // animation, delegate key events. Need to make this thinner.
    var GameEngine = function(el, options) {
        this.options = $.extend({
            tileSize: 64,
            gridWidth: 10,
            gridHeight: 7
        }, options);
        this.datastore = new rpg.util.Datastore();

        this.party = [
            new rpg.entity.Player(heroesList.corrina),
            new rpg.entity.Player(heroesList.seth),
        ];

        this.levelConfig = {
            exploration: new GameLevel(null, this.options.tileSize, this.options.gridWidth, this.options.gridHeight),
            combat: new CombatLevel(null, this.options.tileSize, this.options.gridWidth, this.options.gridHeight),
            combatProbability: 0.1
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

    // Starts the game in exploration mode.
    GameEngine.prototype.run = function() {
        this.loadExploration();
    };

    // Loads exploration mode.
    GameEngine.prototype.loadExploration = function() {
        var self = this;
        this.pauseKeyListener();
        this.level = this.levelConfig.exploration;
        this.level.load(function() {
            self.animLoop = new AnimLoop(self.ctx, self.canvas, self.level);
            self.animLoop.animate();
            self.initExplorationControls();
        }, this.datastore);
    };

    // Loads combat mode.
    GameEngine.prototype.loadCombat = function() {
        var self = this;
        this.pauseKeyListener();
        this.level = this.levelConfig.combat;
        this.level.load(function() {
            self.animLoop = new AnimLoop(self.ctx, self.canvas, self.level);
            self.animLoop.animate();
        }, this.datastore, this.party);
    };

    // Pauses global key listener.
    GameEngine.prototype.pauseKeyListener = function() {
        $(document.body).off('keydown');
    };

    // Key listener that delegates events to level objects.
    // Also currently handles combat mode transition. Should
    // probably be moved out here?
    GameEngine.prototype.initExplorationControls = function() {
        var self = this;
        var level = self.level;
        $(document.body).on('keydown', function(e) {
            if (self.animLoop.keyWait) {
                return;
            }

            if (Math.random() < self.levelConfig.combatProbability) {
                self.loadCombat();
            } else {
                level.onKeydown(e);
            }
            self.animLoop.keyWait = true;
        });
    };
    rpg.GameEngine = GameEngine;
})(window);