---
layout: post
title: "Math RPG - Part 11: More with image sprites on Khan Academy CS platform"
---

The Math RPG is still on the backburner and will be until project
Wonderchicken is completed. Lately I've been making a conscious effort to focus
on one side project at a time instead of juggling 3-4. Mentally it is
challenging to handle the context switches and build any sort of momentum. But
back to the topic at hand. A few months ago, I was exploring the Khan Academy
iPad app and ran into a trailer for all the cool projects that students created
on their CS platform. Gameplay of what looked to be Super Mario Bros. 3 was
shown, so I looked up the project and noticed that the author had found a
workaround that let him load external javascript and other assets, such as
images and even audio at one point. That was impressive.

A bit of background. The Khan Academy CS platform does not allow the use of
external assets, most notably images. And of course, this has led to many
students finding clever workarounds. One obvious solution is to encode the RGB
values into a big array and then redraw the image. The problem with this
is that the amount of data required to encode the image becomes very
large and can slow down or crash the browser. This restriction is
unintentionally a good feature, since it brings out the, I guess,
"hacker spirit", which is an important trait to being a programmer.

The restrictions on external image usage has always been roadblock for porting
the Math RPG engine to the Khan Academy CS platform. The other issues being
laziness and lack of time.

But so after exploring the code Super Mario Bros. 3 code, I naturally tried to
reverse engineer the workaround. This was a bit tricky since the code was
obfuscated in a bunch of nested anonymous functions, of which it was not clear
whether they were required or not. Eventually I was able to simplify the
workaround to something understandable.

As an aside, I privately reported this workaround to a member of the Khan
Academy CS platform team. It is surprisingly difficult to report an issue in
private. There looks to be a way for reporting bugs and comments in a
public forum, but no private messaging. I ended up going to the team member's
personal blog. I'm only writing about this now that the workaround has been
blocked using a whitelist against urls outside the Khan Academy sandbox domain.

Here is a screenshot of my spritesheet loaded into the Khan Academy CS platform:

![Math RPG spritesheet on Khan Academy CS platform](/images/spritesheet.png)

There are three tricks required for this to work:

**1.**

The external resources must be loaded after a event, such as a mouse press. This
is because code is probably validated and executed to check for restricted
 features. However code executed after events seem to be out of scope.

**2.**

Secondly, we need to access the global scope in order to access the image
element, which is needed to load the image url and then pass the data into the
canvas.

I'm not sure how it works, but the following code returns a global "this"

```js
var initLoader = function() {
    var loader = function(m) {
        // How is "this" global???
        var image_el = this.Image();
    }(this);
};
initLoader()
```

**3.**

The final trick for loading images is adding the "crossOrigin=anonymous"
attribute to the image element.

```js
/**
 * Trick to load spritesheet image based on the awesome Super Mario Bros demo by
 * JstuffJr.
 *
 * https://www.khanacademy.org/cs/super-mario-bros-3-the-game/1689985519
 *
 * --------------------------------------------------
 *
 * Instructions: Click on canvas to load sprite sheet.
 */

var pressed = false;
var spritesheet_url = "https://dl.dropboxusercontent.com/u/25789122/sprites.png";
var canvasMeta = {
    canvas: null,
    ctx: null,
    pixels: null,
    pimg: null,
    w: 400,
    h: 400
};

var initLoader = function() {
    var loader = function(m) {
        var base_image = new this.Image();
        base_image.setAttribute('crossOrigin','anonymous');
        base_image.src = spritesheet_url;
        base_image.onload = function() {
            canvasMeta.pimg = createImage(canvasMeta.w, canvasMeta.h, 1);
            canvasMeta.canvas = canvasMeta.pimg.sourceImg;
            canvasMeta.ctx = canvasMeta.canvas.getContext("2d");
            canvasMeta.ctx.drawImage(this, 0, 0);
        };
    }(this);
    pressed = true;
};

var mousePressed = function() {
    if (pressed === false) {
        initLoader();
    }
};

var draw = function() {
    if (canvasMeta.pimg) {
        image(canvasMeta.pimg, 0, 0, canvasMeta.w, canvasMeta.h);
    }
};
```
