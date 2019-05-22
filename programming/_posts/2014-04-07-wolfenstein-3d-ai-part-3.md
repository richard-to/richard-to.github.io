---
layout: post
title: "Wolfenstein 3D AI - Part 3: X11"
---

For this project to work, the program needs to be able to simulate keyboard events to control the character. In addition, it would be nice to be able to grab frames from the game window as if the game were being recorded. The other requirement was this all needed to run on Linux since Windows 7 runs too slow from a VM. Lubuntu on a VM, on the other hand, is lightweight and runs well. After some research, X11 turned out to be what I needed.

The following are mostly proof of concept programs to test if X11 provided the functionality I was looking for.

**Program:**

x11\_click\_test.cpp

**Description:**

Proof of concept that x11 can work. Mouse click simulation.

**Source:**

[Ran and tested the code in this StackOverflow answer.](http://stackoverflow.com/questions/2607010/linux-how-to-capture-screen-and-simulate-mouse-movements/8792991#8792991)

***


**Program:**

xdotool\_test.sh

**Description:**

Evaluate if xdotool could be used.

**Source:**

```
#!/bin/bash

# Use xdotool to find Wolf3D game window and fire gun after 1 second
xdotool search "DOSBOX*" windowactivate
sleep 1
xdotool key ctrl
```

***

**Program:**

ex1/x11\_screen\_grab.cpp

**Description:**

Proof of concept that we can get pixel values from a window using XLib

**Source:**

[Ran and tested the code in this StackOverflow answer.](http://stackoverflow.com/questions/17518610/how-to-get-a-screen-pixels-color-in-x11/17525571#17525571)

***

**Program:**

ex2/x11\_screen\_grab.cpp


**Description:**

Further proof of concept that takes frames from Wolf3D game, converts them to OpenCV Mat, and displays them in an OpenCV image window.

**Development Notes:**

X11 api and documentation is difficult to follow. Mainly because it’s a C api and there aren’t that many examples out there.

For some reason the colors are returned in what looks to be BGR format. This is worrisome because it seems X11 returns pixel values in different formats based on the monitor. There is probably a way to normalize to RGB though.

This program uses the extended window manager hint (EWMH) "\_NET\_CLIENT\_LIST" to a list of active windows from the root. This makes it easier to find the active Wolf3D window. The alternative is recursively going through the window tree. The concern with using "\_NET\_CLIENT\_LIST" is that this only works if the window manager implements EWMH. According to Wikipedia EWMH extends Inter-Client Communication Conventions Manual (ICCCM) functionality. This means that the "\_NET\_CLIENT\_LIST: may not work in all flavors of Linux. This code was run in Lubuntu 13.10 with LXDE.

**Source:**

[View Gist](https://gist.github.com/richard-to/10017943#file-x11_screen_grab-cpp)

```
#include <iostream>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/highgui/highgui.hpp>

#include <X11/Xlib.h>
#include <X11/Xutil.h>

using namespace cv;
using namespace std;

#define ACTIVE_WINDOWS "_NET_CLIENT_LIST"

#define WINDOW_TITLE "Wolf3d Screenshot"
#define WINDOW_DOXBOX "DOSBox"

// Find the DOSBox Window so we can do cool stuff with it!
bool findDOSBoxWindow(Display *display, Window &window)
{
    bool found = false;
    Window rootWindow = RootWindow(display, DefaultScreen(display));
    Atom atom = XInternAtom(display, ACTIVE_WINDOWS, true);
    Atom actualType;
    int format;
    unsigned long numItems;
    unsigned long bytesAfter;

    unsigned char *data = '\0';
    Window *list;
    char *windowName;

    int status = XGetWindowProperty(display, rootWindow, atom, 0L, (~0L), false,
        AnyPropertyType, &actualType, &format, &numItems, &bytesAfter, &data);
    list = (Window *)data;

    if (status >= Success && numItems) {
        for (int i = 0; i < numItems; ++i) {
            status = XFetchName(display, list[i], &windowName);
            if (status >= Success) {
                string windowNameStr(windowName);
                if (windowNameStr.find(WINDOW_DOXBOX) == 0) {
                    window = list[i];
                    found = true;
                    break;
                }
            }
        }
    }

    XFree(windowName);
    XFree(data);

    return found;
}

int main(int argc, char *argv[])
{
    Display *display = XOpenDisplay(NULL);
    Window rootWindow = RootWindow(display, DefaultScreen(display));
    Window DOSBoxWindow;

    XWindowAttributes DOSBoxWindowAttributes;
    if (findDOSBoxWindow(display, DOSBoxWindow) == false) {
        printf("Error: Cannot find DOSBox window. Exiting program.");
        return 0;
    }

    XGetWindowAttributes(display, DOSBoxWindow, &DOSBoxWindowAttributes);

    int width = DOSBoxWindowAttributes.width;
    int height = DOSBoxWindowAttributes.height;

    namedWindow(WINDOW_TITLE, WINDOW_AUTOSIZE);

    Mat frame = Mat::zeros(height, width, CV_8UC3);
    Vec3b frameRGB;

    XColor colors;
    XImage *image;

    unsigned long red_mask;
    unsigned long green_mask;
    unsigned long blue_mask;

    while (true) {
        image = XGetImage(
            display, DOSBoxWindow, 0, 0, width, height, AllPlanes, ZPixmap);

        red_mask = image->red_mask;
        green_mask = image->green_mask;
        blue_mask = image->blue_mask;

        for (int i = 0; i < height; ++i) {
            for (int j = 0; j < width; ++j) {
                colors.pixel = XGetPixel(image, j, i);

                // TODO(richard-to): Figure out why red and blue are swapped
                frameRGB = frame.at<Vec3b>(i, j);
                frameRGB.val[0] = colors.pixel & blue_mask;
                frameRGB.val[1] = (colors.pixel & green_mask) >> 8;
                frameRGB.val[2] = (colors.pixel & red_mask) >> 16;
                frame.at<Vec3b>(i, j) = frameRGB;
            }
        }

        XFree(image);

        imshow(WINDOW_TITLE, frame);

        if (waitKey(10) >= 0) {
            break;
        }
    }
}
```

***

**Program:**

x11\_send\_event.cpp

**Description:**

A further proof of concept to show that keyboard events can be sent without window focus.

**Development Notes:**

There were issues getting keyboard events sent to the Wolf3D window.

Some applications, such as Firefox (according to some websites), ignore automated keyboard events sent from x11 to a specific window. When the `XSendEvent` is called the `XLib` library will set the send_event field in the `XKeyEvent` struct to true.

This can be worked around by overriding the `XNextEvent` function using `LD_PRELOAD`. This is described [here](http://www.semicomplete.com/blog/geekery/xsendevent-xdotool-and-ld_preload.html).

The above links uses a library called `liboverride` to simplify the usage of `LD_PRELOAD`.

Luckily this was not the issue.

There are two ways to send keyboard events to a window. One way is using `XSendEvent`. This is the preferred way since the window does not have to be focused for an event to be sent.

The alternative is to use an extension library called `XTest`.

This library can be installed using `sudo apt-get install libx11-dev` and including the header `#include <X11/extensions/XTest.h>`

The drawback of XTest is that the window needs to be focused before an event can be sent. This means that adding real-time visualization would not work well.

Luckily using XTest was not needed.

The `XSendEvent` function was not working because of two mistakes in the program. The first was that both the key down and key release events were called at the same time. And the second issue was that `XFlush` needed to be called after `XSendEvent`. This was not described in any of the documentation or code examples found online.

Finally code that worked:

```
XKeyEvent event;
event.type = KeyPress;
event.display = display;
event.send_event = False;
event.window = DOSBoxWindow;
event.root = rootWindow;
event.time = CurrentTime;
event.same_screen = True;
event.keycode = XKeysymToKeycode(display, XK_Up);
XSendEvent(display, DOSBoxWindow, True, KeyPressMask, (XEvent *)&event);
XFlush(display);

millisleep(100);

event.type = KeyRelease;
XSendEvent(display, DOSBoxWindow, True, KeyReleaseMask, (XEvent *)&event);
XFlush(display);
```

**Source:**

[View Gist](https://gist.github.com/richard-to/10017943#file-x11_send_event-cpp)
