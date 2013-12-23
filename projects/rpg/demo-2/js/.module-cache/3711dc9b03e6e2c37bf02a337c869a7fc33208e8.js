/** @jsx React.DOM */
(function(window, undefined) {

    // Constants for key controls
    var Control = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        PAUSE: 13,
        ATTACK: 65
    };

    // Game mode that we are in. Are we exploring or in combat?
    var GameMode = {
        EXPLORE: 0,
        COMBAT: 1
    };

    // Background tile using solid fill color. Defaults to white.
    //
    // The color parameter here is any value that works with the canvas context's fillStyle
    // property.
    //
    var ColorTile = function(color) {
        this.color = color || 'white';
    };

    // Draws color tile on canvas.
    ColorTile.prototype.draw = function(ctx, x, y, tileSize) {
        ctx.beginPath();
        ctx.rect(x, y, tileSize, tileSize);
        ctx.fillStyle = this.color;
        ctx.fill();
    };


    // Background tile from sprite sheet. Expects tiles to be same dimensions and square.
    var SpriteTile = function(frame, spriteSheet) {
        this.frame = frame;
        this.spriteSheet = spriteSheet;
    };

    // Draws sprite tile on canvas.
    SpriteTile.prototype.draw = function(ctx, x, y, tileSize) {
        var frame = this.frame;
        ctx.drawImage(this.spriteSheet,
            frame.x, frame.y, frame.w, frame.h,
            x, y, tileSize, tileSize);
    };


    // Renders background tiles on canvas.
    //
    // - map: 2d array of tiles. Each digit references a specific tile in TileFactory.
    // - tileFactory: An array with tile objects (ColorTile or SpriteTile).
    // - tileSize: Size of tile. 64 would represent a 64x64 tile.
    // - gridWidth: Grid width
    // - gridHeight: Grid height
    //
    var BgRenderer = function(map, tileLookup, tileFactory, tileSize, gridWidth, gridHeight) {
        this.map = map;
        this.tileSize = tileSize;
        this.tileLookup = tileLookup;
        this.tileFactory = tileFactory;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.gridMidWidth = Math.floor(this.gridWidth / 2);
        if (this.gridWidth % 2 == 0) {
            this.gridMidWidth -= 1;
        }
        this.gridRemWidth = this.gridWidth - this.gridMidWidth;
        this.gridMidHeight = Math.floor(this.gridHeight / 2);
        if (this.gridHeight % 2 == 0) {
            this.gridMidHeight -= 1;
        }
        this.gridRemHeight = this.gridHeight - this.gridMidHeight;
    };

    // Draws background on canvas.
    //
    // ctx: Canvas context.
    // cx: Character x position on grid.
    // cy: Character y position on grid.
    //
    BgRenderer.prototype.draw = function(ctx, cx, cy) {
        var tileId = null;
        var tileType = null;
        var tileRenderer = null;

        var ry = null;
        var rx = null;

        var tileLookup = this.tileLookup;
        var tileFactory = this.tileFactory;
        var tileSize = this.tileSize;
        var map = this.map;
        var mapLenX = this.map[0].length;
        var mapLenY = this.map.length;

        var ocx = cx;
        var ocy = cy;
        var px = 0;
        var py = 0;

        cx = Math.floor(cx);
        cy = Math.floor(cy);

        if (cx < this.gridMidWidth) {
            cx = this.gridMidWidth;
        } else if (cx > mapLenX - this.gridRemWidth - 1) {
            cx = mapLenX - this.gridRemWidth;
        } else {
            var tileDiff = ocx - Math.floor(ocx);
            if (tileDiff != 0) {
                px = tileDiff * tileSize;
            }
        }

        if (cy < this.gridMidHeight) {
            cy = this.gridMidHeight;
        } else if (cy > mapLenY - this.gridRemHeight - 1) {
            cy = mapLenY - this.gridRemHeight;
        } else {
            var tileDiff = ocy - Math.floor(ocy);
            if (tileDiff != 0) {
                py = tileDiff * tileSize;
            }
        }

        var sy = cy - this.gridMidHeight;
        var sx = cx - this.gridMidWidth;
        var ey = cy + this.gridRemHeight - 1;
        var ex = cx + this.gridRemWidth - 1;

        if (px) {
            ++ex;
        }

        if (py) {
            ++ey;
        }

        for (var y = sy; y <= ey; ++y) {
            for (var x = sx; x <= ex; ++x) {
                ry = (y - sy) * tileSize;
                rx = (x - sx) * tileSize;
                tileId = map[y][x];
                tileType = tileLookup[tileId];
                tileRenderer = tileFactory[tileType];
                if (tileRenderer) {
                    tileRenderer.draw(ctx, rx - px, ry - py, tileSize)
                }
            }
        }
    };


    // Renders sprites on screen.
    //
    // map: See BgRenderer
    // spriteSheet: Spritesheet with sprites
    // tileSize: See BgRenderer
    // gridWidth: See BgRenderer
    // gridHeight: See BgRenderer
    //
    var SpriteRenderer = function(map, spriteSheet, tileSize, gridWidth, gridHeight) {
        this.map = map;
        this.spriteSheet = spriteSheet;
        this.tileSize = tileSize;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.gridMidWidth = Math.floor(this.gridWidth / 2);
        if (this.gridWidth % 2 == 0) {
            this.gridMidWidth -= 1;
        }
        this.gridRemWidth = this.gridWidth - this.gridMidWidth;
        this.gridMidHeight = Math.floor(this.gridHeight / 2);
        if (this.gridHeight % 2 == 0) {
            this.gridMidHeight -= 1;
        }
        this.gridRemHeight = this.gridHeight - this.gridMidHeight;
    };

    // Draws sprite.
    //
    // ctx: Canvas context.
    // sprite: Sprite object to draw.
    //
    SpriteRenderer.prototype.draw = function(ctx, sprite) {
        var map = this.map;
        var spriteSheet = this.spriteSheet;
        var tileSize = this.tileSize;

        var mapLenX = this.map[0].length;
        var mapLenY = this.map.length;
        var data = sprite.frameQueue.pop();
        var scale = sprite.scale;

        if (data) {
            if (data[3] > 0) {
                --data[3];
                 sprite.frameQueue.push(data);
            } else {
                sprite.lastFrame = data;
            }
        } else {
            data = sprite.lastFrame;
        }

        var frame = data[0].frame;
        var x = data[1];
        var y = data[2];

        var cx = x;
        var cy = y;
        if (cx < this.gridMidWidth) {
            cx = this.gridMidWidth;
        } else if (cx > mapLenX - this.gridRemWidth) {
            cx = mapLenX - this.gridRemWidth;
        }

        if (cy < this.gridMidHeight) {
            cy = this.gridMidHeight;
        } else if (cy > mapLenY - this.gridRemHeight) {
            cy = mapLenY - this.gridRemHeight;
        }

        var sy = cy - this.gridMidHeight;
        var sx = cx - this.gridMidWidth;

        ctx.imageSmoothingEnabled = false;
        ry = (y - sy) * tileSize;
        rx = (x - sx) * tileSize;
        ctx.drawImage(spriteSheet,
            frame.x, frame.y, frame.w, frame.h,
            (frame.w * scale - tileSize) / 2 + (x - sx) * tileSize,
            (frame.h * scale) / -2 + tileSize * (y - sy),
            frame.w * scale, frame.h * scale);
        ctx.imageSmoothingEnabled = true;
    };


    // Character sprite.
    //
    // The frames parameter contains metadata about
    // how to render the sprite from the spritesheet.
    //
    // For example, a character sprite would have frames
    // for animating the character walking in various directions.
    //
    var HeroSprite = function(frames, map) {
        this.anims = {
            walk_left_1: 0,
            walk_left_2: 1,
            face_left: 2,
            walk_right_1: 3,
            walk_right_2: 4,
            face_right: 5,
            walk_up_1: 6,
            walk_up_2: 7,
            face_up: 8,
            walk_down_1: 9,
            walk_down_2: 10,
            face_down: 11,
            attack_left_1: 12,
            attack_left_2: 13,
            attack_right_1: 12,
            attack_right_2: 13,
        };

        this.frames = {};

        for (var name in frames) {
            var key = name.substring(0, name.lastIndexOf('.'));
            this.frames[key] = frames[name];
        }

        this.map = map;

        this.scale = 2;
        this.frameDuration = 1;

        this.frameStep = 0.75;
        this.frameStep2 = 0.5;
        this.frameStep3 = 0.5;

        this.x = 0;
        this.y = 1;
        this.frameQueue = [];
        this.lastFrame = null;
    };

    // Queue up a frame that will be animated by SpriteRenderer.
    //
    // The frame parameter here is not the same as the the frames
    // object passed in to the HeroSprite constructor.
    //
    // The frame format is as follows (very tentative)
    // [
    //      This parameter is a frame from this.frames object,
    //      Next up is the x position on grid,
    //      Followed by y position on grid,
    //      Duration to display this frame. Or how many times to display frame.
    // ]
    //
    // Example:
    //  [frames.walk_right_1, x - 0.9, y, this.frameDuration]
    //
    HeroSprite.prototype.queue = function(frame) {
        this.frameQueue.unshift(frame);
    };

    HeroSprite.prototype.clearQueue = function() {
        this.frameQueue = [];
    };

    // Checks if sprite has any frames to animate.
    HeroSprite.prototype.hasFrames = function() {
        return this.frameQueue.length != 0;
    };

    // Gets the x position of the sprite.
    HeroSprite.prototype.getX = function() {
        var frameQueue = this.frameQueue;
        if (frameQueue.length > 0) {
            return frameQueue[frameQueue.length - 1][1];
        } else {
            return this.x;
        }
    };

    // Gets the y position of the sprite.
    HeroSprite.prototype.getY = function() {
        var frameQueue = this.frameQueue;
        if (frameQueue.length > 0) {
            return frameQueue[frameQueue.length - 1][2];
        } else {
            return this.y;
        }
    };

    // Draws the hero facing right. The map is used to check if the
    // character is allowed to make the move.
    HeroSprite.prototype.faceRight = function() {
        this.frameQueue.unshift([this.frames.face_right, this.x, this.y, 0]);

    };

    // Draws character moving right.
    HeroSprite.prototype.moveRight = function() {
        var frames = this.frames;
        var y = this.y;
        var x = this.x + 1;

        if (x < this.map.length && this.map[y][x] == 0) {
            this.x = x;
            this.frameQueue.unshift([frames.walk_right_1, x - 0.9, y, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_right_1, x - 0.8, y, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_right_1, x - 0.7, y, this.frameDuration]);
            this.frameQueue.unshift([frames.face_right, x - 0.6, y, this.frameDuration]);
            this.frameQueue.unshift([frames.face_right, x - 0.5, y, this.frameDuration]);
            this.frameQueue.unshift([frames.face_right, x - 0.4, y, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_right_2, x - 0.3, y, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_right_2, x - 0.2, y, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_right_2, x - 0.1, y, this.frameDuration]);
            this.frameQueue.unshift([frames.face_right, x, y, 0]);
        } else {
            this.faceRight();
        }
    };

    // Draws character facing left.
    HeroSprite.prototype.faceLeft = function() {
        this.frameQueue.unshift([this.frames.face_left, this.x, this.y, 0]);
    };

    // Draws character moving left.
    HeroSprite.prototype.moveLeft = function() {
        var frames = this.frames;
        var y = this.y;
        var x = this.x - 1;
        if (x >= 0 && this.map[y][x] == 0) {
            this.x = x;
            this.frameQueue.unshift([frames.walk_left_1, x + 0.9, y, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_left_1, x + 0.8, y, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_left_1, x + 0.7, y, this.frameDuration]);
            this.frameQueue.unshift([frames.face_left, x + 0.6, y, this.frameDuration]);
            this.frameQueue.unshift([frames.face_left, x + 0.5, y, this.frameDuration]);
            this.frameQueue.unshift([frames.face_left, x + 0.4, y, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_left_2, x + 0.3, y, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_left_2, x + 0.2, y, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_left_2, x + 0.1, y, this.frameDuration]);
            this.frameQueue.unshift([frames.face_left, x, y, 0]);
        } else {
            this.faceLeft();
        }
    };

    // Draws character facing up.
    HeroSprite.prototype.faceUp = function() {
        this.frameQueue.unshift([this.frames.face_up, this.x, this.y, 0]);
    };

    // Draws character moving up.
    HeroSprite.prototype.moveUp = function() {
        var frames = this.frames;
        var x = this.x;
        var y = this.y - 1;
        if (y >= 0 && this.map[y][x] == 0) {
            this.y = y;
            this.frameQueue.unshift([frames.walk_up_1, x, y + 0.9, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_up_1, x, y + 0.8, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_up_1, x, y + 0.7, this.frameDuration]);
            this.frameQueue.unshift([frames.face_up, x, y + 0.6, this.frameDuration]);
            this.frameQueue.unshift([frames.face_up, x, y + 0.5, this.frameDuration]);
            this.frameQueue.unshift([frames.face_up, x, y + 0.4, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_up_2, x, y + 0.3, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_up_2, x, y + 0.2, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_up_2, x, y + 0.1, this.frameDuration]);
            this.frameQueue.unshift([frames.face_up, x, y, 0]);
        } else {
            this.faceUp();
        }
    };

    // Draws character facing down.
    HeroSprite.prototype.faceDown = function() {
        this.frameQueue.unshift([this.frames.face_down, this.x, this.y, 0]);
    };

    // Draws attack animation.
    //
    // Not sure if all the animations belong here.
    HeroSprite.prototype.attackLeft = function(callback) {
        this.callback = callback;
        this.moveLeft();
        var frames = this.frames;
        this.frameQueue.unshift([frames.attack_left_1, this.x, this.y, 10]);
        this.frameQueue.unshift([frames.attack_left_2, this.x-1, this.y, 15]);
        this.frameQueue.unshift([frames.face_left, this.x, this.y, 0]);
        var x = this.x + 1;
        var y = this.y;
        this.frameQueue.unshift([frames.walk_left_1, x - 0.9, y, this.frameDuration]);
        this.frameQueue.unshift([frames.walk_left_1, x - 0.8, y, this.frameDuration]);
        this.frameQueue.unshift([frames.walk_left_1, x - 0.7, y, this.frameDuration]);
        this.frameQueue.unshift([frames.face_left, x - 0.6, y, this.frameDuration]);
        this.frameQueue.unshift([frames.face_left, x - 0.5, y, this.frameDuration]);
        this.frameQueue.unshift([frames.face_left, x - 0.4, y, this.frameDuration]);
        this.frameQueue.unshift([frames.walk_left_2, x - 0.3, y, this.frameDuration]);
        this.frameQueue.unshift([frames.walk_left_2, x - 0.2, y, this.frameDuration]);
        this.frameQueue.unshift([frames.walk_left_2, x - 0.1, y, this.frameDuration]);
        this.frameQueue.unshift([frames.face_left, x, y, 0]);
        this.x = x;
    };

    // Draws attack animation.
    //
    // Not sure if all the animations belong here.
    HeroSprite.prototype.attackRight = function(callback) {
        this.callback = callback;
        this.moveRight();
        var frames = this.frames;
        this.frameQueue.unshift([frames.attack_right_1, this.x, this.y, 10]);
        this.frameQueue.unshift([frames.attack_right_2, this.x+0.5, this.y, 15]);
        this.frameQueue.unshift([frames.face_right, this.x, this.y, 0]);
        var x = this.x - 1;
        var y = this.y;
        this.frameQueue.unshift([frames.walk_right_1, x + 0.9, y, this.frameDuration]);
        this.frameQueue.unshift([frames.walk_right_1, x + 0.8, y, this.frameDuration]);
        this.frameQueue.unshift([frames.walk_right_1, x + 0.7, y, this.frameDuration]);
        this.frameQueue.unshift([frames.face_right, x + 0.6, y, this.frameDuration]);
        this.frameQueue.unshift([frames.face_right, x + 0.5, y, this.frameDuration]);
        this.frameQueue.unshift([frames.face_right, x + 0.4, y, this.frameDuration]);
        this.frameQueue.unshift([frames.walk_right_2, x + 0.3, y, this.frameDuration]);
        this.frameQueue.unshift([frames.walk_right_2, x + 0.2, y, this.frameDuration]);
        this.frameQueue.unshift([frames.walk_right_2, x + 0.1, y, this.frameDuration]);
        this.frameQueue.unshift([frames.face_right, x, y, 0]);
        this.x = x;
    };

    // Draws character moving down.
    HeroSprite.prototype.moveDown = function() {
        var frames = this.frames;
        var x = this.x;
        var y = this.y + 1;
        if (y < this.map.length && this.map[y][x] == 0) {
            this.y = y;
            this.frameQueue.unshift([frames.walk_down_1, x, y - 0.9, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_down_1, x, y - 0.8, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_down_1, x, y - 0.7, this.frameDuration]);
            this.frameQueue.unshift([frames.face_down, x, y - 0.6, this.frameDuration]);
            this.frameQueue.unshift([frames.face_down, x, y - 0.5, this.frameDuration]);
            this.frameQueue.unshift([frames.face_down, x, y - 0.4, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_down_2, x, y - 0.3, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_down_2, x, y - 0.2, this.frameDuration]);
            this.frameQueue.unshift([frames.walk_down_2, x, y - 0.1, this.frameDuration]);
            this.frameQueue.unshift([frames.face_down, x, y, 0]);
        } else {
            this.faceDown();
        }
    };


    var Entity = function(options) {
        this.attr = {
            id: null,
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
            return {showActions: 1, eturn: 0, hturn};
        },
        handleActionSelect: function(event) {
            this.setState({showActions: 2});
        },
        handleEnemySelect: function(entity, event) {
            entity.takeDamage(this.props.party[0].attack());
            this.props.gameState.partyTurn = null;
            this.props.gameState.selectedEnemy = null;
            this.setState({showActions: 0});
            this.props.heroSprite.attackLeft(this.runEnemyAttackSequence);
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
                this.props.gameState.partyTurn = this.props.party[0];
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
            grass: new SpriteTile(this.frames['grass.png'].frame, this.spriteSheet),
            water: new SpriteTile(this.frames['water2.png'].frame, this.spriteSheet),
            cliff: new SpriteTile(this.frames['cliff.png'].frame, this.spriteSheet)
        };

        this.bgRenderer = new BgRenderer(
            this.map, this.tileLookup, this.tileFactory,
            this.options.tileSize, this.options.gridWidth, this.options.gridHeight);
    };

    // Initialize sprite renderer.
    GameEngine.prototype.initSprites = function() {
        this.spriteRenderer = new SpriteRenderer(
            this.map, this.spriteSheet,
            this.options.tileSize, this.options.gridWidth, this.options.gridHeight);
    };

    // Initialize hero sprite.
    GameEngine.prototype.initHero = function() {
        this.heroSprite = new HeroSprite(this.frames, this.map);
        this.heroSprite.faceRight();
    };

    GameEngine.prototype.initCombatMode = function() {
        this.mode = GameMode.COMBAT;
        this.heroSprite.clearQueue();
        this.bgRenderer.map = this.combatMap;
        this.spriteRenderer.map = this.combatMap;
        this.heroSprite.map = this.combatMap;
        this.heroSprite.x = 8;
        this.heroSprite.y = 3;
        this.heroSprite.faceLeft();

        this.sprites = [
            new HeroSprite(this.frames, this.combatMap),
            new HeroSprite(this.frames, this.combatMap)
        ];

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
                heroSprite:this.heroSprite, sprites:this.sprites} ),
            document.getElementById('combat-menu-container')
        );
    };

    // Animation/Game loop.
    GameEngine.prototype.animate = function() {
        var self = this;

        this.bgRenderer.draw(this.ctx, this.heroSprite.getX(), this.heroSprite.getY());

        this.spriteRenderer.draw(this.ctx, this.heroSprite);

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

    var gameEngine = new GameEngine(document.body);
    gameEngine.init();

})(window);
