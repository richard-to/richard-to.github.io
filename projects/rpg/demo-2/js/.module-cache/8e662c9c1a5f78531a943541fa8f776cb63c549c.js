/** @jsx React.DOM */
(function(window, undefined) {

    var graphics = {};


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
    graphics.ColorTile = ColorTile;


    // Background tile from sprite sheet. Expects tiles to be same dimensions and square.
    var SpriteTile = function(frame, spriteSheet) {
        this.frame = frame;
        this.spriteSheet = spriteSheet;
    };

    // Draws sprite tile on canvas.
    SpriteTile.prototype.draw = function(ctx, x, y, tileSize) {
        var frame = this.frame;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.spriteSheet,
            frame.x, frame.y, frame.w, frame.h,
            x, y, tileSize, tileSize);
        ctx.imageSmoothingEnabled = true;
    };
    graphics.SpriteTile = SpriteTile;


    var SpriteHighlightEffect = function(options) {
        this.options = $.extend({
            frameDuration: 30,
            fillColor: '#4fb3c6',
            strokeColor: '#a2e4ef',
            lineWidth: 3,
            alphaNormal: 0.7,
            alphaFlash: 0.8,
            radius: 12
        }, options);
        this.currentAlpha = this.options.alphaNormal;
        this.frameCount = 0;
        this.circlePi = 2 * Math.PI;
    };

    SpriteHighlightEffect.prototype.draw = function(ctx, x, y, tileSize, scale) {
        var radius = this.options.radius * scale;
        var alpha = this.currentAlpha;

        ctx.beginPath();
        ctx.globalAlpha = alpha;

        ctx.arc(
            x * tileSize + tileSize / 2,
            y * tileSize + tileSize - radius,
            radius, 0, this.circlePi, false);
        ctx.fillStyle = this.options.fillColor;
        ctx.fill();

        ctx.lineWidth = this.options.lineWidth;
        ctx.strokeStyle = this.options.strokeColor;
        ctx.stroke();

        ctx.globalAlpha = 1.0;

        if (this.frameCount > this.options.frameDuration) {
            if (this.currentAlpha == this.options.alphaNormal) {
                this.currentAlpha = this.options.alphaFlash;
            } else {
                this.currentAlpha = this.options.alphaNormal;
            }
            this.frameCount = 0;
        } else {
            this.frameCount++;
        }
    };

    var SpriteDamageEffect = function(options) {
        this.options = $.extend({
            frameDuration: 30,
            fillColor: '#fff',
            font: '12pt monospace',
            textAlign: 'center'
        }, options);
        this.frameCount = 0;
        this.damage = 99;
        this.disabled = true;
        this.circlePi = 2 * Math.PI;
    };

    SpriteDamageEffect.prototype.draw = function(ctx, x, y, tileSize, scale) {
        ctx.font = this.options.font;
        ctx.fillStyle = '#000';
        ctx.textAlign = this.options.textAlign;
        ctx.fillText(
            this.damage.toString(),
            x * tileSize + tileSize / 2,
            y * tileSize + tileSize);

        ctx.fillStyle = this.options.fillColor;
        ctx.textAlign = this.options.textAlign;
        ctx.fillText(
            this.damage.toString(),
            x * tileSize + tileSize / 2 - 1.5,
            y * tileSize + tileSize - 1);


        if (this.frameCount > this.options.frameDuration) {
            this.disabled = true;
            this.frameCount = 0;
        } else {
            this.frameCount++;
        }
    };

    // Animated character sprite.
    //
    // The frames parameter contains metadata about
    // how to render the sprite from the spritesheet.
    //
    // For example, a character sprite would have frames
    // for animating the character walking in various directions.
    //
    var SpriteEnemy = function(frame, map, enemy) {
        this.frames = [];
        this.frames.push(frame);

        this.map = map;

        this.scale = 2;
        this.frameDuration = 1;

        this.x = 0;
        this.y = 1;
        this.frameQueue = [];
        this.lastFrame = null;

        this.faceRight();

        this.highight = false;
        if (enemy) {
            this.highightSprite = new SpriteHighlightEffect({
                fillColor: '#c9545e',
                strokeColor: '#f27979'
            });
        } else {
            this.highightSprite = new SpriteHighlightEffect();
        }
        this.damageSprite = new SpriteDamageEffect();
    };


    // Queue up a frame that will be animated by SpriteRenderer.
    //
    // The frame parameter here is not the same as the the frames
    // object passed in to the SpriteAnim constructor.
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
    SpriteEnemy.prototype.queue = function(frame) {
        this.frameQueue.unshift(frame);
    };

    SpriteEnemy.prototype.clearQueue = function() {
        this.frameQueue = [];
    };

    // Checks if sprite has any frames to animate.
    SpriteEnemy.prototype.hasFrames = function() {
        return this.frameQueue.length != 0;
    };

    // Gets the x position of the sprite.
    SpriteEnemy.prototype.getX = function() {
        var frameQueue = this.frameQueue;
        if (frameQueue.length > 0) {
            return frameQueue[frameQueue.length - 1][1];
        } else {
            return this.x;
        }
    };

    // Gets the y position of the sprite.
    SpriteEnemy.prototype.getY = function() {
        var frameQueue = this.frameQueue;
        if (frameQueue.length > 0) {
            return frameQueue[frameQueue.length - 1][2];
        } else {
            return this.y;
        }
    };

    SpriteEnemy.prototype.showHighlight = function() {
        this.highight = true;
    };

    SpriteEnemy.prototype.hideHighlight = function() {
        this.highight = false;
    };

    // Draws character moving left.
    SpriteEnemy.prototype.moveRight = function() {
        var frames = this.frames;
        var y = this.y;
        var x = this.x + 1;
        if (x >= 0 && this.map[y][x] >= 0) {
            this.x = x;
            this.frameQueue.unshift([frames[0], x - 0.9, y, this.frameDuration]);
            this.frameQueue.unshift([frames[0], x - 0.8, y, this.frameDuration]);
            this.frameQueue.unshift([frames[0], x - 0.7, y, this.frameDuration]);
            this.frameQueue.unshift([frames[0], x - 0.6, y, this.frameDuration]);
            this.frameQueue.unshift([frames[0], x - 0.5, y, this.frameDuration]);
            this.frameQueue.unshift([frames[0], x - 0.4, y, this.frameDuration]);
            this.frameQueue.unshift([frames[0], x - 0.3, y, this.frameDuration]);
            this.frameQueue.unshift([frames[0], x - 0.2, y, this.frameDuration]);
            this.frameQueue.unshift([frames[0], x - 0.1, y, this.frameDuration]);
            this.frameQueue.unshift([frames[0], x, y, 0]);
        } else {
            this.faceLeft();
        }
    };

    // Draws attack animation.
    //
    // Not sure if all the animations belong here.
    //
    SpriteEnemy.prototype.attackRight = function(callback) {
        this.callback = callback;
        this.moveRight();
        var frames = this.frames;
        var x = this.x - 1;
        var y = this.y;
        this.frameQueue.unshift([frames[0], x + 0.9, y, this.frameDuration]);
        this.frameQueue.unshift([frames[0], x + 0.8, y, this.frameDuration]);
        this.frameQueue.unshift([frames[0], x + 0.7, y, this.frameDuration]);
        this.frameQueue.unshift([frames[0], x + 0.6, y, this.frameDuration]);
        this.frameQueue.unshift([frames[0], x + 0.5, y, this.frameDuration]);
        this.frameQueue.unshift([frames[0], x + 0.4, y, this.frameDuration]);
        this.frameQueue.unshift([frames[0], x + 0.3, y, this.frameDuration]);
        this.frameQueue.unshift([frames[0], x + 0.2, y, this.frameDuration]);
        this.frameQueue.unshift([frames[0], x + 0.1, y, this.frameDuration]);
        this.frameQueue.unshift([frames[0], x, y, 0]);
        this.x = x;
    };

    // Draws the sprite facing right. The map is used to check if the
    // character is allowed to make the move.
    SpriteEnemy.prototype.faceRight = function() {
        this.frameQueue.unshift([this.frames[0], this.x, this.y, 0]);
    };
    graphics.SpriteEnemy = SpriteEnemy;

    // Animated character sprite.
    //
    // The frames parameter contains metadata about
    // how to render the sprite from the spritesheet.
    //
    // For example, a character sprite would have frames
    // for animating the character walking in various directions.
    //
    var SpriteAnim = function(frames, map, enemy) {
        this.frames = frames;
        this.map = map;
        this.scale = 2;
        this.frameDuration = 1;
        this.x = 0;
        this.y = 1;
        this.frameQueue = [];
        this.lastFrame = null;

        this.highight = false;
        if (enemy) {
            this.highightSprite = new SpriteHighlightEffect({
                fillColor: '#c9545e',
                strokeColor: '#f27979'
            });
        } else {
            this.highightSprite = new SpriteHighlightEffect();
        }
        this.damageSprite = new SpriteDamageEffect();
    };

    // Queue up a frame that will be animated by SpriteRenderer.
    //
    // The frame parameter here is not the same as the the frames
    // object passed in to the SpriteAnim constructor.
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
    SpriteAnim.prototype.queue = function(frame) {
        this.frameQueue.unshift(frame);
    };

    SpriteAnim.prototype.clearQueue = function() {
        this.frameQueue = [];
    };

    // Checks if sprite has any frames to animate.
    SpriteAnim.prototype.hasFrames = function() {
        return this.frameQueue.length != 0;
    };

    // Gets the x position of the sprite.
    SpriteAnim.prototype.getX = function() {
        var frameQueue = this.frameQueue;
        if (frameQueue.length > 0) {
            return frameQueue[frameQueue.length - 1][1];
        } else {
            return this.x;
        }
    };

    // Gets the y position of the sprite.
    SpriteAnim.prototype.getY = function() {
        var frameQueue = this.frameQueue;
        if (frameQueue.length > 0) {
            return frameQueue[frameQueue.length - 1][2];
        } else {
            return this.y;
        }
    };

    // Draws the sprite facing right. The map is used to check if the
    // character is allowed to make the move.
    SpriteAnim.prototype.faceRight = function() {
        this.frameQueue.unshift([this.frames.face_right, this.x, this.y, 0]);
    };

    // Draws character moving right.
    SpriteAnim.prototype.moveRight = function() {
        var frames = this.frames;
        var y = this.y;
        var x = this.x + 1;
        if (x < this.map[0].length && this.map[y][x] >= 0) {
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
    SpriteAnim.prototype.faceLeft = function() {
        this.frameQueue.unshift([this.frames.face_left, this.x, this.y, 0]);
    };

    // Draws character moving left.
    SpriteAnim.prototype.moveLeft = function() {
        var frames = this.frames;
        var y = this.y;
        var x = this.x - 1;
        if (x >= 0 && this.map[y][x] >= 0) {
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
    SpriteAnim.prototype.faceUp = function() {
        this.frameQueue.unshift([this.frames.face_up, this.x, this.y, 0]);
    };

    // Draws character moving up.
    SpriteAnim.prototype.moveUp = function() {
        var frames = this.frames;
        var x = this.x;
        var y = this.y - 1;
        if (y >= 0 && this.map[y][x] >= 0) {
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
    SpriteAnim.prototype.faceDown = function() {
        this.frameQueue.unshift([this.frames.face_down, this.x, this.y, 0]);
    };

    // Draws character moving down.
    SpriteAnim.prototype.moveDown = function() {
        var frames = this.frames;
        var x = this.x;
        var y = this.y + 1;
        if (y < this.map.length && this.map[y][x] >= 0) {
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

    // Draws attack animation.
    //
    // Not sure if all the animations belong here.
    //
    SpriteAnim.prototype.attackLeft = function(callback) {
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
    //
    SpriteAnim.prototype.attackRight = function(callback) {
        this.callback = callback;
        this.moveRight();
        var frames = this.frames;
        this.frameQueue.unshift([frames.attack_1, this.x, this.y, 10]);
        this.frameQueue.unshift([frames.attack_2, this.x+0.5, this.y, 15]);
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

    SpriteAnim.prototype.showHighlight = function() {
        this.highight = true;
    };

    SpriteAnim.prototype.hideHighlight = function() {
        this.highight = false;
    };

    graphics.SpriteAnim = SpriteAnim;


    // Renders background tiles on canvas.
    //
    // - map: 2d array of tiles. Each digit references a specific tile in TileFactory
    // - tileFactory: An array with tile objects (ColorTile or SpriteTile)
    // - tileSize: Size of tile. 64 would represent a 64x64 tile
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
    // ctx: Canvas context
    // cx: Character x position on grid
    // cy: Character y position on grid
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
    graphics.BgRenderer = BgRenderer;


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
    // ctx: Canvas context
    // sprite: Sprite object to draw
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

        if (sprite.highight) {
            sprite.highightSprite.draw(ctx, (x - sx), (y - sy), tileSize, scale);
        }

        if (sprite.damageSprite.disabled === false) {
            sprite.damageSprite.draw(ctx, (x - sx), (y - sy), tileSize, scale);
        }

        ctx.drawImage(spriteSheet,
            frame.x, frame.y, frame.w, frame.h,
            (frame.w * scale - tileSize) / 2 + (x - sx) * tileSize,
            (frame.h * scale) / -2 + tileSize * (y - sy),
            frame.w * scale, frame.h * scale);
        ctx.imageSmoothingEnabled = true;
    };
    graphics.SpriteRenderer = SpriteRenderer;

    if (window.rpg === undefined) {
        window.rpg = {};
    }
    window.rpg.graphics = graphics;
})(window);
