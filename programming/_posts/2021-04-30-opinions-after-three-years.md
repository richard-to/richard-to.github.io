---
layout: post
title: "Opinions after three years"
---

At work we have a monthly email thread where we send each other interesting software engineering articles. This month a co-worker shared a blog post titled [Opinions after a decade of professional software engineering](https://blog.thea.codes/opinions-after-a-decade/) by Stargirl Flowers. I found myself agreeing wholeheartedly with what she wrote.

The same co-worker also commented that he wished he could find more of these. This inspired me to write about how my own opinions have changed. Specifically I wanted to focus on the last three years, which I see as an important inflection point in my development as a software engineer.

Although I've been programming for longer than three years, 2018 was the first time I worked with someone more experienced than me. One byproduct of this was my introduction to a more organized and team-oriented approach to software. I've learned an enormous amount in that time (thanks Andrew!).

Prior to 2018, I worked on projects as a solo dev or with 1-2 others. So I was used to doing everything. I made all the technical decisions. I collaborated closely with stakeholders to build what they wanted. And when I worked with other devs, I made myself available to answer questions or discuss technical problems. But otherwise I let people do what they wanted.

## What I've changed my mind about

My software engineering philosophy for the longest time can be described as Anarchy Driven Development (ADD). The central tenets are trust, creative freedom, and skepticism about titles and roles. The vision is one in which everyone intuitively and instinctually works together to build software. No meetings. No egos. No barriers. Everyone knows what they're doing. And everyone knows what everyone else is doing. Everyone's on the same page. It's a perfect distributed system.

I'll be the first to admit that ADD is idealistic and perhaps even a bit grandiose. But I still believe in the main tenets. What's changed is I've amended them to be be more nuanced, more realistic, even if still out of reach. I call it: Anarchy Driven Development with Guardrails (ADDG).

- Trust your teammates; put faith in them; believe in them; let them do their thing; give them space; trust them with new responsibilities
	- *Guardrails: Unless you're psychic or brain-to-brain interfaces (BBIs) become a reality, it's OK to check in with your teammates if you're concerned (i.e. doesn't mean you don't trust them); along the same lines keep them up to date with what you're doing; and depending on the situation, it can be more beneficial for people to earn greater responsibilities over time.*
- Foster a culture of creative freedom where all experimentation and ideas are worth trying
	- *Guardrails: Make sure all voices are heard and welcome since it is easy for a few voices to dominate. Experiments and ideas can often conflict with the company's priorities. In the end, unfortunately, we need to make decisions that better align with priorities, since that's what we're paid to do.*
- Hierarchy of any kind can get in the way of building trust and creative freedom
	- *Guardrails: Even in a flat hierarchy, there's going to be some kind of order that forms naturally and those closer to the top will have an advantage unless they are cognizant of those imbalances in power and actively seek to rebalance them.*

Other things I've changed my mind about:

- ADD and ADDG is for everyone (or everyone should love programming as much as I do)
	- *Updated opinion: ADD and ADDG is not for everyone. People become software engineers for different reasons. They have different personalities, interests, goals, and work styles. And it's important for people to be who they are.*
- Code comments should be used sparingly since code is the source of truth. Comments can mislead; so code should speak for itself. This means good naming and clean code.
	- *Updated opinion: Clean code is not enough. Code can't explain why something is being done. A good rule of thumb is to imagine future readers of your code and ask yourself what questions they may have. Antirez has a great post on code comments called [Writing system software: code comments](http://antirez.com/news/124).*
- Managers are useless!
	- *Updated opinion: Managers aren't useless. Good ones will do a lot of things that software engineers take for granted and may not even notice. The best ones are able to keep their ego in check. Trust is important.*
- A startup can fail at any moment, so we need to move fast
	- *Updated opinion: I still believe this to a certain extent. The small size of the team allows for less decision makers and faster development time and I see this as an advantage for startups, however I wouldn't want to sacrifice the growth of younger engineers in order to move faster, nor would I want them to learn bad habits in the name of speed. At the same time there are some benefits to coding with urgency and intensity, but it's not worth the tradeoff unless you're starting your own company.*

## New opinions

- Code is only a small part of software engineering
	- *Took me so long to truly learn this!*
- When writing code, always keep your current and future teammates in mind. What can you do to make things easier for them? How can you help them?
	- *this is the crux of many of my new opinions*
- Ego is unavoidable
	- *Even though the ideal of ADDG professes a lack of ego, the reality is that ego exists and it's best not to ignore those feelings when they arise. What helps me is to tell the person, who I have a conflict or disagreement with, what I'm feeling in a tactful, honest, and direct way. I think this comes easy for some people, but not for me (probably due to my deep belief in ADDG).*
- Communication is hard and if we think we're doing a good job, mostly likely we're not
	- *Unless you're psychic of course*
- Write clearly and proofread
	- *Even though I have a background in creative writing (or maybe because of it), I tend to brain dump all my thoughts and expect everyone to understand what I'm trying to say. This is an example of not thinking about my teammates, of not making things easier for them. The only exception is if you're trying to write a postmodern masterpiece.*
- Documentation is hard
	- *I'm always on the lookout for tools that solve the problems of documentation, such as outdated or missing information, but there's not much out there. This means we just have to work harder in the meantime; we have to perform the drudge work of maintaining it.*
- Code review is hard and underappreciated and to do it well seems like an act of giving
	- *great article on code review called [How to Do Code Reviews Like a Human (Part One)](https://mtlynch.io/human-code-reviews-1/)*
- Try not to over-work since your well-being is more important (or work is work)
	- *or there's always tomorrow until there isn't*
- My opinion of how best to approach unit testing keeps changing

## Old opinions that have been reinforced

These are old opinions that have been reinforced in the last three years.

- Software is highly fungible
	- *write code knowing that it's going to change over time (doesn't mean write throwaway code)*
- It's the last 20% that ruins perfectly laid out sprints and milestones
	- *if I had a dollar for every time this has happened to me, I probably wouldn't be a millionaire, but you get the point*
- Avoid early optimizations
	- *unless it's something learned from past experience*
- User metrics and analytics should be used in an ethical and transparent way
	- *wish it was possible to avoid tracking altogether, but it's necessary for making a better experience for a product's users*
- Instead of chasing new libraries and technologies, focus more on concepts
	- *I have the hardest time with this one since it can be fun and useful to learn and explore new technology*
- When designing a system, be realistic about requirements and avoid the allure of buzzwords
	- *usually means keeping things basic*
- It's easy to misunderstand DRY at first
	- *guidelines are guidelines*
- Similarly, it's also easy to fall into the trap of applying design patterns to everything
	- *usually this is a phase, and with time, design pattern usage becomes more natural*
- Try composition before inheritance
	- *learned this from a mentor when I was an intern many years ago and haven't forgotten it*
- Keep learning
