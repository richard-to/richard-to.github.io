---
layout: post
title: "Minesweeper - Neural Network"
---

I've been trying teach myself Machine Learning for the past year and a half. It has not gone well due to my tendency to procrastinate and take on too much. So far I've worked through the first four programming assignments and watched the videos up to week 5 on the Coursera Machine Learning course, watched the first two lectures and attempted the first assignment from the Edx course, worked through six weeks of the Coursera Recommender Systems course, watched the first two weeks of the Coursera Natural Language Processing course, tried to learn Hadoop from a book, and attempted Kaggle's beginners challenge where the goal is to predict who survived the Titanic. I've reached the point where I need to develop a strategy and stick with it.

I need a strategy that accounts for that fact that the Spring semester is about to begin and my math rpg will be my primary side project. I can rule out taking a MOOC course in parallel. That tends to go well for two or three weeks and then completely stops once my University workload picks up. It may be best to wait until the Summer and learn without interruptions. Every time I stop for a few months and then start again, I try to start the courses from the beginning to refresh my memory. Unfortunately I quickly get impatient and want to jump ahead to where I last left off.

The Coursera ML course is great, but I never got comfortable with the programming paradigm in Octave. It felt like magic at a times and my linear algebra is pretty weak. It did not help me with my intuition of the first few algorithms, especially neural networks. I finished the first neural network assignment, but I didn't feel like I learned how to apply them in other situations. And don't get me started with Back Propagation!

I recently worked through the neural network tutorial on [AI-Junkie](http://www.ai-junkie.com/ann/evolved/nnt1.html) and I thought it was fantastic. The sample program is written C++ and uses the MFC framework for Windows, which meant that I could not run it on my MacBook - granted I could have run it on my Windows 7 VM. This turned out to be a good thing, because it forced me to port the program to JavaScript. I feel like this helped me immensely. Here are some reasons why:

- I was able to write the code in a language I was comfortable in. This meant a lot of nested for loops instead of the linear algebra operators in Octave.
- Since I was porting the code from C++ to JavaScript, it prevented me from mindlessly copying the code line-for-line.
- The sample program involves minesweepers that try to disarm mines and it's the AI's job to make the minesweepers more efficient. This is a visual program so it's fun to watch. I guess what I'm trying to say is that games are a great way to learn AI and maybe Machine Learning too?
- Similar to point 3, the author explains things in very simple language and avoids unnecessary math. For instance he uses a Genetic Algorithm to train the Neural Network weights instead of using Back Propagation, which I find hard to understand. I think it is important to understand the math at some point, but I think the most important thing is to give confidence to the student.

Here is a screen shot of the program:

![Mine Sweeper Neural Network Simulation](/images/minesweeper.png)

I'm highly considering buying his two books on AI for game development and working through the examples using the same approach I took for the minesweeper simulation. The key will be applying what I learned in my own small program. For the Neural Network, I plan to train a neural network to play tic-tac-toe and pit against an AI that uses alpha-beta pruning. I would like to use Back Propagation instead of a genetic algorithm though.

I also really like Dr. Abu-Mostafa's "Learning from Data" course that's on iTunes U and EdX. I'm only two lectures in, but he clearly enjoys teaching this subject and knows what he's talking about. The lectures so far are very detailed and mathematical. I've watched the lectures multiple times and learned something new each time. I also liked the homework assignments which are more open-ended on how to implement various algorithms. In the first assignment, you have to implement the Perceptron learning algorithm to answer the last few questions. My only gripe is that the wording can be a bit confusing.

The Kaggle competitions for beginners sound like a good way to learn, but I have not found the Titanic problem too engaging. This may be because there's no right approach and I have no idea what to start. The Titanic problem does include two python tutorials that can provide a starting point. I guess my main problem is that I find data wrangling boring and tedious. Granted I think that's a large chunk of machine learning work.

Still not exactly sure what my approach will be, but I will probably focus on working through the AI for Game Development books.

Also here is a demo of the minesweeper simulation. You can [view the demo here](/projects/minesweeper/).