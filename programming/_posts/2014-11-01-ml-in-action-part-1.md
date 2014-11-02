---
layout: post
title: "ML in Action - Part 1: KNN Toy Example"
---

I bought the book ["Machine Learning in Action"](http://www.manning.com/pharrington/)
by Peter Harrington back in May, but haven't found time to really read it.
I keep wavering on what the best approach to understanding Machine Learning is.
Should I start with basic statistics and probability and linear algebra followed
by a heavy dose of theory? Or should I jump in to practical usage and leverage
machine learning libraries such as Scikit Learn? Harrington's book focuses on
practical usage and examples, but also provides the implementation details of
the algorithms he covers. Math and theory are kept to a minimum. The first
algorithm he describes is K-Nearest-Neighbors (kNN).

The kNN algorithm is intuitive and easy to understand. Basically if you can
plot each data-point on a graph, nearby points are likely to be of the same
classification. The number of neighbors to use is designated by the variable
`k`.

Harrington starts off with a simple example that uses (x,y) coordinates. This is
helpful because we can graph the coordinates and see the clusters. If a more
realistic example was used with say five dimensions, it would be difficult to
draw. The other benefit is we can use Euclidean distance to calculate distance
from points.

Here is the basic algorithm:

1. For each point in our training set, calculate the distance to our myster point.
2. Get the top K closet points (nearest neighbors)
3. Return the label found most of often in the top K points

The sample code that Harrington uses relies on numpy. This made the code a bit
more obscure since I'm a novice with numpy. For educational purposes I wrote my
own implementation using basic python:

{% highlight python linenos %}
import math
import numpy as np


def createDataSet():
    """
    Creates a basic data set labels.

    The labels are the classification given to the points. The data
    is hardcoded in this toy example.

    Returns:
        A numpy array of (x,y) points and a corresponding list of labels
    """
    group = np.array([[1.0, 1.1], [1.0, 1.0], [0, 0], [0, 0.1]])
    labels = ['A', 'A', 'B', 'B']
    return group, labels


def classify(point, training_set, labels, k=1):
    """
    Classify a given point using the training set and associated labels.

    Args:
        point: A tuple of (x,y) coordinates
        training_set: An array of (x,y) coordinates
        labels: Labels associate with training set
        k: Number of neighbors to take into account

    Returns:
        Classification for given point
    """

    # Calculate distance between points using Euclidean distance and sort closest
    distances = []
    for i, c in enumerate(training_set):
        distances.append((math.sqrt((c[0] - point[0])**2 + (c[0] - point[1])**2), i))
    distances.sort()

    # Get the top closest points
    top_knn = []
    num = 1
    for distance in distances:
        top_knn.append(distance)
        num += 1
        if num > k:
            break

    # Count most labels in top_knn
    label_count = {}
    for _, i in top_knn:
        if labels[i] in label_count:
            label_count[labels[i]] += 1
        else:
            label_count[labels[i]] = 1

    # Return classification with most matches
    _, label = max([(c, l) for (l, c) in label_count.iteritems()])
    return label


def main():
    group, labels = createDataSet()
    print classify([0, 0], group, labels, 2)


if __name__ == '__main__':
    main()
{% endhighlight %}

The toy example only covers the first section of chapter 2. The latter chapters
cover more complicated examples, such as handwritten digit recognition and
dating site classification.

I plan to write about those sections as I get to them. The hope is that writing
will help me learn better and keep me motivated.


