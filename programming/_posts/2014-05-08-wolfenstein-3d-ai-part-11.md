---
layout: post
title: "Wolfenstein 3D - Part 11: Putting it all together"
---

The previous posts illustrated different techniques that could be used in an AI to beat Wolfenstein 3D using machine vision. Actually applying the techniques together in real-time proved to be difficult, but it was necessary to start the test runs. The current bot uses a simple state machine to perform tasks such as localization, door searching, and attacking enemies. The code is very rough at the moment. There is still along way to go before the bot can beat the first level of the game, but it’s definitely possible.

### Demo 1 - Wall measurements, door and enemy detection

<div style="padding:60% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/94488547?byline=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

### Demo 2 - Wall measurements and door detection

<div style="padding:60% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/94488548?byline=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

### State 1: Localize

The localize state is where the bot measures the wall heights and tries to locate itself on the map using a particle filter. The particle filter is not yet implemented. Currently the bot just takes readings of the walls.

Wolf3D uses ray-casting to render the graphics and because of the lack of processing power in the early 90's, all the walls are the same height. This means no staircases to walk up or down. No inclines or domes.

This fact allows us to accurately measure the distance to the walls by reversing the ray-casting calculations.

Before stumbling on raycasting and how it is applied in Wolf3D, extensive testing was done figure out the best way localize the character with the the wall information. At the moment it’s still not clear if the wall measurements will work. A rough particle filter implementation may be needed first.

Maps in Wolf3D are 2d arrays of size 64x64. There are actually two arrays. One contains walls and paths, and the other contains items, enemies, decorations, etc.

To calculate the distance to a wall based on the height of the wall, we can reverse the following equation: **(Real height of wall) / (Distance from wall) = (Rendered height of wall)**

To get distance, we can calculate: **(Real height of wall) / (Rendered height of wall)
 = (Distance from wall)**

One of the current issues with measuring walls is the lack of a compass. Currently it’s not too clear how to handle this. Again, a particle filter implementation could solve this problem.

### State 2: Find Door

The find door state works by having the character spin in a circle until a door is detected. The bot then transitions to a state where it will run toward the door, open it, and run through.After that there will be a four second pause for the door to close. This is done to make sure the measurements are accurate.

This strategy works well, but the problem is that the bot will end up choosing the first door it sees. During trial runs, the bot tends to keep going back and forth between rooms. Currently there is no way of knowing that a room has been visited.

Additionally the bot has trouble with rooms that contain multiple corridors and turns. Without other doors to follow, it will go out the same door.

### State 3: Attack Enemy

Currently the bot will search for an enemy if under attack. The bot knows it’s under attack if the health bar changes.

Basically the health bar section is background subtracted on every frame. If there is even one change, it means an enemy is attacking.

This forces the bot to change into the attack state. The bot will then spin in a circle looking for the enemy. The problem here is that the spin is very slow. This is due to the amount of computation for the enemy detector.

The other issue, which was detailed in an earlier post, is that a red overlay covers the screen when the bot is attacked. Since enemy detection is based on color, the enemy is not detected.
