---
layout: post
title: "Quotidian - Part 1"
---

I went against my plan of focusing on one project and started working on an iOS app tentatively called Quotidian, which basically means something that happens every day. The main reason for working on this project is that two prospective employers asked if I knew mobile development. I told them that I didn't have much experience.

My experience for iOS amounts to a multi-player tic-tac-toe game that I built in 2010 and last winter break I crammed through two-thirds of the Stanford iOS course on iTunes - which is a great course. The former doesn't sound like much, but it was a non-trivial app. In all it took me about 35 hours to learn basic Objective-C, develop the main client, and then write the networking code so that players could against PCs, IPTVs, and other iPhones. After that it took me another 20 hours to debug random socket disconnections. The issue turned out to be a lousy WiFi connection, which forced the iPhone to use the 3G network instead. This was problematic since the game server was only available internally. I have also dabbled with Android, but on much more limited scope.

I chose Quotidian as my learning project since the pen and calendar approach to the "Don't Break the Chain" method was getting out of hand. I had to print and tape a calendar on my wall and then remember what each X stood for. At the time I was developing six habits.

There are a lot of list, goal, and or habit apps out there, so it's definitely not an original idea, nor a particularly profitable one. Despite that I see this as a positive. Often times I will shy away from ideas that have already been implemented, but that's not a good mindset. If I can "ship" this app, it could be a real confidence booster.

The good thing about list apps is that most platforms provide excellent support for rendering lists of data and handling CRUD. These are fairly fundamental skills for most software applications. Granted each platform has their own approach. With iOS, I mostly worked with Core Data and Table Views this week.

I have bigger plans for Quotidian than just an iPhone app. That goes against my main philosophy in developing software, which is that apps should work on as many platforms as possible. The overarching goal is to develop versions for Android, WP8, Web, Windows 8, OSX, and Ubuntu. My other goal is to make the data less centralized. Ideally I want no part with storing the data on my servers. Instead I want people to be able to sync their data to iCloud, DropBox, GoogleDrive, or SkyDrive. It will be tricky to make sure data gets synced correctly and to find an open data format.

But yeah that's my vision for Quotidian.

Here are some mock ups and an early screen shot from the iOS simulator:

![Quotidian Mocks](/images/quotidian_mocks.png)

![Quotidian List View Version 1](/images/quotidian_s1.png)