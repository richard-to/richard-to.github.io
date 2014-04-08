---
layout: post
title: "Wolfenstein 3D AI - Part 5: OpenCV SIFT test"
---

One of my worries is that SIFT may not work as well on Wolfenstein 3D. The resolution is only 640 x 480 at best and there aren't many colors used. The floor and ceiling and solid shades of gray - the reason for this is described in the awesomely great book "[Masters of Doom](http://en.wikipedia.org/wiki/Masters_of_Doom)" by David Kushner. To test, the viability of SIFT, I ran the OpenCV implementation of SIFT against some sample screenshots from the game.

One thing to note is that SIFT is patented in the U.S. This means that the Ubuntu build of OpenCV does not include SIFT and SURF implementations - ie. `sudo apt-get install libopencv-dev`. This change was made in OpenCV 2.4+. The algorithms can still be used, but they have been moved to a separate module named `nonfree` and must be built with the appropriate CMAKE parameters.

I ended up reinstalling OpenCV with this shell script: [https://github.com/jayrambhia/Install-OpenCV/blob/master/Ubuntu/2.4/opencv2_4_8.sh](https://github.com/jayrambhia/Install-OpenCV/blob/master/Ubuntu/2.4/opencv2_4_8.sh)

For the test, the following sample programs were used: 

 - [matcher\_simple.cpp](https://github.com/Itseez/opencv/blob/master/samples/cpp/matcher_simple.cpp)
   - This code was adjusted to use SIFT instead of SURF.
   - The result was disappointing since many points were matched incorrectly.
 - [descriptor\_extractor\_matcher.cpp](https://github.com/Itseez/opencv/blob/master/samples/cpp/descriptor_extractor_matcher.cpp).
  - Usage: `descriptor_extractor_matcher.cpp SIFT SIFT BruteForce NoneFilter door.jpg scene1.jpg 25`.
  - The last parameter is threshold for RANSAC, which makes it so not all key points are matched and resolves issue of `matcher_simple.cpp`


**Fig. 1 - Results of Simple matcher program**

![Simple Matcher Matcher 1](/images/wolf3d/simple_matcher_ex1.png)

**Fig. 2 - Results of Descriptor Extractor Matcher program with two doors**

![Descriptor Extractor Matcher 1](/images/wolf3d/descriptor_extractor_matcher_ex1.png)

**Fig. 3 - Results of Descriptor Extractor Matcher program with two doors and one partially occluded**

![Descriptor Extractor Matcher 2](/images/wolf3d/descriptor_extractor_matcher_ex2.png)


**Fig. 4 - Results of Descriptor Extractor Matcher program with no doors**

![Descriptor Extractor Matcher 3](/images/wolf3d/descriptor_extractor_matcher_ex3.png)