---
layout: post
title: "Wolfenstein 3D AI - Part 7: Door thresholding experiment"
---

SIFT is an awesome algorithm, but it is somewhat computational expensive despite many optimizations to improve performance. In games, fast responses are important for success, so even few milliseconds of delay could be detrimental on the harder difficulty levels of Wolfenstein 3D. Additionally one could argue that the simpler solution is the best solution. Thresholding can be effective in Machine Vision problems because the program can be optimized to the problem domain instead of being generalized to say many different games.

In terms of this project, I would like to work toward more human-like game interactions, but that will be a slow process. It may be better to learn from simpler Machine Vision solutions in the intermediary.

Since Wolfenstein 3D uses simple bitmap graphics with a small number of colors, we can probably optimize the program using this knowledge. For instance the ceiling and walls are solid grays, which makes them easy to targets for thresholding and removal to isolate walls.

The doors are also good targets since they are a distinct teal color. There is some shading on the door, so the RGB values vary. One thing could be done is to convert RGB to HSL format. That has not been attempted as of this writing.

**Fig. 1 - Threshold ceiling and floor with GIMP**

![Threshold ceiling and floor with GIMP](/images/wolf3d/gimp_wall_segment.png)

**Fig. 2 - Test image for door threshold**

![Test image for door threshold](/images/wolf3d/door_segment_test_image1.png)

**Fig. 3 - Attempt to threshold door as a grayscale image**

![Attempt to threshold door as a grayscale image](/images/wolf3d/door_segment_grayscale.png)

**Fig. 4 - Door segmentation using thresholds on Fig. 3**

![Door segmentation using thresholds on Fig. 3](/images/wolf3d/door_segment_rgb1.png)

**Fig. 5 - Another door test image**

![Test image for door threshold 2](/images/wolf3d/door_segment_test_image2.png)

**Fig. 6 - Door segmentation on Fig. 5**

![Door segmentation on Fig. 5](/images/wolf3d/door_segment_rgb2.png)
