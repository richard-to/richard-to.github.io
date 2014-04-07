---
layout: post
title: "Math RPG - Part 9: Importing image sprites on Khan Academy CS platform"
---

Since the semester started, I haven't worked on my Math RPG project. Most of my time has been spent memorizing terms in my Anatomy and Physiology course and working on some smaller programming projects. One of those projects was an attempt to port my RPG to the Khan Academy Computer Science platform. There are some cool programs there, especially the 3D-Minecraft program created by John Resig. My first experiment was to see if I could use my sprites on their platform since external images are not allowed for obvious reasons.

There were already programs that imported images using various techniques. One popular approach imported jpeg images using an image optimization algorithm and then generated the necessary function calls to draw the image.

Since the sprites I planned to used were small images (32x32 or 48x32), my simple solution was to convert the bitmap data into a 2D array of RGB values. Pasting this array into the KA CS platform caused the editor to freeze and lag. Eventually I was able to write the code necessary to draw the sprite mainly using the point() function.

The demo using this approach can be seen [here](http://www.khanacademy.org/cs/pixel-drawing-attempt-1-slow/4828335093841920).

{% highlight javascript linenos %}
var imageDataHeight = imageData.length;
var imageDataRow = null;
var imageDataWidth = null;
var x = 0;
var j = 0;
var y = 0;

var r = 0;
var g = 0;
var b = 0;
var a = 0;

for (y = 0; y < imageDataHeight; ++y) {
    j = 0;
    x = 0;
    imageDataRow = imageData[y];
    imageDataWidth = imageDataRow.length;
    while (j < imageDataWidth) {
        x = Math.floor(j/4);

        r = imageDataRow[j];
        ++j;
        g = imageDataRow[j];
        ++j;
        b = imageDataRow[j];
        ++j;
        a = imageDataRow[j];
        ++j;

        if (a !== 0) {
            stroke(r,g, b);
            point(x, y);
        }
    }
}
{% endhighlight %}

My first optimization was to use a hash table to look up RGB values. This was possible since the images use a limited set of colors. Here is a [link to this demo](http://www.khanacademy.org/cs/pixel-drawing-attempt-2-slightly-faster/5605398025338880).

Although performance improved, this approach didn't seem scalable to multiple animated images, so I looked for other solutions.

{% highlight javascript linenos %}
var colorTable = [0,[48,48,48],[102,102,102],[41,41,41],[130,130,130],[115,115,115],[146,146,146],[96,96,96],[85,56,45],[96,64,52],[122,122,122],[103,69,56],[39,39,39],[115,78,64],[236,192,168],[235,206,188],[235,206,189],[240,220,209],[236,198,177],[172,123,113],[255,255,255],[113,82,74],[156,76,63],[96,53,59],[108,60,67],[130,74,82],[236,194,171],[115,64,72],[85,85,85],[66,66,66],[45,45,45],[181,166,158],[81,81,81],[87,87,87],[92,92,92],[153,121,36],[163,129,39],[202,186,176],[79,79,79],[80,80,80],[215,197,187],[89,89,89],[71,71,71],[64,64,64],[63,63,63],[58,58,58],[44,44,44]];

var imageDataHeight = imageData.length;
var imageDataRow = null;
var imageDataWidth = null;

var x = 0;
var y = 0;

var colorCode = 0;
var colorRGB = [];
pushMatrix();
scale(2);
for (y = 0; y < imageDataHeight; ++y) {
    imageDataRow = imageData[y];
    imageDataWidth = imageDataRow.length;
    for (x = 0; x < imageDataWidth; ++x) {
        colorCode = imageDataRow[x];
        if (colorCode !== 0) {
            colorRGB = colorTable[colorCode];
            stroke(colorRGB[0], colorRGB[1], colorRGB[2]);
            point(x, y);
        }
    }
}
popMatrix();
{% endhighlight %}

When I inspected the code from the 3D Minecraft program, I noticed that the canvas element was used. This turned out to be somewhat of a hack since the canvas element is normally not accessible. The hack involves knowledge of how Processing JS works and considering John Resig developed Processing JS and is involved with the Khan Academy CS program, it makes sense that he knew how to get around the restrictions.

The tricky part was figuring out how to modify the code to work for my use case. Access to to the canvas element would definitely make it possible to render animated sprites with good performance. The hack seems to involve overriding certain functions used during initialization of either Processing JS or the Khan Academy CS platform. It's difficult to determine what modifications are needed, but my set of changes worked and allowed me to draw a static background with my characters. [The demo can be viewed here.](http://www.khanacademy.org/cs/pixel-drawing-attempt-3-even-faster/6726213898862592)

![Math RPG in Khan Academy CS Program](/images/rpg-in-khanacademy-cs.png)

The next step would be to further optimize the size of the sprites. When there are multiple sprite arrays pasted into the editor, it can crash Chrome and make you lose all your work since there is no auto-save. What I have in mind is maybe using a discrete cosine transforms (DCT) and huffman encoding. I'm not sure if those techniques will help much. Mostly, I just interested in learning how to implement those algorithms.

Here is the relevant snippet of code:

{% highlight javascript linenos %}
var nvDraw;

var nv = {
    entered: false,
    hisDraw: null,
    reInit: function(props) {
        var h = this;
        if (h.hisDraw === null) {
            h.hisDraw = draw;
            draw = nvDraw;
        }
    },
    renderWorld: function() {
        canvasMeta.ctx.imageSmoothingEnabled = false;
        var tileId = 0;
        var tile = 0;
        var gx = 0;
        var gy = 0;
        for (var x = 0; x < 7; ++x) {
            gy = 0;
            for (var y = 0; y < 7; ++y) {
                tileId = map[x][y];
                tile = tiles[tileId];
                canvasMeta.ctx.drawImage(
                    tile.canvas, 0, 0, tile.w, tile.h,
                    gy, gx, tile.w * 2, tile.h * 2);
                gy += 64;
            }
            gx += 64;
        }
    },
    renderSprite: function() {
        canvasMeta.ctx.imageSmoothingEnabled = false;
        canvasMeta.ctx.drawImage(
            corrinaSprite.canvas, 0, 0, corrinaSprite.w, corrinaSprite.h,
            128, 128, corrinaSprite.w * 2, corrinaSprite.h * 2);
        canvasMeta.ctx.drawImage(
            sethSprite.canvas, 0, 0, sethSprite.w, sethSprite.h,
            192, 128, sethSprite.w * 2, sethSprite.h * 2);
    },
    renderAll: function() {
        var h = this;
        if (!h.entered) {
            h.enter = true;
            h.renderWorld();
            h.renderSprite();
            h.hisDraw();
            h.enter = false;
        }
    }
};

draw = function() {};

nvDraw = function() {
    resetMatrix();
    nv.renderAll();
};

var createCanvas = function() {
    canvasMeta.pimg = createImage(canvasMeta.w, canvasMeta.h, 1);
    canvasMeta.canvas = canvasMeta.pimg.sourceImg;
    canvasMeta.ctx = canvasMeta.canvas.getContext("2d");
};

var createSprite = function(sprite) {
    sprite.pimg = createImage(sprite.w, sprite.h, 1);
    sprite.canvas = sprite.pimg.sourceImg;
    sprite.ctx = sprite.canvas.getContext("2d");
    sprite.ctx.imageSmoothingEnabled = false;
    sprite.pixels = sprite.ctx.createImageData(sprite.w, sprite.h);
    var pixels = sprite.pixels;
    var length = sprite.data.length;
    var idx = 0;
    var rgb = [];
    for (var i = 0; i < length; ++i) {
        rgb = colorTable[sprite.data[i]];
        if (rgb !== 0) {
            idx = i * 4;
            pixels.data[idx + 0] = rgb[0];
            pixels.data[idx + 1] = rgb[1];
            pixels.data[idx + 2] = rgb[2];
            pixels.data[idx + 3] = 255;
        }
    }
    sprite.ctx.putImageData(sprite.pixels, 0, 0);
};

var initDone = 0;

var canvasMeta = {
    canvas: null,
    ctx: null,
    pixels: null,
    pimg: null,
    w: 400,
    h: 400
};

var corrinaSprite = {
    data: corrinaData,
    canvas: null,
    ctx: null,
    pixels: null,
    w: 32,
    h: 48
};

var sethSprite = {
    data: sethData,
    canvas: null,
    ctx: null,
    pixels: null,
    w: 32,
    h: 48
};

var grassSprite = {
    data: grassData,
    pimg: null,
    canvas: null,
    ctx: null,
    pixels: null,
    w: 32,
    h: 32
};

var cliffSprite = {
    data: cliffData,
    pimg: null,
    canvas: null,
    ctx: null,
    pixels: null,
    w: 32,
    h: 32
};

var waterSprite = {
    data: waterData,
    pimg: null,
    canvas: null,
    ctx: null,
    pixels: null,
    w: 32,
    h: 32
};

var sprites = {
  corrina: corrinaSprite,
  seth: sethSprite,
  grass: grassSprite,
  water: waterSprite,
  cliff: cliffSprite,
};

var tiles = [
    grassSprite,
    cliffSprite,
    waterSprite
];

var map = [
    [1, 1, 1, 1, 2, 2, 2],
    [1, 0, 0, 0, 2, 0, 1],
    [2, 0, 0, 0, 0, 0, 1],
    [2, 0, 0, 0, 0, 0, 2],
    [1, 0, 0, 1, 0, 0, 2],
    [1, 2, 2, 1, 1, 0, 1],
    [1, 2, 2, 1, 1, 1, 1],
];

var init = function() {
    for (var key in sprites) {
        createSprite(sprites[key]);
    }

    createCanvas();

    initDone = 2;
    nv.reInit();
};

draw = function() {
    if (initDone >= 2) {
        image(canvasMeta.pimg, 0, 0, canvasMeta.w, canvasMeta.h);
    } else if (initDone === 0) {
        initDone++;
    } else{
        init();
    }
};

})();
{% endhighlight %}
