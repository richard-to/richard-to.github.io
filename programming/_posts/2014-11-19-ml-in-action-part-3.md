---
layout: post
title: "ML in Action - Part 3: Decision trees"
mathjax: true
---

Like kNN, decision trees are very intuitive. The book uses 20 questions as an analogy. Decisions are also easy to visualize, so that we can double check the decision by following the tree. There is a whole section on how to plot trees using Matplotlib that I skipped. The book uses the well-known contact lens data set to illustrate the decision tree in action. Again, I would have liked to see a more interesting data set to get a better idea of when a decision tree would be a good choice. The actual algorithm used is ID3, which doesn't do pruning, so there can be issues with overfitting. In terms of implementation, this proved more difficult than kNN. Part of this was due to the weak explanation of entropy and information gain.

On that note, Udacity recently released an Intro to Machine Learning course that does a very good job of explaining decision trees. The videos on entropy and information gain are clearer than explanations from various sections of books that I've read on the algorithm. Udacity does a good job of focusing on intuition. There's not much theory, math, or even implementation, which is fine for an introductory course. Scikit Learn is used for the hands-on exercises. This is nice as well since these skills can immediately be applied to a real world situation. Scikit Learn has an especially nice API design. Applying basic algorithms is essentially the same three lines.

**Decision trees with Scikit Learn**
{% highlight python %}
from sklearn.tree import DecisionTreeClassifier
clf = DecisionTreeClassifier()
clf.fit(features_train, labels_train)
pred = clf.predict(features_test)
{% endhighlight %}

**Naive Bayes with Scikit Learn**
{% highlight python %}
from sklearn.naive_bayes import GaussianNB
clf = GaussianNB()
clf.fit(features_train, labels_train)
pred = clf.predict(features_test)
{% endhighlight %}

**Support Vector Classification with Scikit Learn**
{% highlight python %}
from sklearn.svm import SVC
clf = SVC()
clf.fit(features_train, labels_train)
pred = clf.predict(features_test)
{% endhighlight %}

With that said the hard part is the data wrangling and feature set development. Also experimenting with and learning about the multitude of parameters for each algorithm is kind of daunting.

Overall, Udacity's Intro to Machine Learning course is well done so far, if a bit too easy as is generally the case for their courses. The mini projects don't require much effort at all, but they do highlight important nuances about the algorithms.

Back to Machine Learning in Action. I like that dead-simple examples are used when walking through the initial implementation of the algorithms. Decision trees are no different. The example given is a data set that determines whether an animal is a fish or not based on two features: 'Can survive without coming to surface?' and 'Has flippers'.

<table>
    <tr>
        <th>Can survive without coming to surface?</th>
        <th>Has flippers?</th>
        <th>Fish?</th>
    </tr>
    <tr>
        <td>Yes</td>
        <td>Yes</td>
        <td>Yes</td>
    </tr>
    <tr>
        <td>Yes</td>
        <td>Yes</td>
        <td>Yes</td>
    </tr>
    <tr>
        <td>Yes</td>
        <td>No</td>
        <td>No</td>
    </tr>
    <tr>
        <td>No</td>
        <td>Yes</td>
        <td>No</td>
    </tr>
    <tr>
        <td>No</td>
        <td>No</td>
        <td>No</td>
    </tr>
</table>

The hard part with decision trees is understanding entropy and information gain. I think most people get the idea of how a decision tree works when the tree diagram is shown and you can follow the steps that the algorithm makes.

Entropy and information gain are important because they decide on the optimal split for a tree. In general, a shallow tree is better than a deep tree.

Entropy can be described as the purity of the data. So pure data would have the same classification for all examples. If we had an even split of labels, then the data would be impure.

**Entropy equation**

$$H = -\sum^n\_{i=1} p(x\_i) * \log\_2p(x\_i)$$

In this equation `p` stands for the probability of `xi`, where `xi` is a distinct label in the training set.

In the example data set, there are two classifications, fish or not fish.

First, what is the probability that one of the examples is a fish? Answer is `2/5`.

Second, what is the probability that one of the examples is not a fish? Answer is `3/5`.

Now we have enough to calculate the entropy of the entire data set and can just plug the numbers into the equation:

$$-(2/5) * \log\_2(2/5) + -(3/5) * \log\_2(3/5) = 0.971$$

**Deciding on what feature to split on**

The decision to split on a particular feature is based on information gain. We want to split on the feature that provides the most information gain.

Continuing with the fish data set, we can visualize the information gain as follows:


**Feature 1: Can survive without coming to surface?**

There are two options, Yes/No, for this feature. This means we will have two branches.

