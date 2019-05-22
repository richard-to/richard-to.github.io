---
layout: post
title: "Wolfenstein 3D AI - Part 4: Preparing for SIFT"
---

My favorite part about my Machine and Computer Vision course is that we get to implement some algorithms from the ground up instead of relying on OpenCV. I've also taken it upon myself to learn and implement Sobel, Canny, and the Hough transform. My implementations need more refining, although I finally worked out the kinks from my Sobel code. I think that's the best way to learn. It takes a long time, but it's worth it. For this project, I would like to implement SIFT from the ground up instead of using the OpenCV version. This post goes through a few smaller algorithms that I needed to implement to complete the first step of the SIFT algorithm.

**Program:**

scale\_up.cpp

**Description:**

Implementation of linear interpolation to scale up an image. The first step for building the scale-space pyramids in SIFT is to double the size of the initial image using linear interpolation. The image needs to be blurred first to avoid anti-aliasing. This apparently increases the number of keypoints detected.

**Development Notes:**

The linear interpolation algorithm is relatively straightforward. But some parts can be unclear for those who are weak at math like me. It helps to draw out at 4x4 image and double the size to give a 16 by 16 image.

Some questions that arose were how to pick x and x1 points and how to handle edge pixels that didn’t have two adjacent pixels.

I'll plan to provide some images in the next day or two.

**Source:**

