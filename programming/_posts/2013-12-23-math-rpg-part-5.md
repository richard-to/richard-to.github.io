---
layout: post
title: "Math RPG - Part 5"
---

I made good progress on the combat system, I still got a ways to go before the game can be considered fun. As usual I would've liked to have done more. To help keep me on track I started using the Github issue tracker - normally I use Trello, but thought it would be best to keep my efforts public. My [first milestone](https://github.com/richard-to/rpg/issues?state=open) was to finish parts of the combat system this week. Unfortunately I didn't complete the milestone. I went off track and spent a few days on sprite work instead of the combat system.

Here is a list of sprite/graphics improvements:

- Improved water, grass, and cliff tiles
- Added edge tiles to hide the grid better
- Added two enemy sprites
- Added character sprite for Corinna
- Added flashing circles to identify selected enemies or heroes.
- Added damage value underneath character when attacked

Here is a screenshot of the improved background tiles and the new character Corrina.

![Exploration View](/images/p6_explore.png)

Here is a screenshot of the new enemies: Eyeball Scout and Evil Bear.

![Combat View](/images/p6_combat.png)

These new sprites poked a number holes in my code. For example when I added new sprites, the system no longer handled walkable tiles correctly. This is because I was originally checking for my single grass tile. Now I have multiple grass tiles to account for. In the short term, I had planned to keep the maps simple by using numbers to represent tiles. This would allow me to create maps in JSON and avoid a map editor utility. Unfortunately this means that I map metadata cannot be added to the map file. Right now I'm trying to figure how to handle map metadata better. I'm worried that my quick fix will lead to more issues down the road.

Here is a screenshot of the new spritesheet:

![Sprite sheet](/images/rpg_spritesheet_v2.png)

I find myself refactoring a lot code as new issues arise. My code at each step so far has been just good enough for the feature I worked on, but then once I move on to a new feature, the code is suddenly inadequate. I'm not sure if this is the best approach. I keep wondering if I should do more planning and try to look further into the future.

For next week, I just want to complete my first milestone. I think it's important that I stay on track and restrain  from over-abstracting the code and doing more sprite improvements.

Here is a demo with the new sprites, enemies, and characters. You can also enter combat mode. Just know that the only option is to attack and the characters/enemies never die. You can [view the demo here](/projects/rpg/demo-2/).