Branch 1 (Yes):
<table>
    <tr>
        <th>Can survive without coming to surface?</th>
        <th>Fish?</th>
    </tr>
    <tr>
        <td>Yes</td>
        <td>Yes</td>
    </tr>
    <tr>
        <td>Yes</td>
        <td>Yes</td>
    </tr>
    <tr>
        <td>Yes</td>
        <td>No</td>
    </tr>
    <tr>
</table>

Branch 2 (No):
<table>
    <tr>
        <th>Can survive without coming to surface?</th>
        <th>Fish?</th>
    </tr>
        <td>No</td>
        <td>No</td>
    </tr>
    <tr>
        <td>No</td>
        <td>No</td>
    </tr>
</table>

What is the information gain of this feature?

The first step is to calculate the entropy of branch 1:

- How many total examples are dealing with (both branches)? Answer is 5.
- How many examples are in branch 1? Answer is 3.
- What is the fraction of examples for branch 1. Answer is 3/5.
- How many examples are classified as Yes? Answer is 2.
- How many example are classified as No? Answer is 1.
- What is the entropy of branch 1?
    - $$-(2/3) * \log\_2(2/3) + -(1/3) * \log\_2(1/3) = 0.9183$$

Next calculate the entropy of branch 2:

- How many examples are in branch 2? Answer is 2.
- What is the fraction of examples for branch 2. Answer is 2/5.
- How many examples are classified as Yes? Answer is 0.
- How many example are classified as No? Answer is 2.
- What is the entropy of branch 2?
    - $$-(2/2) * \log\_2(2/2) + -(0) * \log\_2(0/0) = 0$$

Now we have enough to calculate the information gain. We need to do 2 things.

1. We need to subtract the previous entropy (in this case: 0.971)
2. We need to weight the entropy of each branch.
  - For branch 1, that weight is 3/5. This is basically calculated as number of example for this branch divided by the total number of examples in all branches.
  - For branch 2, that weight is 2/5

So the information gain for this feature is calculated as follows:

$$0.971 - (\frac{3}{5} * 0.9183 + \frac{2}{5} * 0) = 0.0527$$

The information gain for the second feature "Has flippers?" can be calculated in the same way. Unfortunately it's not the best example, since the information gain is identical.

**Implementing decision trees with python**

I have avoided reading the author's implementations and have tried to implement the algorithms based on the high-level pseudocode and description of how the algorithm works. I've tried to follow the same interface, so if I do get lost, I can refer to the author's implementation.

The first method calculates the entropy of the data set:

{% highlight python %}
def calcShannonEntropy(dataSet):
    """
    Calculates Shannon entropy of classifications in data

    Args:
        dataSet: Data set

    Return:
        Entropy of data set
    """
    total = float(len(dataSet))
    labels = {}
    for data in dataSet:
        if data[-1] not in labels:
            labels[data[-1]] = 0.0
        labels[data[-1]] += 1
    entropy = 0
    for count in labels.values():
        entropy -= (count/total) * math.log(count/total, 2)
    return entropy
{% endhighlight %}


Next there needs to be a method to split a data set into a subset for branching down the tree.

{% highlight python %}
def splitDataSet(dataSet, axis, value):
    """
    Splits data set on a given column containing a specified value.

    Returns the data set minus the specified column.

    Args:
        dataSet: Data set
        axis: Column of value to split on
        value: Value to split on

    Returns:
        Data set split by value and minus the specified column.
    """
    subSet = []
    for data in dataSet:
        if data[axis] == value:
            subSet.append(data[:axis] + data[axis + 1:])
    return subSet
{% endhighlight %}

Our last helper method is the most important as it calculates the information gain and picks the best feature to split on.

{% highlight python %}
def chooseBestFeatureToSplit(dataSet):
    """
    Split on the feature with the largest information gain.

    Args:
        dataSet: Data set

    Returns:
        Column index of best feature
    """
    total = float(len(dataSet))
    features = [{} for i in xrange(len(dataSet[0][:-1]))]
    baseGain = calcShannonEntropy(dataSet)
    infoGain = [0] * len(features)

    for data in dataSet:
        result = data[-1]
        for i, feature in enumerate(data[:-1]):
            if feature not in features[i]:
                features[i][feature] = []
            features[i][feature].append((feature, result))

    for i, feature in enumerate(features):
        entropy = 0
        for branch in feature.values():
            entropy += len(branch) / total * calcShannonEntropy(branch)
        infoGain[i] = baseGain - entropy

    maxGain = max(infoGain)
    return infoGain.index(maxGain)
{% endhighlight %}

The key method is `createTree` which builds the tree recursively. The stopping conditions are when the leaf node  contains examples with a uniform classification or if there are no more features to split on. In the latter case, the most frequent classification is chosen.

