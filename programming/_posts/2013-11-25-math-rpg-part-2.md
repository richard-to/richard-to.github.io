---
layout: post
title: "Math RPG - Part 2: ReactJs"
---

For the combat system, I decided to use HTML and CSS to render the menus instead of drawing them on the canvas element. It makes a lot of sense to me since HTML, CSS and some Javascript provide more than enough functionality. No sense in rebuilding the wheel for a basic UI interface.

In terms of the implementation, I chose React for the UI framework. Normally I use Backbone, but since this is a personal project, I wanted to try something different. React's efficient DOM updates sounded interesting and I felt Angular was overkill. Partial updates is one thing I have trouble trouble doing with Backbone. Granted that has never been a big issue with my projects. But I've always thought that'd be a killer feature.

So far React has been fairly easier to learn and some of the concepts are interesting. The declarative syntax for custom components brings back horrible memories of my very brief foray into ColdFusion. But with that said the syntax makes managing nested components much easier and this does seem in-line with the future of HTML5. Not to mention I've had many problems managing nested views with Backbone. React doesn't solve all the issues with nested components though.

I ran into a few gotchas while getting started with React.

__1.__

Definitely install the `react-tool` module for NodeJs. The delay with the JSX transformer is very noticeable even for development.

__2.__

Each component is rendered as one node. This means the following is invalid.

{% highlight html linenos=table %}
return(
    <CustomComponent1 />
    <CustomComponent2 />
);
{% endhighlight %}

If you try to render the above code, you will get an error message that makes it sound like a syntax error. To solve this problem, you can wrap your child components in a div.

{% highlight html linenos=table %}
return(
    <div>
        <CustomComponent1 />
        <CustomComponent2 />
    </div>
);
{% endhighlight %}

Source: <https://groups.google.com/forum/#!msg/reactjs/efzRtSY6sLo/2dWZoWs1iKUJ>

__3.__

I had a hard time figuring out the best way to manage interaction between components. The React docs don't give any examples of how to approach this. There are examples of rendering multiple/nested components, but they are very simple and don't include events.

For now I'm just passing a callback to the child component and triggering it when an event is triggered in the child. I don't think it's ideal, but it works OK for my current use case where I only have two levels of nested components.

Here is an untested example:

{% highlight javascript linenos %}
var ChildMenu = React.createClass({
    handleClick: function(event) {
        this.props.onClickChild(event);
    },
    render: function() {
        return <a onClick={self.handleClick}>Click me.</a>;
    }
});

var ParentMenu = React.createClass({
    handleClickChild: function(event) {
        console.log("Received Click Child");
    },
    render: function() {
        return <ChildMenu onClickChild={this.handleClickChild} />;
    }
});

React.renderComponent(
    <ParentMenu />,
    mountNodeEl
);
{% endhighlight %}

This is based off of this post: <https://groups.google.com/forum/#!topic/reactjs/EMZJbezWP4Y>
