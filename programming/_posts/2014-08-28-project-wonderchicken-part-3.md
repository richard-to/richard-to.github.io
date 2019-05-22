---
layout: post
title: "Project Wonderchicken - Part 3: HTML5 History API with React"
---

The React TodoMVC example uses Director for routing, so I decided to use it in Project Wonderchicken. The API looked straightforward, but as usual, the toy examples proved to be inadequate for real-world use cases. Luckily, I am somewhat competent and know how to use Google and StackOverflow. Unfortunately the only results were about film directors and Adobe Director. What I needed was an example of how to use Director with React and the Flux pattern in a modular way without hard-coding paths in every component and being able to trigger state changes appropriately.

The basic Director examples worked, but provided no way to generate paths, which is a common feature of server-side frameworks, for example Rails or Django. But maybe, the developers decided that this was feature-creep, which is understandable and not to mention, that was something that could be built on top of Director.

The next issue was that the TodoMVC example did not use the Flux pattern and did not illustrate how to pass a url variable to a "new page". Not to mention it did not show how to use the Router across multiple components in a module. Sometimes a route needs to be manually triggered, which would require an instance of the Router to call `setRoute` and the last thing I wanted to do was pass the router from component to component.

Eventually, I wrote a wrapper class for Director to accomplish most of what I wanted. And but then I scrapped the idea and decided to build my own.

The last problem was that clicking on links would not trigger a route. It was not clear if a hash was required in the URL or how the router worked with non-root base URLs. Finally, there was the nagging concern that the node package for Director included code that was specific to the server-side. Although, I could have used a build with client-side only features, the numerous integration issues had led to too much frustration just to do some "simple" routing.

Now, there's nothing really wrong with Director. Mostly these are just the bitter ravings of a lazy developer  not wanting to spend a week and a half on routing and just growing very frustrated with bridging disparate libraries together and always having the last 20% of functionality missing. However that's just the reality of programming these days. The alternative of rebuilding the wheel every time is likely worse, and I should probably pray for forgiveness to our Open Source Gods.

For my custom router module, I wanted the following features:

- No dependencies. Not even jQuery or a boatload of npm modules packaged with Browserify or whatever.
- Support browsers that implement the HTML5 History. Otherwise fallback to regular navigation. No navigation with hash urls.
- Automatically generated path functions similar to Rails.
- Allow multiple router instances for modularity. Use base path checks to improve path search.
- Automatic event binding to links, similar to jQuery.on events
- Works with React and Flux pattern.

jQuery is great and there are a ton of great plugins for it, but requiring it as a dependency to save maybe 70 lines of code is not worth it for a module that is only 155 lines. The experience definitely makes one appreciate jQuery.

