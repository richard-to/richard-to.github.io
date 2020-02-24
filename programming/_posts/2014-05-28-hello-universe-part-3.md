---
layout: post
title: "Hello Universe - Part 3: Static pages"
---

With the exception of the API, all example/exercise pages are generated as static HTML pages. The major influences for this decision were based off my experience using Jekyll and Khan Academy's old exercise framework. There are a lot of static page generators out there. Even I developed one two years ago using node.js and markdown no less. One of the draws is that they're fast and easy to develop - far simpler than the traditional CRUD blog that people build when learning a new web framework or programming language.

### Reasons to use static page generation for Hello Universe

- No need to develop a CMS
- Can use text editor or IDE of choice to write code examples. Who would have thought?
- Git surprisingly does a great job of tracking code changes
- Being on an open source project on Github makes it easier for developers to contribute
- Puts focus on cranking out strong content
- Encourages simpler and leaner UX/UI design
- Faster page load since all HTML is already generated and can be served as cacheable static content
- Probably would not be too difficult to transition existing content to a database-backed application

### Potential issues with static page generation for Hello Universe

- At some point, users will want more personalization. They may want to know their progress on exercises or see which examples they've viewed.
- The build step may get too slow as the number of pages increases. Jekyll is already getting a bit slow even though this blog currently only has about 45 posts. Certainly optimizations can be made to stave off this issue.

The downsides are good problems to have actually. They are problems that would indicate that the site is gaining some traction, and would make a transition to a more traditional web framework worthwhile. For Hello Universe, building a CMS would be a premature optimization considering the effectiveness of static page generation.

### File format rules

- The build script currently handles Java and C++ files, but can be extended for other programming languages
- At the top of each file, is a comment that contains metadata
- YAML is used to structure the metadata. It is surprisingly expressive and at the same time free of extraneous markup
- Markdown is used within YAML to format sections that will be rendered as HTML
- The main elements are:
  - **title** - Title of rendered page. Currently required but should be optional
  - **tags** - An optional field to help with search
  - **exercises** - Self-study exercises to help reinforce and provide understand of the code.
  - **instructions** - Objectives for exercise pages.
  - **output** - Cached output of the code example. Currently need to manually paste in the result. Required for examples
- The rest of the file is regular code

### A Java example

```java
/*
---
title: Hello Universe
tags: string
exercises: |
    1. Make this program print **Hello Universe** one time instead of two.
    2. Make the program print:<br /><br />
    **Hello Universe**

output: |
    Hello Universe
    Hello Universe
...
*/

class HelloUniverse
{
    public static void main(String[] args)
    {
        System.out.println("Hello Universe");
        System.out.println("Hello Universe");
    }
}
```

**A C++ example**

```cpp
/*
---
title: Hello Universe
tags: string
exercises: |
    1. Make the program print:<br /><br />
        **Hello World**

output: |
    Hello Universe
...
*/

#include <iostream>

int main()
{
    std::cout << "Hello Universe";
}
```

### Notes on the build script

- The build script is written in python
- Runs fast enough right now, but there are many optimizations that can be made. For instance, it currently regenerates all code files. This is not actually needed if the menu did not get updated.
- Currently needs to be run each time a change is made. Adding a watch argument would be helpful
- Need an option to clean up the source directory and remove unused files
- The build script was designed to be as modular as possible since it needs to handle static content - such as CSS and Javascript - as well as generate pages for both exercises and examples for different programming languages. Not to mention additional features like building a search index. If nothing else, it's a good exercise on recursion.

If you're interested in contributing to the project, feel free to [fork the repository and send a pull request on Github](https://github.com/richard-to/code-examples/).

\* My tentatively titled "Java Examples" and later "Code Examples" project is now named "Hello Universe."
