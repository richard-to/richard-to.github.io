---
layout: post
title: "Project Wonderchicken - Part 1: Getting started"
---

I know what you're thinking. What is Project Wonderchicken? Well, I hate to tell you, but it has nothing to do with creating flying chickens with super strength and laser vision. Really, it's just the codename for a relatively mundane web application I started last month.

Ok, so what the heck is a Wonderchicken? I would like to say it is a brand of chicken from the makers of Wonder Bread, but it's obviously not since the phrasing is different. And cross-contamination possibilities abound.

In actuality, Wonderchicken - or more specifically the "Year of the Perdue Wonderchicken" - is just a random reference to Infinite Jest by David Foster Wallace. Isn't that how all codenames are chosen?

Three paragraphs about the project's codename is a sign of some serious procrastination issues. Even this blog post, if I may be somewhat embarrassingly meta for a moment, just further adds to the, what is now incriminating, evidence. And whatever I say in defense of this post is purely motivated by the fact that I don't want to admit that this project depresses me.

First off, this project is a remake of a legacy web application that I worked on and which has been in production for a few years. In summer blockbuster terms, this is a reboot of the franchise, a re-imagining. Already, warning signs, big red flags, and alarms should be going off. It's a bad idea to remake an application from the ground up, yet I'm doing it despite numerous doubts. Sometimes the only way to innovate is to start over.

One thing about remakes that I never thought about is this whole idea of needing to be undoubtedly better than the predecessor. For example, "The Departed" versus "Internal Affairs." There's just no justification for rebuilding something only to have it turn out like the recent "Friday the 13th" or "Nightmare on Elm Street" reboots. For movies, the nostalgia and reputation of the franchises still bring in ticket sales, but web applications are different. Users will want their favorite features back, complain about the alien landscape of their new user interface, and expect their data is intact. And then there will be the bugs, which will appear more pronounced when compared against a stable web application.

Aside from the above user requirements, it better also be the super intuitive UX, mobile-optimized, high performance, bug-free, perfectly architected piece of software everyone dreams about.

I almost want to hack out a prototype while drunk 70% of the time, just to calm the sense of doubt and impatience. I mean it works for writers, why not programmers?

To get a sense of my paralysis, here is an overview of my decisions:

### Flask

