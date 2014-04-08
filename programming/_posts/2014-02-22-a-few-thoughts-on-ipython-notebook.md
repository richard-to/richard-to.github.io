---
layout: post
title: "A few thoughts on iPython Notebook"
---

When I first learned about iPython Notebook last year, I was excited. What a great way to add interactivity to written content. I think I first learned about it when someone released an open source data mining book on Github that used iPython notebook to run the examples. Again, exciting stuff.

Installation of iPython Notebook is not too bad, but on OSX, the instructions suggest installing Anaconda or Enthought Canopy, which are python distributions geared toward scientific computing and data processing. This is great, until I learned that Anaconda interferes with pip and virtualenv. There are workarounds and I think newer distributions will have better compatibility. With that said, development (PHP, Python, Rails, etc) is a pain in OSX and it's better to just use Linux VMs with Vagrant these days.

iPython Notebook's interface is reminiscent of Google Docs's interface. It also turns out to be a web-based application and uses web sockets to process python code snippets. This means to run iPython Notebook, you have to start the server first. To distinguish between code, markdown, and plain text, you need to add "cells" to the document. There are keyboard shortcuts to add specific cell-types so there's no need to use the drop-down menu.

![iPython Notebook UI](/images/ipython-ui.jpg)

I mainly used iPython Notebook for doing Calculus II homework. This meant creating markdown cells to show each step. The problem with this is that it is tedious to create a new cell for each step. The alternative is to write out all the steps in one cell, but the drawback is that LaTeX is not rendered until the cell loses focus. After like 50+ lines of markdown cells, it takes a long time to render the equations with MathJax. In hindsight, iPython Notebook was not the best choice for my use case.

To export an iPython Notebook in PDF format, you need to install LaTeX. This turned out to be a frustrating experience since I was not familiar with LaTeX and their module system. This lead to many cryptic messages during export. The alternative is to export to HTML and print from there, but the font quality and alignment is poor when printed. Not to mention it becomes very slow when many lines of LaTeX need to be converted at once.

Overall, iPython Notebook is great idea, but it's usability issues are too much. The recent EdX course on Linear Algebra uses iPython Notebook. The course developers provide a self-contained installation that starts the server when you double-click on an icon. It will also update the content using Git. This makes the experience a bit more friendly, but I still have to deal with an interface that feels clunky and slow.