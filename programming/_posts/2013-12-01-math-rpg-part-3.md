---
layout: post
title: "Math RPG - Part 3: Pixel art"
---

Thanks to the "Don't Break the Chain" method, I made decent progress on the game engine this week. Still not where I want to be, but I'm happy that I put in at least an hour each day this week. It definitely adds up and I'm finding it easier to get started. Ideally I'd work on this project out of sheer compulsion. Unfortunately that's just not how I work. Apparently the only option is to trick myself with a calendar full of red X's.

In terms of the game engine, I mainly worked on improving the character animation and scrolling the background. A good chunk of that time was spent drawing and redrawing all the frames for the animation. It's a slow process. But I've definitely made improvements in terms of quality. Here's a screenshot of what I have so far.

![RPG exploration mode screenshot](/images/rpg_exploration_mode.png)

For the pixel art, I tried Inkscape, AeSprite and PixieEngine.com before stumbling upon [Pixen](http://pixenapp.com/). If you're on OSX, Pixen is definitely the way to go. Layer support is very helpful.

Reasons why I didn't choose the others:

- __Inkscape__: Not great for pixel art and unfortunately not too usable on OSX.
- __AeSprite__: Very buggy and crashed. Hard to use UI.
- __PixieEngine.com__: Pretty good editor and it's online. I drew the grass and cliff background tiles using it. Unfortunately there's no support for layers.

For the sprite sheet I'm using [TexturePacker Lite](http://www.codeandweb.com/texturepacker). It makes generating sprite sheets incredibly easy. Huge time-saver.

![RPG Sprite sheet](/images/rpg_sprites.png)

As you can see from the screenshots, the tiles are very square and don't look great when tiled. It definitely doesn't create the illusion that the character is in a free-flowing world. The grid is fairly blatant. Luckily one of the tutorials I'm working on off explains how to make the world less grid-like. Just haven't gotten to it since I'd need to redraw the background tiles in Pixen. If you look carefully, the background tiles are higher resolution (64x64) than the character sprite (32x48) which is scaled 2x currrently.

{% highlight json linenos %}
[
    [2, 2, 2, 1, 2, 2, 0, 2, 2, 1, 2, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0],
    [2, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0],
    [2, 2, 0, 1, 0, 0, 0, 2, 2, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0],
    [2, 2, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 2, 2],
    [2, 0, 0, 0, 0, 2, 0, 0, 1, 1, 2, 2],
    [2, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    [2, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]
]
{% endhighlight %}


Here are some pixel art tutorials that I found helpful:

- [Lotusware's Pixel Art Tutorial](http://rpgtoolkit.net/tutorials/graphics/lotuswares-pixel-art-tutorial/)
- [Final Boss Blues: Pixel Tutorials](http://finalbossblues.com/pixel-tutorials/)
- [FF6 Style Sprite Tutorial](http://ghost0311.deviantart.com/art/Sprite-Tutorial-30322970)
- [RPG Sprite Tutorial](http://kevinvanderven.deviantart.com/art/rpg-sprite-tutorial-152649865)

I also experimented with the combat engine. I'll probably write about that next week. Until then here's a quick screenshot.

![RPG combat engine](/images/rpg_combat_engine.png)