---
layout: post
title: "Wolfenstein 3D - Part 8: More door thresholding"
---

In the previous post about door thresholding, the strategy was to use RGB. The results were not sufficient. After studying the doors further, HSV proved to be a good choice since the hue remained roughly the same among the different shades of teal. This only worked because the game does not apply dynamic lighting.

The next challenge was segmenting the doors so that the COM algorithm could be applied. Instead of using OpenCV, I wrote a custom object labeller based on the algorithm in the Davies CMV book. The implementation is not perfect as can be seen in Fig 1.8.

The other challenge was making sure that non-doors were not detected. That particular hue is used on a few paintings and were initially marked as doors. This was fixed by applying a simple binary histogram. If the object was less than 50% black, then it was not considered a door. 

Additionally the side panels of the doors were being marked separately. This is good in that an occluded door can still be spotted if the side panel is visible. On the other hand, this increased the difficulty of honing in on the actual door.

**Fig. 1 - Test image to make sure only doors were detected**

![Test image](/images/wolf3d/part8/door.png)

**Fig. 2 - Result of thresholding on turquoise hue**

![HSV Threshold](/images/wolf3d/part8/door_thresh_2.jpg)

**Fig. 3 - Result of object labelling on the thresholded image**

![HSV Object Labelling](/images/wolf3d/part8/door_segment_1.jpg)

**Fig. 4 - Result of COM on labelled objects in image**

![Door COM tracking](/images/wolf3d/part8/door_com_1.jpg)

**Fig. 5 - Result of COM on labelled objects after adjustments for width/height ratio and binary histogram analysis**

![Door COM tracking](/images/wolf3d/part8/door_com_2.jpg)

**Fig. 6 - Result of door detection with two doors**

![Door COM tracking with 2 doors](/images/wolf3d/part8/door_com_3.jpg)