I chose Flask over Django because I like the idea of a lightweight web framework that gets out of the way. The inevitable problem is that 3rd party plugins will be needed and they take time to learn and don't always work together smoothly. In addition, more time needs to be spent on architecture and organization. And then you're (or rather I'm) left wondering whether you should have just gone with Django in first the place, but now can't commit fully to that change since so much time was invested in learning best practices for Flask web applications and associated ecosystem of plugins.

### Postgres

I've been meaning to try Postgres ever since Oracle bought Sun Microsystems and left me with the impression that MySQL was doomed. My initial impression of Postqres has been good. All the different data types are awesome and make it appear to be a good balance between NoSQL and SQL databases. It remains to be seen how much my MySQL experience will transfer though.

### React

React just makes sense, especially when combined with the Flux pattern. Backbone was awesome until I had to deal with nested views beyond a simple list of items. AngularJS never felt right. I learned a lot from their dependency injection implementation, but they lost me at Directives, which appear too complicated, especially in comparison to React.

### Less

Not much of a learning curve here. Similar enough enough to SASS/SCSS that the transition was relatively smooth. The only reason to switch to Less here is because I prefer Node over Ruby when it comes to dev tools.

### Gulp

I tried hard to stick with Grunt, but it's too slow for continuously building JavaScript, which appears to be the preferred work flow these days given the popularity of Browserify and Webpack. The transition to Gulp wasn't bad once I decided to commit to it and studied a few examples. Being able to use JavaScript is a slight improvement, but I would rather use Makefiles combined with the ability to run a build when changes are detected.

### Webpack

I started with RequireJS three years ago. It was kind of complicated to set up and required some extra syntax and configuration, but it was worth the effort at the time. For this project, the Browserify approach just seemed easier, but the build process became problematic when a large library, such as React, needed to be included in the build. There is a tool called Watchify, that apparently does incremental builds, but instead I switched to Webpack. The main downside is that the incremental build does not work well with the Grunt or Gulp yet. One weird thing about Webpack is the need to use their built-in development server for optimal performance or benefit or whatever. That's a bit too opinionated.

### Vagrant

I've been using Vagrant for a while and it's great. One thing that frustrates me is the inability to use Puppet Forge modules. The best solution is to use Puppet-Librarian, which is a Ruby gem that needs to be installed. Luckily it's straightforward to use. I'm tempted to replace Puppet with Ansible.

Back in the day (like 2-3 years ago) I used to enjoy learning all these new software development tools and programming languages. Now it all seems kind of absurd to keep following what are necessary, but mostly slightly forward laterals. The truth is no matter how much we try to improve JavaScript through this endless kludge of build tools, it's still JavaScript. Or maybe this is a sign that I'm getting old.

On a side note, here is a comparison of two functionally identical Grunt and Gulp files. I even did the two spaces thing that is popular these days.

### Gruntfile.js example

```js
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: ['js', 'css', 'fonts'],

    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: 'src/less/font-awesome/fonts',
            src: ['*.{eot,svg,ttf,woff}'],
            dest: 'fonts/'
          },
          {
            expand: true,
            cwd: 'src/less/bootstrap/fonts',
            src: ['*.{eot,svg,ttf,woff}'],
            dest: 'fonts/'
          },
          {
            expand: true,
            cwd: 'vendor/js',
            src: ['*.js'],
            dest: 'js/vendor/'
          }
        ]
      },
    },

    jshint: {
      files: {
        src: [
          'Gruntfile.js',
          'src/js/**/*.js',
        ]
      }
    },

    less: {
      development: {
        files: {
          "css/styles.css": "src/less/styles.less"
        }
      }
    },

    webpack: {
      development: {
        cache: true,
        entry: {
          TestApp: './src/js/TestApp.jsx',
          Test2App: './src/js/Test2App.jsx',
        },
        watch: true,
        keepalive: true,
        output: {
          path: './js',
          filename: '[name].js'
        },
        module: {
          loaders: [
            { test: /\.jsx$/, loader: 'jsx' },
            { test: /\.js$/, loader: 'jsx' }
          ]
      }
      },
    },

    watch: {
      less: {
        files: ['src/less/styles.less'],
        tasks: ['less']
      },
      js: {
        files: ['src/js/**/*.{jsx,js}'],
        tasks: ['webpack']
      },
    }
  });

  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint', 'copy', 'less', 'webpack']);
  grunt.registerTask('build', ['jshint', 'clean', 'copy', 'less', 'webpack']);
};
```

### gulpfile.js example

```js
var gulp = require('gulp');

var gutil = require("gulp-util");
var clean = require('gulp-clean');
var webpack = require('gulp-webpack');
var jshint = require('gulp-jshint');
var less = require('gulp-less');

gulp.task('copy', function() {
  gulp.src('./src/less/font-awesome/fonts/*', {base: './src/less/font-awesome/fonts'})
    .pipe(gulp.dest('./fonts/'));

  gulp.src('./src/less/bootstrap/fonts/*', {base: './src/less/bootstrap/fonts'})
    .pipe(gulp.dest('./fonts/'));

  gulp.src('./vendor/js/*', { base: './vendor/js'})
    .pipe(gulp.dest('./js/vendor/'));
});

gulp.task('styles', function () {
  return gulp.src('./src/less/styles.less')
    .pipe(less())
    .pipe(gulp.dest('./css/'));
});

gulp.task('lint', function() {
  return gulp.src(['./src/js/*.jsx', './src/js/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('scripts', function(callback) {
  return gulp.src(['./src/js/*.jsx', './src/js/*.js'])
    .pipe(webpack({
      cache: true,
      entry: {
        TaskApp: './src/js/TaskApp.jsx',
        MentorshipApp: './src/js/MentorshipApp.jsx',
      },
      output: {
        filename: '[name].js'
      },
      module: {
        loaders: [
          { test: /\.jsx$/, loader: 'jsx' },
          { test: /\.js$/, loader: 'jsx' }
        ]
      }
    }))
  .pipe(gulp.dest('./js/'));
});

gulp.task('clean', function() {
  return gulp.src(['css', 'js', 'fonts', 'images'], {read: false})
    .pipe(clean());
});

gulp.task('default', function() {
  gulp.start('copy', 'styles', 'lint', 'scripts');
});

gulp.task('watch', function() {
  gulp.watch('src/less/**/*.less', ['styles']);
  gulp.watch(['src/js/**/*.js', 'src/js/**/*.jsx'], ['scripts']);
});
```
