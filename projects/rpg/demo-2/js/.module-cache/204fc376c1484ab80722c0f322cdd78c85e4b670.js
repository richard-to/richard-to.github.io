(function(window, undefined) {

    var ColorTile = function(color) {
        this.color = color || 'white';
    };

    ColorTile.prototype.draw = function(ctx, cx, cy, tileSize) {
        ctx.beginPath();
        ctx.rect(cx, cy, tileSize, tileSize);
        ctx.fillStyle = this.color;
        ctx.fill();
    };

    var SpriteTile = function(frame, spriteSheet) {
        this.frame = frame;
        this.spriteSheet = spriteSheet;
    };

    SpriteTile.prototype.draw = function(ctx, cx, cy, tileSize) {
        var frame = this.frame;
        ctx.drawImage(this.spriteSheet,
            frame.x, frame.y, frame.w, frame.h,
            cx, cy, tileSize, tileSize);
    };

    var BgRenderer = function(map, tileLookup, tileFactory, tileSize) {
        this.map = map;
        this.tileSize = tileSize;
        this.tileLookup = tileLookup;
        this.tileFactory = tileFactory;
    };

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

        cx = Math.floor(cx);
        cy = Math.floor(cy);

        if (cx < 2) {
            cx = 2;
        } else if (cx > mapLenX - 4) {
            cx = mapLenX - 4;
        }

        if (cy < 2) {
            cy = 2;
        } else if (cy > mapLenY - 4) {
            cy = mapLenY - 4;
        }

        var sy = cy - 2;
        var sx = cx - 2;
        var ey = cy + 3;
        var ex = cx + 3;

        for (var y = sy; y <= ey; ++y) {
            for (var x = sx; x <= ex; ++x) {
                ry = (y - sy) * tileSize;
                rx = (x - sx) * tileSize;
                tileId = map[y][x];
                tileType = tileLookup[tileId];
                tileRenderer = tileFactory[tileType];
                if (tileRenderer) {
                    tileRenderer.draw(ctx, rx, ry, tileSize)
                }
            }
        }
    };

    var SpriteRenderer = function(map, frames, spriteSheet, tileSize) {
        this.map = map;
        this.frames = frames;
        this.spriteSheet = spriteSheet;
        this.tileSize = tileSize;
    };

    SpriteRenderer.prototype.draw = function(ctx, sprite) {
        var map = this.map;
        var spriteSheet = this.spriteSheet;
        var tileSize = this.tileSize;

        var mapLenX = this.map[0].length;
        var mapLenY = this.map.length;
        var data = sprite.frameQueue.pop();

        if (data) {
            var frame = data[0].frame;
            var x = data[1];
            var y = data[2];

            var cx = x;
            var cy = y;
            if (cx < 2) {
                cx = 2;
            } else if (cx > mapLenX - 4) {
                cx = mapLenX - 4;
            }

            if (cy < 2) {
                cy = 2;
            } else if (cy > mapLenY - 4) {
                cy = mapLenY - 4;
            }

            var sy = cy - 2;
            var sx = cx - 2;
            var ey = cy + 3;
            var ex = cx + 3;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(spriteSheet,
                frame.x, frame.y, frame.w, frame.h,
                (tileSize - frame.w*2) / 2 + (x - sx) * tileSize,
                (tileSize - frame.h*2) / 2 + tileSize * (y - sy),
                tileSize, tileSize);
            ctx.imageSmoothingEnabled = true;
            if (data[4] < data[3]) {
                ++data[4];
                 sprite.frameQueue.push(data);
            }
        }
    };

    var HeroSprite = function(frames) {
        this.frames = $.extend({
            walkLeft: 'hero_walk_left.png',
            faceLeft: 'hero_face_left.png',
            walkRight: 'hero_walk_right.png',
            faceRight: 'hero_face_right.png',
            walkUp: 'hero_walk_up.png',
            faceUp: 'hero_face_up.png',
            walkDown: 'hero_walk_down.png',
            faceDown: 'hero_face_down.png'
        }, frames);

        this.frameStep = 0.5;
        this.x = 0;
        this.y = 1;
        this.frameQueue = [];
    };

    HeroSprite.prototype.queue = function(frame) {
        this.frameQueue.unshift(frame);
    };

    HeroSprite.prototype.hasFrames = function() {
        return this.frameQueue.length != 0;
    };

    HeroSprite.prototype.getX = function() {
        var frameQueue = this.frameQueue;
        if (frameQueue.length > 0) {
            return frameQueue[frameQueue.length - 1][1];
        } else {
            return this.x;
        }
    };

    HeroSprite.prototype.getY = function() {
        var frameQueue = this.frameQueue;
        if (frameQueue.length > 0) {
            return frameQueue[frameQueue.length - 1][2];
        } else {
            return this.y;
        }
    };

    HeroSprite.prototype.faceRight = function(map) {
        this.frameQueue.unshift([this.frames["hero_face_right.png"], this.x, this.y, 0, 0]);
    };

    HeroSprite.prototype.moveRight = function(map) {
        var mapLen = map[0].length;
        var frames = this.frames;
        var y = this.y;
        var x = this.x + 1;
        if (x < mapLen && map[y][x] == 0) {
            this.x = x;
            this.frameQueue.unshift([frames["hero_walk_right.png"], x - this.frameStep, y, 3, 0]);
            this.frameQueue.unshift([frames["hero_face_right.png"], x, y, 0, 0]);
        } else {
            this.faceRight();
        }
    };

    HeroSprite.prototype.faceLeft = function(map) {
        this.frameQueue.unshift([this.frames["hero_face_left.png"], this.x, this.y, 0, 0]);
    };

    HeroSprite.prototype.moveLeft = function(map) {
        var mapLen = map[0].length;
        var frames = this.frames;
        var y = this.y;
        var x = this.x - 1;
        if (x >= 0 && map[y][x] == 0) {
            this.x = x;
            this.frameQueue.unshift([frames["hero_walk_left.png"], x + this.frameStep, y, 3, 0]);
            this.frameQueue.unshift([frames["hero_face_left.png"], x, y, 0, 0]);
        } else {
            this.faceLeft();
        }
    };

    HeroSprite.prototype.faceUp = function(map) {
        this.frameQueue.unshift([this.frames["hero_face_up.png"], this.x, this.y, 0, 0]);
    };

    HeroSprite.prototype.moveUp = function(map) {
        var mapLen = map.length;
        var frames = this.frames;
        var x = this.x;
        var y = this.y - 1;
        if (y >= 0 && map[y][x] == 0) {
            this.y = y;
            this.frameQueue.unshift([frames["hero_walk_up.png"], x, y + this.frameStep, 3, 0]);
            this.frameQueue.unshift([frames["hero_face_up.png"], x, y, 0, 0]);
        } else {
            this.faceUp();
        }
    };

    HeroSprite.prototype.faceDown = function(map) {
        this.frameQueue.unshift([this.frames["hero_face_down.png"], this.x, this.y, 0, 0]);
    };

    HeroSprite.prototype.moveDown = function(map) {
        var mapLen = map.length;
        var frames = this.frames;
        var x = this.x;
        var y = this.y + 1;
        if (y < mapLen && map[y][x] == 0) {
            this.y = y;
            this.frameQueue.unshift([frames["hero_walk_down.png"], x, y - this.frameStep, 3, 0]);
            this.frameQueue.unshift([frames["hero_face_down.png"], x, y, 0, 0]);
        } else {
            this.faceDown();
        }
    };

    var GameEngine = function(el, options) {
        this.options = $.extend({
            mapUrl: 'map.json',
            spriteSheetUrl: 'sprites.png',
            spriteSheetMetaUrl: 'sprites.json',
            tileSize: 64,
            mapWidth: 6,
            mapHeight: 6
        }, options);

        this.el = el;
        this.$el = $(el);

        this.map = null;
        this.frames = null;
        this.spriteSheet = null;

        this.canvas = null;
        this.ctx = null;

        this.tileLookup = null;
        this.tileFactory = null;
        this.bgRenderer = null;
        this.heroSprite = null;
    }

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
    };

    GameEngine.prototype.onAssetsLoad = function() {
        if (this.spriteSheet.naturalWidth && this.frames && this.map) {
            this.initCanvas();
            this.initTiles();
            this.initSprites();
            this.initHero();
            this.initKeyListener();
            this.animate();
        }
    };

    GameEngine.prototype.initCanvas = function() {
        var canvas = this.canvas = document.createElement('canvas');
        var ctx = this.ctx = canvas.getContext('2d');

        var canvasWidth = this.options.tileSize * this.options.mapWidth;
        var canvasHeight = this.options.tileSize * this.options.mapHeight;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        this.el.appendChild(canvas);
    };

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
            this.map, this.tileLookup, this.tileFactory, this.options.tileSize);
    };

    GameEngine.prototype.initSprites = function() {
        this.spriteRenderer = new SpriteRenderer(
            this.map, this.frames, this.spriteSheet, this.options.tileSize);
    };

    GameEngine.prototype.initHero = function() {
        this.heroSprite = new HeroSprite(
            this.frames, this.spriteSheet, this.map, this.options.tileSize);
        this.heroSprite.faceRight(this.map);
    };

    GameEngine.prototype.animate = function() {
        var self = this;

        if (this.heroSprite.hasFrames()) {
            this.bgRenderer.draw(this.ctx, this.heroSprite.getX(), this.heroSprite.getY());
            this.spriteRenderer.draw(this.ctx, this.heroSprite);
        }

        requestAnimationFrame(function() {
            self.animate();
        });
    };

    GameEngine.prototype.initKeyListener = function() {
        var self = this;
        this.$el.keyup(function(e) {
            if (e.which == 39) {
                self.heroSprite.moveRight(self.map);
            } else if (e.which == 37) {
                self.heroSprite.moveLeft(self.map);
            } else if (e.which == 38) {
                self.heroSprite.moveUp(self.map);
            } else if (e.which == 40) {
                self.heroSprite.moveDown(self.map);
            } else {
                return;
            }
            e.preventDefault();
        });
    };

    var gameEngine = new GameEngine(document.body);
    gameEngine.init();

})(window);
