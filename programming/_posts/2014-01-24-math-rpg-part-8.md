---
layout: post
title: "Math RPG - Part 8: Jasmine 2.0/RequireJS"
---

Development has slowed down quite a bit in the last few weeks. Part of that is school started last week. But mainly I hit a wall and have been indecisive on how to proceed. As usual my inner-perfectionist wants to clean up the game engine and start adding unit tests and some automation. This week I decided that I would work more on structure even that means no new features on the game. The biggest thing is to just keep hacking away at the project even if I'm doing things aren't necessary yet.

To deal with the school work taking over my life as usual, I carved a block of time early in the day to work on my RPG for at least an hour. Just need to stick with it and stay positive.

This week I integrated Require JS and Jasmine 2.0. Require JS is asynchronously loads javascript files when you need them and Jasmine is a nifty unit testing library. I love Require JS, but one downside is that it doesn't work naturally with unit test libraries due the asynchronous asset loading. This has prevented me from writing unit tests when using Require JS.

Turns out that it is fairly simple to set up using Jasmine 2.0 since its syntax for async support. With Jasmine 1.3, the async support is a bit messier.

Here is an annotated example the modified SpecRunner.html that comes with Jasmine 2.0 standalone.

```html
<!DOCTYPE HTML>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Jasmine Spec Runner v2.0.0</title>

  <link rel="shortcut icon" type="image/png" href="lib/jasmine-2.0.0/jasmine_favicon.png">
  <link rel="stylesheet" type="text/css" href="lib/jasmine-2.0.0/jasmine.css">

  <!--
  Notice that I just load Jasmine normally
  -->
  <script type="text/javascript" src="lib/jasmine-2.0.0/jasmine.js"></script>
  <script type="text/javascript" src="lib/jasmine-2.0.0/jasmine-html.js"></script>
  <script type="text/javascript" src="lib/jasmine-2.0.0/boot.js"></script>

  <!--
  Here we load require.js but we do not use data-main. Instead we will load the
  the specs separately. In short we need to load the spec files synchronously for this
  to work.
  -->
  <script type="text/javascript" src="js/vendor/require.min.js"></script>

  <!--
  I put my require js config inline for simplicity
  -->
  <script type="text/javascript">
    require.config({
      baseUrl: 'js',
      shim: {
          'underscore': {
              exports: '_'
          },
          'react': {
              exports: 'React'
          }
      },
      paths: {
          jquery: 'vendor/jquery.min',
          underscore: 'vendor/underscore.min',
          react: 'vendor/react.min'
      }
    });
  </script>

  <!--
  I put my spec files here
  -->
  <script type="text/javascript" src="spec/a-spec.js"></script>
  <script type="text/javascript" src="spec/some-other-spec.js"></script>
</head>

<body>
</body>
</html>
```

Here is an example of a spec file and you can use Require JS to load assets using Jasmine 2.0 async support.

```
describe("Circular List Operation", function() {
    // The CircularList object needs to be loaded by RequireJs
    // before we can use it.
    var CircularList;

    // require.js loads scripts asynchronously, so we can use
    // Jasmine 2.0's async support. Basically it entails calling
    // the done function once require js finishes loading our asset.
    //
    // Here I put the require in the beforeEach function to make sure the
    // Circular list object is loaded each time.
    beforeEach(function(done) {
        require(['lib/util'], function(util) {
            CircularList = util.CircularList;
            done();
        });
    });

    it("should know if list is empty", function() {
        var list = new CircularList();
        expect(list.isEmpty()).toBe(true);
    });

    // We can also use the async feature on the it function
    // to require assets for a specific test.
    it("should know if list is not empty", function(done) {
        require(['lib/entity'], function(entity) {
            var list = new CircularList([new entity.Cat()]);
            expect(list.isEmpty()).toBe(false);
            done();
        });
    });
});
```
