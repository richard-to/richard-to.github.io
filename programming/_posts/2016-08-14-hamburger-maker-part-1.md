---
layout: post
title: "Hamburger Maker Part 1: Monolith Burger, Phaser, Boxy SVG"
---

Because I work for a company that works with restaurant health inspections, I have had this idea to develop a hamburger maker game based on the part in Space Quest IV where Roger Wilco travels to Space Quest X: The Latex Babes of Estros. Once there, you can plan various mini-games in the mall, one of which is Monolith Burger.

![Space Quest IV Monolith Burger](/images/monolith_burger.jpg)

I'm mostly using the Monolith Burger as inspiration. The game itself is not that fun, so one of the goals is to make Hamburger Maker more fun. I already have an idea for a sequel called Super Hamburger Maker, which would be a multiplayer version.

To build the Hamburger Maker, I have settled on the javascript game library Phaser. So far I really like it. The documentation is solid and there are a lot of examples. In addition the code examples are runnable and editable online. This is definitely a step in the right direction in terms of documentation. On a side note, I'm not too sold on Stackoverflow Documentation yet. It's early, but something about the navigation and layout of the documentation and examples seems unfriendly.

Phaser has allowed me to develop a basic demo in two-three hours of programming. The API makes sense and has covered my basic use cases so far: click events, drag and drop, sprites, text, game loop.

Most of my time has been spent drawing the sprites: lettuce, ketchup, tomatoes, onions, etc. For that I chose Boxy SVG, which is a great Chrome App--lightweight, fast, easy to use. The alternatives where Illustrator, which I find unbearably slow on my laptop and Inkscape, which does not work too well on OSX.

Now that the sprites have been drawn, I'm starting to think about gameplay mechanics, specifically how to make this somewhat fun.

## Links

- [Working Demo](http://richard.to/hamburger-maker/)
- [Github Repository](https://github.com/richard-to/hamburger-maker)

![Hamburger Maker Demo](/images/hamburger-maker.png)
