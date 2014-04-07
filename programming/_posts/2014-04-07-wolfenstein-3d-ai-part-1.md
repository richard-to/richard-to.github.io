---
layout: post
title: "Wolfenstein 3D AI - Part 1: Requirements"
---

I've been enjoying my Computer and Machine Vision course this semester. I like it because it's challenging and makes me want to get better at math. Specifically I need to learn Linear Algebra and get started on Calculus III material. After that, maybe bulk up on more statistics. A new appreciation for math has been the main benefit of working on a computer science degree. Math is amazing, and I think that hints at how to make math relevant to kids. As usual I'm getting off topic. The main point of this post is to go through some rough requirements for a Machine Vision project that I'm working on now. Specifically I want to use develop an AI to play Wolfenstein 3D via a Kinect and Beagleboard xM.

**Fig. 1 - Shareware Wolfenstein 3D running on DOS Box and Ubuntu**

![Wolf3D Gameplay on DOSBox](/images/wolf3d/door_segment_test_image1.png)

This a relatively complicated project. So the plan is to break down the project into smaller sub projects or exercises.

1. Run Wolfenstein 3D in Linux **(Completed)**
  - Wolfenstein 3D was written for DOS in the early 90’s. Luckily there is a DOS emulator called DOS Box.
  - The alternative was running a web-based version of the game.
2. Continuous game footage can be processed in C++ **(Completed)**
  - In the initial stages, game footage will be retrieved from X11 server using XLib for C++
3. Send keyboard commands to game in C++ **(Completed)**
  - Key events can be sent to X11 server using XLib
4. Implement SIFT from ground up
  - Implement function to scale up an image with Linear interpolation **(Completed)**
  - Implement function to scale down an image by sampling every other row/column **(Completed)**
  - Implement function to perform gaussian blur **(Completed)**
  - Implement function to normalize uchar to float values between 0 and 1 **(Completed)**
  - Implement function to build scale space pyramid **(Partial)**
    - Not sure if implementation is correct
  - Implement extrema detection **(Partial)**
    - Again not sure if implementation is correct
  - Orientation Assignment
  - Local Image Descriptor
  - Descriptor Testing
  - Keypoint Matching
5. Test effectiveness of SIFT on Wolfenstein 3D **(Partial)**
  - Ran a simple test to see how well OpenCV SIFT detected doors. Decent results
6. Test simpler alternatives to SIFT for object detection in Wolfenstein 3D game **(Partial)**
  - Used basic thresholding techniques to detect doors with GIMP and OpenCV
  - Thresholding may be enough in the scenario where
7. Detect and move toward doors
  - Compare performance of thresholding, Open CV Sift, and maybe ground up Sift
8. Detect and kill enemies
  - Enemy attacks from behind can be detected by change in health bar.
  - Compare performance of thresholding, Open CV Sift, and maybe ground up Sift
9. State Machine to handle AI states
  - Search mode
    - Default mode. Essentially follow doors.
  - Attack mode
    - Entered if enemy detected
    - Entered if enemy is attacking
  - Localize mode
    - Entered every few seconds unless attacked
10. Localization using particle filter algorithm
   - Ideally I want to use SLAM to build the map, but this is a good intermediary step.
   - Need to figure out how to calculate distance effectively
   - One strategy that someone else used was measuring height of walls
   - Use thresholding to isolate walls
11. Optimizations to beat first level
   - Not sure what these will be yet.
12. Weapon, ammo, health, treasure detection
   - On higher difficulty levels, being able to find power ups will be helpful, but not too relevant to this project
13. Use Kinect and Beagleboard xM to process images instead of using X11 directly
   - Need a way to send key commands to laptop from Beagleboard
   - Need a way to process images effectively since viewing angle/distance, glare and tracking the game window will likely be a huge problem.
   - Need to account for processing power of Beagleboard
   - Beagleboard can’t display GUI visualizations at the same time when running the Kinect. Headless modes seem plausible
   - Thresholding will probably not work well. May need to calibrate colors first 
14. Implement SLAM
   - Ideally want the AI to learn the map on its own, based on what is seen

