---
layout: post
title: "Fast.AI - Digit Classifier - Part 1: Two digits"
---

Chapter 4 of the "Practical Deep Learning for Coders" course walks through how to code up a neural network without the fast.ai framework. The example they use is a digit classifier for the digits 3 and 7 using the classic MNIST dataset (https://en.wikipedia.org/wiki/MNIST_database). The full classifier is left as an exercise for the reader.

## Data wrangling

A good portion of the example code walks the reader through how to convert image data to tensors so that the data can processed on the GPU. With the digit data, it's pretty straightforward, since they're all 28x28 pixel grayscale images. That means each pixel can have a value between 0 and 255.

### Loading data

The fast.ai framework provides some some tools to work with datasets, such as reading directories and files. They also provide some helpers to download research datasets such as the MNIST one. This dataset contains two top level folders, training and testing. It does not include a validation set, so we'll have  to write code to split up the training data.

```python
path = untar_data(URLs.MNIST)
Path.BASE_PATH = path
path.ls()

# [Path('training'),Path('testing')]
```

Instead of 3 and 7, I decided to use 4 and 8, just to change it up. The MNIST dataset contains the digits 0-9, so we'll need to separate out the digits we want.

```python
fours = (path/"training"/"4").ls().sorted()
eights = (path/"training"/"8").ls().sorted()

# [Path('training/8/10001.png'),Path('training/8/10012.png'),Path('training/8/10021.png'),...]
```

Next we have to load the images and convert them to tensors. Tensors are very similar to numpy arrays, except they're designed to be run on the GPU, to provide better performance.

```python
four_tensors = [tensor(Image.open(f)) for f in fours]
eight_tensors = [tensor(Image.open(f)) for f in eights]
four_tensors[0].shape

# torch.Size([28, 28])
```

### Formatting the data

Loading the image data into tensors isn't enough. We have to format the data so it can be used in our neural network.

Right now our tensors are in a python list, so we need to take the list of tensors and stack them together into a rank-3 tensor, where the first axis is the number of examples, the second and third axes are the image height and width respectively.

The other thing we need to do is turn the 0-255 scale to a 0-1 scale, which I believe helps with computation performance. In addition some PyTorch functions require the use of floats instead of integers.

```python
stacked_fours = torch.stack(four_tensors).float()/255
stacked_eights = torch.stack(eight_tensors).float()/255
len(stacked_fours.shape), stacked_fours.shape

# (3, torch.Size([5842, 28, 28]))
```

The next step is to combine the fours and eights into one tensor that will be used as our training and validation dataset. We also turn our rank-3 tensor into a rank-2 tensor by converting the 28x28 2d-array into 784 1d-array. The interesting thing here is we use the `view` method, which keeps the underlying structure of our rank-3 tensor. In some ways it's reminiscent of a database view.

With our examples formatted, we also need to create a tensor with our corresponding labels. Here we use `0` for fours and `1` for eights. The `unsqueeze` method seems to transpose a tensor with shape `[1, 11693]` to a shape of `[11693, 1]`

```python
digits_x = torch.cat([stacked_fours, stacked_eights]).view(-1, 28*28)
digits_y = tensor([0]*len(fours) + [1] *len(eights)).unsqueeze(1)
dataset = list(zip(digits_x, digits_y))

digits_x.shape, digits_y.shape

# (torch.Size([11693, 784]), torch.Size([11693, 1]))
```

To split up the data into training and validation sets, I used the PyTorch `SubsetRandomSampler` in combination with the`DataLoader` class. Here, I shuffle the indices of the dataset, then split 20% of the shuffled indices to be used for the validation set. This way we keep the original dataset, but are able to pick out specific indices from the training/validation sets.

```python
batch_size = 256
valid_split = 0.2
split_index = int(len(digits_x) * 0.2)
shuffled_indices = torch.randperm(len(digits_x))
train_indices, valid_indices = shuffled_indices[split_index:], shuffled_indices[:split_index]

train_sampler = SubsetRandomSampler(train_indices)
valid_sampler = SubsetRandomSampler(valid_indices)

train_dataset = DataLoader(dataset, batch_size=batch_size, sampler=train_sampler)
valid_dataset = DataLoader(dataset, batch_size=batch_size, sampler=valid_sampler)
```

## The linear model

Now that we have a dataset created, we can write the code to create a model for our two digit classifier. Basically we want to find a function that can determine if a digit is a four or an eight. The book starts with a simple linear model, something akin to `y = mx + b` except with 784 weights/parameters (e.g. `m` here) that need to be found. Technically it is 785 since we need to include a bias to avoid issues with 0, which I don't fully understand yet. But seems to have to do with the fact that multiplying a number by 0 is always 0, so that's not too helpful.
The basic process for finding the right parameters looks like this:

- **Init** Initialize the weights to random values as a starting point
- **Predict** Use the function with the random weights against our training set to get some predictions
- **Loss** Compare these predictions against the actual training data to calculate the loss (different than accuracy)
- **Gradient** Calculate the gradient based on the loss function
- **Step** Use the gradient and learning rate to adjust the weights
- **Repeat** Go back to the predict step to test the performance of the function with the new weights

### Initialize params

The first step is to initialize the weights/parameters to some random values. This part is pretty straight forward.

```python
def init_params(size, std=1.0):
    # requires_grad_() signals that for each parameter we need to calculate a gradient with respect to the value associated with the parameter
    return (torch.randn(size)*std).requires_grad_()

weights = init_params((28*28, 1))
bias = init_params(1)
```

### Predict

Once we have our weights, we can apply the weights to the values of each training example. This can be done using matrix multiplication, so we don't have to use a loop, which would be slow.

One thing that confuses me is that matrix multiplication doesn't seem like it should work given a 200x728 matrix and a 1x728 matrix. But for some reason with the tensors, the calculation does appear to work. Granted it does seem like rank-2 tensors aren't exactly the same as matrices.

```python
def linear_model(xb):
    # The `@` operator is for matrix multiplication in python 3
    return xb @ weights + bias

preds = linear_model(train_x)
```

### Loss function

The loss function is used to represent how good the model is (lower number means the predictions are more accurate). The book says that accuracy can't be used since the gradient will usually be 0, which means we can't learn from that. One key point is that the loss function does not work with the image data itself, but with the predictions. The loss function measures the difference between the prediction and the actual result. Here in this case it will be 0 for 4 and 1 for 8. The loss will be between 0 and 1. The book suggests using a sigmoid function to map the predictions between 0 and 1. The good thing about the sigmoid function is that it is always increasing (in other words there are no ups and downs). Also the line is fairly smooth and predictable in its movement.

```python
def mnist_loss(predictions, targets):
    predictions = predictions.sigmoid()
    return torch.where(targets==1, 1-predictions, predictions).mean()

loss = mnist_loss(preds, train_y)
```

### Stochastic Gradient Descent

We use stochastic gradient descent (SGD) to help adjust the parameters of our model. The key to remember is that we want to decrease the loss. SGD is performed to figure out how to adjust the parameters of our model so that the loss will decrease, thereby leading to a more accurate model. The intuition with SGD is that a derivative can calculate the change of a value. So if we're able to calculate the change, then we have an idea of how to adjust the parameters in order to minimize the loss. Basically if the slope is large, that means we need to make a bigger adjustment than a smaller slope.

With SGD we need to calculate the derivative with respect to each weight (all other weights are treated as constants). This is done for with the call to `loss.backward()`, which does something called backpropagation, which basically means calculating the derivatives of each layer.

Another important thing to note is that the gradient is calculated from the loss function. Here the gradient is calculated from the derivative of the sigmoid function and not the linear function that we are training.

```python
def calc_grad(xb, yb, model):
    preds = model(xb)
    loss = mnist_loss(preds, yb)
    loss.backward()
```

### Step

As mentioned in the previous section, the gradients we calculated for each parameter don't tell us exactly how to adjust the parameters. We use a value called a "learning rate" and multiply that by the gradients and subtract that from the current value of each parameter. The learning rate is sort of an adhoc value. They suggest a number between 0.001 and 0.1 with the hope that the value does not cause jumps that are too small or too large. Though in the next chapter they show an approach to figure out a a good learning rate, so that it's less adhoc.

```python
def train_epoch(model, lr, params):
    for xb, yb in dl:
        calc_grad(xb, yb, model)  # Calculate gradient for model
        for p in params:
            p.data -= p.grad * lr  # update weights
            p.grad.zero_()
```

### Validating the epoch

Once we've trained our model for an epoch, we can test it against the validation set to give us a more human-readable way to judge the performance of our model. In this case we check if the predictions match the expected label and calculate a percentage based on how many labels we predicted correctly.

```python
def batch_accuracy(xb, yb):
    preds = xb.sigmoid()
    correct = (preds > 0.5) == yb
    return correct.float().mean()

def validate_epoch(model):
    accs = [batch_accuracy(model(xb), yb) for xb, yb in valid_dataset]
    return round(torch.stack(accs).mean().item(), 4)

validate_epoch(linear_model)
```

### Adding more layers

The example above shows a basic linear model. The book goes on to show how we could add another layer to our model. I'll go into some detail about that in the next post.
