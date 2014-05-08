---
layout: post
title: "Wolfenstein 3D - Part 10: Measuring walls"
---

Thresholding was once again used for measuring walls. Specifically the ceiling and floors are shades of gray. This does a good job except in a few cases, namely the case of ceiling lights or when the room has gray walls.

Not much could be done about the ceiling lights with thresholding, but the spots in the gray walls could be removed really well with dilation.

One alternative approach to measuring walls could have been edge detection with sobel.

The walls were measured starting from the center of the horizontal axis, and then counting white pixels up and down until a black pixel was reached. This approach backfires if the dilation does not remove enough speckles from the wall threshold.

**Fig. 1 - Example of wall measurement being affected by chandelier**

![Wall measurement with chandelier](/images/wolf3d/part10/wall_measure_1.jpg)

**Fig. 2 - Thresholding on gray ceiling and floor without dilation**

![Wall measurement with chandelier](/images/wolf3d/part10/wall_thresh_1.jpg)
