---
layout: post
title: "Wolfenstein 3D - Part 9: Detecting enemies"
---

Detecting enemies was much harder than detecting doors. The enemies wear tan-colored images. Unfortunately this hue is similar to the player’s hand and also some of the walls are brown.

Additionally when the enemy is shooting at you, a red overlay flashes on the screen. This makes detecting based on color difficult. One solution is to reverse the red overlay, which is definitely possible. But in the long run, it may be better to detect based on shaped. Color is not the best way to detect objects due to lighting.

The enemy sprite got labelled as many different parts instead of one object. To deal with this issue, OpenCV dilate was used to fill the holes in the binary image a bit. Dilate is actually run twice here. 

Another downside of this solution is the amount of computation needed. This is not good when the enemy is shooting at you.

**Fig. 1 - One of the test images for detecting enemies**

![Test image](/images/wolf3d/part9/enemy_ex1.jpg)

**Fig. 2 - Threshold of Fig. 1 using hue range**

![Threshold on enemy](/images/wolf3d/part9/enemy_thresh_1.jpg)

**Fig. 3 - Objects in thresholded images labelled**

![Object labelling on enemy](/images/wolf3d/part9/enemy_label_1.jpg)

**Fig. 4 - Improved object labelling by applying OpenCV dilate beforehand**

![Object labelling on enemy](/images/wolf3d/part9/enemy_label_2.jpg)

**Fig. 5 - COM objects labelled in Fig. 3**

![COM on enemy attempt 1](/images/wolf3d/part9/enemy_com_1.jpg)

**Fig. 6 - Example of enemy detection actually working**

![Working COM on enemy](/images/wolf3d/part9/enemy_com_6.jpg)

**Fig. 7 - Example of enemy detection getting tricked by brown walls**

![False positives with enemy detection](/images/wolf3d/part9/enemy_com_4_false.jpg)

**Fig. 8 - Red overlay makes it so enemy is not detected**

![Change in color affecting enemy detection](/images/wolf3d/part9/enemy_red.png)