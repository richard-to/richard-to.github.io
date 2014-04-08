---
layout: post
title: "Code Examples - Part 1: Introduction"
---

Because I lack creativity for naming projects, this project is currently named "Code Examples" and was previously known as "Java Examples." The seed for this project came from tutoring in the CS lab the last two semesters. At my university, introductory programming courses are taught in Java and C++, so most of my efforts go into explaining loops, conditional statements, variables, and some object-oriented programming. Not many students come in for tutoring. It tends to be the same handful of students who come in every time a new assignment is released. Any more and I wouldn't be able to help everyone. This kind of speaks to how tutoring is not scalable. This is the same issue I noticed as a reading tutor at an elementary school. Certainly there are great benefits of having one-on-one attention, but it limits reach.

Often, I find myself repeating concepts, such as the syntax of `for loops` or `nested conditional statements`. My current approach is to write a dead-simple example to illustrate the concept. I'll ask them what they think will be the expected output. Later I follow up with a few more questions to test understanding or ask them to alter the example to do something slightly different. If necessary, I walk them through the code line-by-line. After a while, `for loops` become routine. We know all the idiosyncrasies and tricks. We immediately guess that we have an infinite loop if the computer fan starts whirring like mad. So it's interesting to work with and observe beginners as they try to wrap their head around the execution of `for loops`. One student mentioned how they had trouble processing that the loop executed the same line of code multiple times and did not just proceed to the next line. But this is all natural, all part of the process of learning, of gaining that intuition, that light bulb moment where it all makes sense.

My one criticism of my approach to tutoring is that sometimes I can be impatient. I don't give them enough space and time to think deeply and feel free to make mistakes and not rely on me as a crutch. Isn't that what learning is all about? Just spending an inordinate amount of time thinking through a problem?

My Code Examples project is just a website with Java/C++ examples and exercises that can be run and edited in a web browser. Currently there are not many examples or exercises yet. It definitely takes some thought to develop helpful examples that work as whole. Initially I planned to have examples only, but my professor suggested that exercises would be helpful. Apparently the Java/C++ books used in the course provide an on-line service with programming exercises. The drawback is that it costs extra money and some students don't either don't buy the textbook or use an older edition.

![Code Examples](/images/code-examples.jpg)

The challenge of compiling and running random code is security and then performance. Code Examples uses docker to spin up containers to execute and run code. This is not as secure as using a virtual machine, but the benefit is speed, lower resource usage, and a a consistent environment each time. My benchmarks showed a 200 ms delay to start a container. The bigger bottleneck is running `javac` to compile code. For whatever reason, Java 1.7 on my server takes 800-900 ms, whereas on my local VM, performance is slightly better at 500-600 ms. One reason could be that `javac` is itself a Java program.

Security is still an issue, with the current setup, especially with C++ code. I plan to write a separate post on possible solutions. Hopefully it will help me decide which is the best option. It's definitely possible, since there are quite a few websites out there that provide on-line compilation and execution of random code.

As mentioned earlier, there are a good number of websites that provide on-line code editors. There are full-blown IDEs (Cloud9, CodeEnvy, SourceLair, etc), educational platforms (Codecademy, Khan Academy, Udacity, CodeCombat etc), and code paste bins (JS Fiddle, Ideone, Codepad, etc). 

I started Code Examples because I noticed that there were no websites that provided executable Java/C++ examples - interestingly enough, Tutorials Point recently added this feature. JS Fiddle was the main inspiration for Code Examples. It's a great way to provide helpful examples to support StackOverflow answers and questions. 

And with programming, I learn best from examples and reading code. No explanations needed half the time. It's difficult to follow code written on a white board or being explained verbally. There are too many details that can only be learned from writing code and making mistakes. And it will hopefully provide a good resource for those who don't have the time or don't want to attend a tutoring session.

Current design considerations:

- Open source
- No sign up required
- Lightweight
- Easy to add new exercises and examples
- Examples in Java and C++ for now
- Exercises in Java and C++ for now
- Website HTML files will be pre-generated from a build script.
- Need to decide on a way to organize examples and exercises

The repository for Code Examples is currently located here: [https://github.com/richard-to/java-examples](https://github.com/richard-to/java-examples).

The example website can be viewed here: [http://code-examples.richard.to/java/examples/helloworld.html](http://code-examples.richard.to/java/examples/helloworld.html)