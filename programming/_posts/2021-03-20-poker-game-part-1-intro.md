---
layout: post
title: "WebRTC Poker Game - Part 1: Introduction"
---

This post is an introduction to a series of posts about the WebRTC poker game that I have been working on.

The initial goal of this project was to create an application that utilized WebRTC. I did not want to do a basic two-person chat application since that would be too simple. I felt like I would learn more if I picked something that was more realistic.

I decided on poker since it can be a fun game. In addition, having a visual representation of one's face adds the aspect of being able to read a player for tells, which is missing from online poker games that I have tried in the past. Granted it is understandable why video/audio is not a feature. Most people would turn their cameras/audio off to gain an advantage. In addition, serious online poker players will usually be playing multiple tables at once. Plus the additional bandwidth to handle video streams is probably not worth it. However, for casual game play, having video and audio adds a nice social element, especially during the pandemic.

One of the unexpected outcomes of this project was that I ended up spending more time working on the non-WebRTC aspects of the game. I underestimated the complexity of building a poker engine and game server from scratch. But it was a lot of fun.

The frontend uses React, Tailwind CSS, Simple Peer, and Framer Motion (for basic card animations). Aside from React, I had never used the other three libraries.

The backend poker library and game engine is written from scratch using Go. Gin Gonic and Gorilla are used for the web socket server.

Google App Engine is used for hosting the app. I chose it since I thought it would save time. It took a day to figure out how to correctly deploy the app. In the end I probably did not save any time. But it was a good learning experience.

## Posts in this series

- [User interface](/programming/poker-game-part-2-ui.html)
- [Tailwind CSS](/programming/poker-game-part-3-tailwind.html)
- [Google App Engine](/programming/poker-game-part-4-google-app-engine.html)

## Repository

The Github repository can be found here:

- [https://github.com/richard-to/poker](https://github.com/richard-to/poker)
