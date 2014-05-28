---
layout: post
title: "Hello Universe - Part 3: Static pages"
---

My tentatively titled "Java Examples" and later "Code Examples" project is now named "Hello Universe." The name fits the teaching approach of providing what are essentially a bunch of "Hello World" exercises. With that aside finished, this post will mainly be about the decision to use static page generation.

The major influences for this decision were based off my experience using Jekyll and Khan Academy's old exercise framework. When dealing with exercise/example developers and writing code, it seems preferable to allow them to use their text editor or IDE of choice. Not to mention, git is perfect for tracking code changes and allows other developers to contribute without signing up for yet another service. The other benefit is that static page generation puts the focus on creating exercises/examples instead of building an administrative back-end. That can come later.

Here is an example source file:

{% highlight java linenos %}
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
{% endhighlight %}

Meta-data is embedded as a comment in the source file. The meta-data uses yaml due its expressiveness and lack of extraneous syntax. Markdown is also used for content that will be rendered as HTML. There are some minor conflicts with using markdown within yaml, but it works well enough. There is definitely some concern that this approach is too convoluted, but the alternative is developing a custom format. Yaml and Markdown parsers are already available as libraries and the syntaxes are both well documented. No need to rebuild the wheel here.

It's doubtful that static page generation will remain a viable option as more personalization is added. But at this stage I'm happy to keep things simple. Lean and minimal websites is a trend that I wouldn't mind gaining steam.

If you're interested in contributing to the project, feel free to [fork the repository and send a pull request on Github](https://github.com/richard-to/code-examples/).