[View Gist](https://gist.github.com/richard-to/10019190#file-scale_up-cpp)

```
#include <iostream>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/highgui/highgui.hpp>

#define WINDOW_TITLE "2x Scale Up"
#define IMAGE "chugach-mtns.jpg"

using namespace cv;
using namespace std;

int main(int argc, char *argv[])
{
    namedWindow(WINDOW_TITLE, WINDOW_AUTOSIZE);

    Mat src = imread(IMAGE);
    Mat scaled = Mat::zeros(src.rows * 2, src.cols * 2, CV_8UC3);
    Vec3b p0;
    Vec3b p1;
    Vec3b pInterpolated;

    for (int i = 0; i < src.rows; ++i) {
        for (int j = 0; j < src.cols; ++j) {
            scaled.at<Vec3b>(i * 2, j * 2) = src.at<Vec3b>(i, j);

            if (i + 1 == src.rows) {
                scaled.at<Vec3b>(i * 2 + 1, j * 2) = src.at<Vec3b>(i, j);
            } else {
                p0 = src.at<Vec3b>(i, j);
                p1 = src.at<Vec3b>(i + 1, j);
                pInterpolated.val[0] = p0.val[0] + (p1.val[0] - p0.val[0]) * 0.5;
                pInterpolated.val[1] = p0.val[1] + (p1.val[1] - p0.val[1]) * 0.5;
                pInterpolated.val[2] = p0.val[2] + (p1.val[2] - p0.val[2]) * 0.5;
                scaled.at<Vec3b>(i * 2 + 1, j * 2)  = pInterpolated;
            }

            if (j + 1 == src.cols) {
                scaled.at<Vec3b>(i * 2, j * 2 + 1) = src.at<Vec3b>(i, j);
            } else {
                p0 = src.at<Vec3b>(i, j);
                p1 = src.at<Vec3b>(i, j + 1);
                pInterpolated.val[0] = p0.val[0] + (p1.val[0] - p0.val[0]) * 0.5;
                pInterpolated.val[1] = p0.val[1] + (p1.val[1] - p0.val[1]) * 0.5;
                pInterpolated.val[2] = p0.val[2] + (p1.val[2] - p0.val[2]) * 0.5;
                scaled.at<Vec3b>(i * 2, j * 2 + 1)  = pInterpolated;
            }

            if (i + 1 == src.rows || j + 1 == src.cols) {
                scaled.at<Vec3b>(i * 2 + 1, j * 2 + 1) = src.at<Vec3b>(i, j);
            } else {
                p0 = src.at<Vec3b>(i, j);
                p1 = src.at<Vec3b>(i + 1, j + 1);
                pInterpolated.val[0] = p0.val[0] + (p1.val[0] - p0.val[0]) * 0.5;
                pInterpolated.val[1] = p0.val[1] + (p1.val[1] - p0.val[1]) * 0.5;
                pInterpolated.val[2] = p0.val[2] + (p1.val[2] - p0.val[2]) * 0.5;
                scaled.at<Vec3b>(i * 2 + 1, j * 2 + 1)  = pInterpolated;
            }
        }
    }
    imshow(WINDOW_TITLE, scaled);
    waitKey(0);
}
```

***

**Program:**

scale\_down.cpp

**Description:**

Resample an image to half the size. Lowe’s paper on SIFT says to sample pixels from every second row and and second column.

**Source:**

[View Gist](https://gist.github.com/richard-to/10019190#file-scale_down-cpp)

```
#include <iostream>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/highgui/highgui.hpp>

#define WINDOW_TITLE "2x Scale Down"
#define IMAGE "chugach-mtns.jpg"

using namespace cv;
using namespace std;

int main(int argc, char *argv[])
{
    namedWindow(WINDOW_TITLE, WINDOW_AUTOSIZE);

    Mat src = imread(IMAGE);
    Mat scaled = Mat::zeros(src.rows / 2, src.cols / 2, CV_8UC3);

    for (int i = 0; i < scaled.rows; ++i) {
        for (int j = 0; j < scaled.cols; ++j) {
            scaled.at<Vec3b>(i, j) = src.at<Vec3b>(i * 2, j * 2);
        }
    }
    imshow(WINDOW_TITLE, scaled);
    waitKey(0);
}
```

***

**Program:**

gaussian\_blur.cpp

**Description:**

Apply gaussian blur on an image using a 3x3 kernel with normalized sigma values and then use the kernel with a basic point spread function.

**Development Notes:**

I tested the program with a sigma value of 1.0 and compared the results testing against kernel calculated in Google Sheets. [The equation for 2D gaussian is the one described in this Wikipedia entry](http://en.wikipedia.org/wiki/Gaussian_blur)

<table>
    <tr>
        <td>Kernel - Sigma 1.0</td>
        <td>X Distance</td>
        <td>Y Distance</td>
        <td>Normalized</td>
    </tr>
    <tr>
        <td>0.0585</td>
        <td>1</td>
        <td>1</td>
        <td>0.0751</td>
    </tr>
    <tr>
        <td>0.0965</td>
        <td>1</td>
        <td>0</td>
        <td>0.124</td>
    </tr>
    <tr>
        <td>0.0585</td>
        <td>1</td>
        <td>1</td>
        <td>0.0751</td>
    </tr>
    <tr>
        <td>0.0965</td>
        <td>0</td>
        <td>1</td>
        <td>0.124</td>
    </tr>
    <tr>
        <td>0.159</td>
        <td>0</td>
        <td>0</td>
        <td>0.204</td>
    </tr>
    <tr>
        <td>0.0965</td>
        <td>0</td>
        <td>1</td>
        <td>0.124</td>
    </tr>
    <tr>
        <td>0.0585</td>
        <td>1</td>
        <td>1</td>
        <td>0.0751</td>
    </tr>
    <tr>
        <td>0.0965</td>
        <td>1</td>
        <td>0</td>
        <td>0.124</td>
    </tr>
    <tr>
        <td>0.0585</td>
        <td>1</td>
        <td>1</td>
        <td>0.0751</td>
    </tr>
</table>

**Source:**

[View Gist](https://gist.githubusercontent.com/richard-to/10019190/raw/f95c0d822ae0a8f47ffb8b3727843e1cfd0b2671/gaussian_blur.cpp)

```
#include <iostream>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/highgui/highgui.hpp>

#define WINDOW_TITLE "Gaussian Blur"
#define IMAGE "chugach-mtns.jpg"
#define SIGMA 1.0

using namespace cv;
using namespace std;

int main(int argc, char *argv[])
{
    namedWindow(WINDOW_TITLE, WINDOW_AUTOSIZE);

    Mat src = imread(IMAGE);
    Mat blur = Mat::zeros(src.rows, src.cols, CV_8UC3);

    double kernel[3][3];
    double sum = 0;
    double sigFactor = 1.0 / (2.0 * M_PI * SIGMA * SIGMA);

    // Calculate 3x3 kernel given sigma
    for (int x = 0; x < 3; ++x) {
        int xdist = abs(x - 1);
        int xdistsq = xdist * xdist;
        for (int y = 0; y < 3; ++y) {
            int ydist = abs(y - 1);
            int ydistsq = ydist * ydist;
            kernel[x][y] = sigFactor * exp(-((xdist + ydistsq) / (2.0 * SIGMA * SIGMA)));
            sum += kernel[x][y];
        }
    }

    // Normalize Sigma
    for (int x = 0; x < 3; ++x) {
        for (int y = 0; y < 3; ++y) {
            kernel[x][y] = kernel[x][y] / sum;
        }
    }

    // Log Kernel for Sanity Check
    for (int x = 0; x < 3; ++x) {
        printf("%f %f %f\n", kernel[x][0], kernel[x][1], kernel[x][2]);
    }

    // Apply kernel
    for (int i = 1; i < blur.rows - 1; ++i) {
        for (int j = 1; j < blur.cols - 1; ++j) {
            Vec3b p0 = src.at<Vec3b>(i - 1, j - 1);
            Vec3b p1 = src.at<Vec3b>(i - 1, j);
            Vec3b p2 = src.at<uchar>(i - 1, j + 1);

            Vec3b p3 = src.at<Vec3b>(i, j - 1);
            Vec3b p4 = src.at<Vec3b>(i, j);
            Vec3b p5 = src.at<Vec3b>(i, j + 1);

            Vec3b p6 = src.at<Vec3b>(i + 1, j - 1);
            Vec3b p7 = src.at<Vec3b>(i + 1, j);
            Vec3b p8 = src.at<Vec3b>(i + 1, j + 1);

            double r =
                p0[0] * kernel[0][0] + p1[0] * kernel[0][1] + p2[0] * kernel[0][2] +
                p3[0] * kernel[1][0] + p4[0] * kernel[1][1] + p5[0] * kernel[1][2] +
                p6[0] * kernel[2][0] + p7[0] * kernel[2][1] + p8[0] * kernel[2][2];

            double g =
                p0[1] * kernel[0][0] + p1[1] * kernel[0][1] + p2[1] * kernel[0][2] +
                p3[1] * kernel[1][0] + p4[1] * kernel[1][1] + p5[1] * kernel[1][2] +
                p6[1] * kernel[2][0] + p7[1] * kernel[2][1] + p8[1] * kernel[2][2];

            double b =
                p0[2] * kernel[0][0] + p1[2] * kernel[0][1] + p2[2] * kernel[0][2] +
                p3[2] * kernel[1][0] + p4[2] * kernel[1][1] + p5[2] * kernel[1][2] +
                p6[2] * kernel[2][0] + p7[2] * kernel[2][1] + p8[2] * kernel[2][2];

            Vec3b q0;
            q0[0] = r;
            q0[1] = g;
            q0[2] = b;

            blur.at<Vec3b>(i, j) = q0;
        }
    }
    imshow(WINDOW_TITLE, blur);
    waitKey(0);
}
```
