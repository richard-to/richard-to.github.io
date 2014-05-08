---
layout: post
title: "Betelbot - Part 1: Robosim demo videos"
---

Betelbot is the name my of failed autonomous robot project from last year. It's one of those projects that I want to restart and learn from my mistakes, specifically on the hardware/electronics side. edX has a promising [embedded systems course](https://www.edx.org/course/utaustinx/utaustinx-ut-6-01x-embedded-systems-1172) that I plan to work through in the summer. The hope is that that course will provide a stable foundation. Electronics is also an expensive hobby and I can't really afford to buy parts to build Betelbot 2.0 yet.

The following are some demo videos I recorded last year and forgot I had.


The first demo video shows the various nodes that work together to control Betelbot via WiFi.  Here, however, the robot simulator node is run instead of the actual hardware. The design of the software is highly influenced by the Robot Operating System (ROS). If I remember correctly, here are the list of nodes and their roles:

- Master node: Centralized server that manages communication between nodes
- Pathfinder node: Unified cost search based on Udacity: AI for robotics course
- Particle filter node: Particle filter based on Udacity: AI for robotics course
- Web app node: Provides a web interface for visualization and sending commands using Web Sockets
- Robosim node: Simulates robot hardware interface
- Teleop node: Control the robot using command line
- Listener node: Subscribes to all messages/topics

<div class="iframe-container">
<iframe src="//player.vimeo.com/video/91270479?byline=0&amp;portrait=0&amp;color=ececec" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>

***

The second video illustrates the use of web sockets for the web-based visualization front end.

<div class="iframe-container">
<iframe src="//player.vimeo.com/video/91270481?byline=0&amp;portrait=0&amp;color=ececec" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>

***


**Fig. 1 - Top view of Betelbot. PING sensor, WiFi shield, Arduino, crappy wheels shown**

![Top view of Betelbot](/images/betelbot-top.jpg)


**Fig. 2 - Front view of Betelbot. PING sensor, WiFi shield, Arduino, crappy wheels shown**

![Front view of Betelbot](/images/betelbot-front.jpg)

Hopefully in the next few weeks, I'll write a post about my struggles on the hardware side as well my design considerations and philosophy for the software side.