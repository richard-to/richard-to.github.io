---
layout: post
title: "Flashcards with Evernote"
---

I'm taking Anatomy and Physiology 1 (A&P1 from here on) this semester because it meets one of my science requirements. It just so happens that I received transfer credits for Biology 1, which I took at a previous University. This means that I just need to take A&P1 with corresponding lab. Otherwise I would need to take two Astrology courses. In terms of time and cost, taking A&P1 is the logical choice even though it is a lot of work, particularly in the area of memorizing hundreds and hundreds of terms.

I never do flashcards and I dislike memorization for the sake of passing exams, but in this case I just want to pass the course. Anatomy and Physiology are just not that interesting to me. Sometimes I think I would be better suited as some kind of cyborg.

I use Evernote for most of my note-taking these days. I use it because it's the best from hundreds of flawed note-taking apps. I like that Evernote is multi-platform. I can use it with Windows Phone, iPad, or MacBook. I also like the Web Clipper, but unfortunately it's gotten buggy in the latest versions. The big drawback is Evernote's lack of support for LaTeX equations and markdown. Granted those are niche features.

Anyway, I wanted a way to display my Evernote notes as flashcards using a simple web page and some JavaScript. That way I could study on the bus and at home. There are some Evernote apps, such as Study Blue, that have note card integration with Evernote, but I'm tired of signing up for service after service.

I considered using the Evernote API to build my own simple notecard app. Unfortunately the app needs to be made public before I can use it in Evernote. Otherwise I'm stuck using sandbox accounts for development. I can understand why Evernote does this, but that was a deal-breaker.

Luckily, you can export Notebooks in HTML or ENEX format. I went with HTML because it seemed easier to convert to JSON. The format of the HTML export is a bunch of HTML files, one for each note. Then there are folders named "title of note.resources". These contain the image files attached to a note. With ENEX, all the notes are in one file and I think the image resources  are base64 encoded in that file also.

With the help of Beautiful Soup 4, parsing the HTML was relatively easy. And the Javascript to randomize the notes and display them was also simple enough that I was mostly able to write the code while watching two Golden State Warriors games this week. It's nice to be able to finish even the most basic projects sometimes.

There were a few gotchas that I encountered. The first was that Evernote does not encode question marks in titles when creating the resource folders. This makes breaks images since question marks signify that query parameters are next in a url. The other slightly tricky issue was figuring out how to handle and merge notes from multiple notebooks. Mainly I had a use case where I wanted to study notes from a specific section only.

Here is a screenshot of the mobile view for one of the notes. Pretty barebones so far. I plan to add features as I need them and if I actually use this to study.

![Flashcard example](/images/flashcard-ex1.png)

Here is a screenshot that allows me to select a specific set of flashcards to show.

![TOC of flashcard app](/images/flashcard-toc.png)

You can try out the [flashcards here](/projects/flashcards).

Finally here is the script that I wrote to parse the exported notes.

{% highlight python linenos %}
    import argparse
    import distutils.core
    import json

    from datetime import datetime
    from os import listdir
    from os.path import isfile, isdir, join, basename
    from xml.sax.saxutils import escape

    from bs4 import BeautifulSoup

    parser = argparse.ArgumentParser(description='Convert Evernote HTML export directory into JSON')
    parser.add_argument('directories', metavar='D', nargs='+', help='A list of Evernote export directories')
    parser.add_argument('-o', '--output', help='Output directory', required=True)
    parser.add_argument('-f', '--file', help="Output JSON/JS file", required=True)
    args = parser.parse_args()

    directories = args.directories
    output = args.output
    outfile = args.file

    data = {}
    for directory in directories:
        noteSet = []
        files = [f for f in listdir(directory) if isfile(join(directory, f)) and f.endswith('.html') and f != 'index.html']
        resources = [d for d in listdir(directory) if isdir(join(directory, d))]
        for r in resources:
            distutils.dir_util.copy_tree(join(directory, r), join(output, basename(directory), r))

        for f in files:
            h = open(join(directory, f))
            soup = BeautifulSoup(h)
            for img in soup.find_all('img'):
                img['src'] = '/'.join([basename(directory), img['src'].replace('?', '%3F')])

            noteSet.append({
                'title': soup.find('title').get_text(),
                'content': soup.find('body').encode_contents()
            })
            h.close()
        data[basename(directory)] = noteSet

    with open(join(output, outfile), 'w') as f:
        f.write('var data = ' + json.dumps(data) + ";");

{% endhighlight %}