The best example of this appreciatation was implementing event listeners that would listen for any link node, even dynamically generated links. The last thing a developer wants to do is to manually manage event listeners for all links. That would not make a good module. Normally, `jQuery.on` could be used. Thankfully, there was a great [StackOverflow question and answer on how jquery on works](http://stackoverflow.com/questions/15112067/how-does-jquery-on-work/15112421#15112421).

Since the router module did not need to support older versions of IE, I was able gloss over some differences in event handlers APIs. The secret to `jQuery.on` is event bubbling. Essentially you can bind a click event to the body. Each mouse click on a child element will then bubble up to the body event listener where you can check if the origin element is a link node.

Of course with Javascript, it is never that simple. There is an issue when the link itself has child elements, such as `span` or `strong` tags since those tags will bubble up instead of the link node. This means that you have to manually search through parents until you reach a link node or the top level node.

The downside of listening on the body element is that all clicks will be bubbled up. It will be interesting to see how performance changes when multiple router instances are added. In addition, the module has only been tested on Chrome so far.

**Ex 1. Vanilla event listeners with feature checking**

```
Kingpin.prototype.startListening = function() {
    if (document.body.addEventListener) {
        document.body.addEventListener('click', this._onLinkClick.bind(this));
    }

    if (history.pushState) {
        window.addEventListener("popstate", this._onPopState.bind(this));
    }
    return this;
};
```

**Ex 2. Properly handling event bubbling for links**

```
Kingpin.prototype._onLinkClick = function(e) {
    var node = e.target;
    while (node.tagName !== 'A' && node.parentNode)  {
        node = node.parentNode;
    }

    if (node && node.tagName === 'A' && node.href.indexOf(this.baseURL) === 0) {
        if (this.setRoute(node.href.substring(this.baseURL.length))) {
            e.preventDefault();
        }
    }
};
```

In terms of modularity, multiple instances of the router module can be created and they should work unless identical paths are added. The downside is a potential performance hit from bubbling events up for each router.

The HTML5 History API is straightfoward and is explained clearly in this [Dive into HTML5 article](http://diveintohtml5.info/history.html). Basically the API, allows you to push a URL onto the history stack and listen for the back button.


**Ex 3. Popstate event handler**

```
Kingpin.prototype._onPopState = function(e) {
    this.setRoute(location.pathname);
};
```


**Ex 4. Out of context and not very helpful usage of history.pushState**

```
this.go[routeName] = function() {
    action.apply(scope, arguments);
    history.pushState(null, null, self.urlFor[routeName].apply(self, arguments));
};
```

I did not want the router to be dependent on React, but at the same time I wanted it to work with it. This meant adding a wrapper class around the router module. In this regard, trying to integrate Director with React and the Flux pattern proved very educational.

What I wanted to do was trigger an event using the EventEmitter API in node, similar to how change events and Store objects work. This meant a lot of boilerplate code to pass into the router module and needing to deal with slightly different APIs.

**Ex 5. Simple example of how to pass URL variable into handler function**

```
router.on('/account/:id/notifications/', function(id) {
    console.log(id);
});
```


**Ex 6. EventEmitter example**

```
// From: self.events.emitChange({route: route, params: params});

_onRouteChange: function(e) {
    this.setState({
        route: e.route,
        params: e.params
    });
}
```

**Ex 7. Wrapper to integrate with React and EventEmitter**

```
AppRouter.prototype.on = function(route) {
    var self = this;
    var paramsList = _extractUrlParams(route);
    this._router.on(route, function() {
        var params = {};
        for (i = 0; i < arguments.length; ++i) {
            params[paramsList[i]] = arguments[i];
        }
        self.events.emitChange({route: route, params: params});
    });
    return this;
};
```

I ended up going with a singleton router instance that could be "required" by different components. A dependency injection framework similar to what is used in Angular could be a good solution if you happen to be anti-singleton.

**Ex 8. Setting up a global router using React specific wrapper for Router module**

```
var Router = require('../utils/Router');
var paths = [
    '/accounts/',
    '/accounts/new/',
    '/accounts/:user_id/edit/'];
var AccountRouter = new Router(paths);
module.exports = AccountRouter;
```

**Ex 9. Snippet to illustrate basic usage in React component**

```
componentDidMount: function() {
    AccountRouter.startListening();
    AccountRouter.addRouteChangeListener(this._onRouteChange);
},
_onRouteChange: function(e) {
    this.setState({
        route: e.route,
        params: e.params
    });
},
render: function() {
    switch(this.state.route) {
        case AccountRouter.route.ACCOUNTS_NEW:
            return this._renderNewPage();
        case AccountRouter.route.ACCOUNTS_EDIT:
            return this._renderEditPage(this.state.params.userId);
        default:
            return this._renderDefaultPage();
    }
},
_renderNewPage: function() {
    return (
        <div className="row">
            <p>
                <a href={AccountRouter.urlFor.accounts()}>Back to your account</a>
            </p>
            <p>
                <button onClick={this._onClickEdit(this.state.userId)}>
                    Edit your account
                </button>
            </p>
        </div>
    );
},
_onClickEdit: function(userId) {
    AccountRouter.go.account_edit(userId);
    return false;
}
```

The snippets probably aren't too helpful, but hopefully they get the general idea across. I created a Github repository for the barebones router module. It's definitely not ready for production yet. I already spotted a few errors while writing this post. For example, the click event listener should only be added if HTML5 History is supported. I ended up naming it `Kingpin` for no real reason other than it sounds sort of cool.

Here is the link: [https://github.com/richard-to/kingpin](https://github.com/richard-to/kingpin)

Also here is the full source code for `Kingpin` to pad the word count a bit.

```
(function() {
    // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
    if (!Array.isArray) {
        Array.isArray = function(arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }

    var _delim = '/';
    var _regexDelim = "\\/";
    var _defaultPlaceholder = '(\\w+)';
    var _tokenPrefix = ':';

    var _toRegexRoute = function(route) {
        var modifiedRouteParts = [];
        var routeParts = route.split(_delim);
        for (var i = 0; i < routeParts.length; ++i) {
            if (routeParts[i][0] === _tokenPrefix) {
                modifiedRouteParts.push(_defaultPlaceholder);
            } else if (routeParts[i] !== '') {
                modifiedRouteParts.push(routeParts[i]);
            }
        }
        return "^" + _regexDelim + modifiedRouteParts.join(_regexDelim) + "\\/?$";
    };

    var _urlFor = function(route, params) {
        var routeParts = route.split(_delim);
        var concreteRoute = [];
        var param_index = 0;
        for (var i = 0; i < routeParts.length; ++i) {
            if (routeParts[i][0] === _tokenPrefix) {
                concreteRoute.push(params[param_index++]);
            } else if (routeParts[i] !== '') {
                concreteRoute.push(routeParts[i]);
            }
        }
        return _delim + concreteRoute.join(_delim) + _delim;
    };

    var _buildRouteName = function(route) {
        var routeParts = route.split(_delim);
        var route = '';
        for (var i = 0; i < routeParts.length; ++i) {
            if (routeParts[i] !== '' && routeParts[i][0] !== _tokenPrefix) {
                route += '_' + routeParts[i];
            }
        }
        return route.substring(1);
    };


    var Kingpin = function(routes) {
        this.baseURL = location.protocol + "//" + location.hostname;
        if (location.port !== 80 && location.port !== 443) {
            this.baseURL += ":" + location.port;
        }

        this.routes = [];
        this.regexRoutes = {};
        this.actions = {};
        this.go = {};
        this.urlFor = {};
        this.route = {};

        if (routes) {
            if (Array.isArray(routes)) {
                for (var i = 0; i < routes.length; ++i) {
                    this.on(routes[i][0], routes[i][1], routes[i][2]);
                }
            } else {
                this.on(routes[0], routes[1], routes[2]);
            }
        }
    };

    Kingpin.prototype._onPopState = function(e) {
        this.setRoute(location.pathname);
    };

    Kingpin.prototype._onLinkClick = function(e) {
        var node = e.target;
        while (node.tagName !== 'A' && node.parentNode)  {
            node = node.parentNode;
        }

        if (node && node.tagName === 'A' && node.href.indexOf(this.baseURL) === 0) {
            if (this.setRoute(node.href.substring(this.baseURL.length))) {
                e.preventDefault();
            }
        }
    };

    Kingpin.prototype.on = function(route, action, scope) {
        var self = this;
        var routeName = _buildRouteName(route);

        if (this.route[routeName]) {
            return;
        }

        this.routes.push(routeName);
        this.route[routeName.toUpperCase()] = route;
        this.urlFor[routeName] = function() {
            return _urlFor(route, arguments);
        };
        this.actions[routeName] = action;
        this.go[routeName] = function() {
            action.apply(scope, arguments);
            history.pushState(null, null, self.urlFor[routeName].apply(self, arguments));
        };
        this.actions[routeName] = action;
        this.regexRoutes[routeName] = new RegExp(_toRegexRoute(route));

        return this;
    };

    Kingpin.prototype.setRoute = function(pathname) {
        var numRoutes = this.routes.length;
        for (var i = 0; i < numRoutes; ++i) {
            var routeName = this.routes[i];
            var result = pathname.match(this.regexRoutes[routeName]);
            if (result) {
                result.shift();
                this.go[routeName].apply(this, result);
                return true;
            }
        }
        return false;
    };

    Kingpin.prototype.startListening = function() {
        if (document.body.addEventListener) {
            document.body.addEventListener('click', this._onLinkClick.bind(this));
        }

        if (history.pushState) {
            window.addEventListener("popstate", this._onPopState.bind(this));
        }
        return this;
    };

    Kingpin.prototype.stopListening = function() {
        if (document.body.addEventListener) {
            document.body.removeEventListener('click', this._onLinkClick.bind(this));
        }

        if (history.pushState) {
            window.removeEventListener("popstate", this._onPopState.bind(this));
        }
        return this;
    };

    window.Kingpin = Kingpin;
})();
```
