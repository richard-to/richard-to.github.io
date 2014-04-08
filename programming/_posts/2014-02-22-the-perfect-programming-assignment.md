---
layout: post
title: "The perfect programming assignment"
---

The eight-puzzle is one of my favorite programming assignments. I've seen it multiple times in introductory AI courses, but it could be an effective final assignment for a data structures course. The good implementation covers most of the important topics. For instance students will quickly learn that an implementation using a linked list will be painfully slow, especially when coupled with breadth-first search. Change it to a 15 puzzle and it becomes even more noticeable. This should hopefully lead students to search for better data structures, such as replacing their linked list with a priority queue that uses a heap.

Here is a quick list of concepts that may be needed to solve the eight-puzzle:

- linked list
- sorting algorithms (insertion sort, quick sort, merge sort, etc)
- An understanding of trees
- breadth-first search
- depth-first search
- iterative deepening
- unified cost search
- set
- priority queue
- queue
- heap
- greedy algorithms

Not all those concepts are necessary for the fastest solution, but the idea would be to design the assignment in such a way that experimentation is emphasized. For instance, whoever has the fastest 15-puzzle implementation gets a few extra credit points or something. Or make one of the requirements ask for multiple implementations to compare runtime.

The downside of the eight-puzzle is that it's a common assignment and one could find implementations on Internet relatively easily. It would be interesting to develop a similar puzzle game that with no known solutions and see how students do.

Here is a demo of the eight puzzle using javascript. This implementation uses WebRTC Camera, HTML5 canvas, and some basic image processing to make the standard eight puzzle a bit more interesting. [Check it out here.](/projects/webrtc)

![Eight puzzle with WebRTC](/images/eight-puzzle.jpg)

There's also a non-WebRTC version of the eight puzzle if you'd prefer not to solve a puzzle of your face or are using an older browser. [Check out the regular version here.](/projects/eight-puzzle)

![Eight puzzle with Lego images](/images/lego-eight-puzzle.jpg)

The demos were ported from a Python-based implementation I wrote last year in AI. One of challenges of porting the program was that I could not test functionality until all of the code was written. Not surprisingly this lead to numerous bugs, a lot of which were not easily solvable given the amount of moving parts. Eventually I caved-in and wrote unit tests. This was tedious and slow, but uncovered four or five bugs. In all the tests added almost 500 more lines of code. Was worth it worth the time? I would say so, and really I should have done it from the beginning. I'm not sure how people write even a few hundred lines of code without testing!