{% highlight python %}
def createTree(dataSet, labels):
    """
    Creates decision tree using ID3 algorithm

    Args:
        dataSet: Data set
        labels: Labels of features/columns

    Returns:
        Decision tree to use for classification
    """
    classifications = [example[-1] for example in dataSet]

    if all(classifications[0] == classification for classification in classifications):
        return classifications[0]

    if len(dataSet[0]) == 1:
        return max(set(classifications), key=classifications.count)

    bestFeature = chooseBestFeatureToSplit(dataSet)
    tree = {labels[bestFeature]: {}}
    for value in set([example[bestFeature] for example in dataSet]):
        subset = splitDataSet(dataSet, bestFeature, value)
        tree[labels[bestFeature]][value] = createTree(
            subset, labels[:bestFeature] + labels[bestFeature + 1:])
    return tree
{% endhighlight %}

Once the tree is created, we can create a simple method to classify data. This method recursively calls itself until it reaches a leaf node.

{% highlight python %}
def classify(inputData, tree, labels):
    """
    Classify given data using decision tree

    Args:
        inputData: Input data to classify
        tree: Decision tree
        labels: Labels for features/columns
    """
    if not isinstance(tree, dict):
        return tree
    label = tree.keys()[0]
    labelIndex = labels.index(label)
    return classify(inputData, tree[label][inputData[labelIndex]], labels)
{% endhighlight %}

Here is the full decision tree implementation:

{% highlight python linenos %}

import math


def loadDataSet(filepath):
    """
    Loads data set as a list of lists

    Args:
        filepath: Path to data file in TSV format

    Returns:
        Data set as list of lists
    """
    with open(filepath, 'r') as infile:
        return [line.strip().split('\t') for line in infile]


def calcShannonEntropy(dataSet):
    """
    Calculates Shannon entropy of classifications in data

    Args:
        dataSet: Data set

    Return:
        Entropy of data set
    """
    total = float(len(dataSet))
    labels = {}
    for data in dataSet:
        if data[-1] not in labels:
            labels[data[-1]] = 0.0
        labels[data[-1]] += 1
    entropy = 0
    for count in labels.values():
        entropy -= (count/total) * math.log(count/total, 2)
    return entropy


def splitDataSet(dataSet, axis, value):
    """
    Splits data set on a given column containing a specified value.

    Returns the data set minus the specified column.

    Args:
        dataSet: Data set
        axis: Column of value to split on
        value: Value to split on

    Returns:
        Data set split by value and minus the specified column.
    """
    subSet = []
    for data in dataSet:
        if data[axis] == value:
            subSet.append(data[:axis] + data[axis + 1:])
    return subSet


def chooseBestFeatureToSplit(dataSet):
    """
    Split on the feature with the largest information gain.

    Args:
        dataSet: Data set

    Returns:
        Column index of best feature
    """
    total = float(len(dataSet))
    features = [{} for i in xrange(len(dataSet[0][:-1]))]
    baseGain = calcShannonEntropy(dataSet)
    infoGain = [0] * len(features)

    for data in dataSet:
        result = data[-1]
        for i, feature in enumerate(data[:-1]):
            if feature not in features[i]:
                features[i][feature] = []
            features[i][feature].append((feature, result))

    for i, feature in enumerate(features):
        entropy = 0
        for branch in feature.values():
            entropy += len(branch) / total * calcShannonEntropy(branch)
        infoGain[i] = baseGain - entropy

    maxGain = max(infoGain)
    return infoGain.index(maxGain)


def createTree(dataSet, labels):
    """
    Creates decision tree using ID3 algorithm

    Args:
        dataSet: Data set
        labels: Labels of features/columns

    Returns:
        Decision tree to use for classification
    """
    classifications = [example[-1] for example in dataSet]

    if all(classifications[0] == classification for classification in classifications):
        return classifications[0]

    if len(dataSet[0]) == 1:
        return max(set(classifications), key=classifications.count)

    bestFeature = chooseBestFeatureToSplit(dataSet)
    tree = {labels[bestFeature]: {}}
    for value in set([example[bestFeature] for example in dataSet]):
        subset = splitDataSet(dataSet, bestFeature, value)
        tree[labels[bestFeature]][value] = createTree(
            subset, labels[:bestFeature] + labels[bestFeature + 1:])
    return tree


def classify(inputData, tree, labels):
    """
    Classify given data using decision tree

    Args:
        inputData: Input data to classify
        tree: Decision tree
        labels: Labels for features/columns
    """
    if not isinstance(tree, dict):
        return tree
    label = tree.keys()[0]
    labelIndex = labels.index(label)
    return classify(inputData, tree[label][inputData[labelIndex]], labels)


def main():
    filepath = '../sample/Ch03/lenses.txt'
    labels = ['age', 'prescription', 'astigmatic', 'tearRate']
    dataSet = loadDataSet(filepath)
    tree = createTree(dataSet, labels)
    print tree


if __name__ == '__main__':
    main()

{% endhighlight %}