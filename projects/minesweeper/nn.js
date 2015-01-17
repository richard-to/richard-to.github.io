// Porting tutorial code from http://www.ai-junkie.com/ann/evolved/nnt1.html
// Unfortunately I'm on a Mac and the code is developed for Windows machines.
// So just gonna do this in Javascript for simplicity.
(function(window, undefined) {

    var Neuron = function(numInputs) {
        this.weights = [];
        for (var i = 0; i < numInputs; i++) {
            // Create random weight between -1 and 1
            this.weights.push(Math.random() - Math.random());
        }
    };

    var NeuronLayer = function(numNeurons, numInputs) {
        this.neurons = [];
        for (var i = 0; i < numNeurons; i++) {
            this.neurons.push(new Neuron(numInputs));
        }
    };

    var NeuralNet = function() {
        // @TODO(richard-to): Also need to handle case where there are no hidden layers, which means linear regression?
        this.numInputs = Params.numInputs;
        this.numOutputs = Params.numOutputs;
        this.numHiddenLayers = Params.numHidden;
        this.neuronsPerHiddenLayer = Params.neuronsPerHiddenLayer;
        // Not really sure how to deal with bias? Why -1 for default?
        this.bias = Params.bias;
        // Why 1 again?
        this.activationResponse = Params.activationResponse;

        this.layers = [];

        this.createNet();
    };

    NeuralNet.prototype.createNet = function() {
        if (this.numHiddenLayers > 0) {
            this.layers.push(new NeuronLayer(this.neuronsPerHiddenLayer, this.numInputs));
            for (var i = 0; i < this.numHiddenLayers - 1; i++) {
                this.layers.push(new NeuronLayer(
                    this.neuronsPerHiddenLayer, this.neuronsPerHiddenLayer));
            }
            this.layers.push(
                new NeuronLayer(this.numInputs, this.neuronsPerHiddenLayer));
        } else {
            this.layers.push(new NeuronLayer(this.numOutputs, this.numInputs));
        }
    };

    // Looks like purpose for this method is
    // to get all the weights in a vector use in genetic algorithm?
    NeuralNet.prototype.getWeights = function() {
        var weights = [];
        for (var i = 0; i < this.layers.length; i++) {
            for (var j = 0; j < this.layers[i].neurons.length; j++) {
                for (var h = 0; h < this.layers[i].neurons[j].weights.length; h++) {
                    weight.push(this.layers[i].neurons[j].weights[h]);
                }
            }
        }
        return weights;
    };

    NeuralNet.prototype.putWeights = function(weights) {
        for (var i = 0; i < this.layers.length; i++) {
            for (var j = 0; j < this.layers[i].neurons.length; j++) {
                for (var h = 0; h < this.layers[i].neurons[j].weights.length; h++) {
                    this.layers[i].neurons[j].weights[h] = weights[h];
                }
            }
        }
    };

    NeuralNet.prototype.getNumWeights = function() {
        var count = 0;
        for (var i = 0; i < this.layers.length; i++) {
            for (var j = 0; j < this.layers[i].neurons.length; j++) {
                count += this.layers[i].neurons[j].weights.length;
            }
        }
        return count;
    };

    // Looks like this is the important function that runs the neural network and gets our outputs
    NeuralNet.prototype.update = function(inputs) {

        // This array keeps track of outputs after each layer
        var outputs = [];
        if (inputs.length != this.numInputs) {
            return outputs;
        }

        for (var i = 0; i < this.numHiddenLayers; i++) {
            // After the first layer, the inputs get set to the output
            // of previous layer
            if (i > 0) {
                inputs = outputs.slice(0);
            }

            for (var j = 0; j < this.layers[i].neurons.length; j++) {
                // Correct term for this? Or is the result after going through Sigmoid?
                var activation = 0;
                for (var h = 0; h < this.layers[i].neurons[j].weights.length; h++) {
                    // sum += wN * iN
                    activation += this.layers[i].neurons[j].weights[h] * inputs[h];
                }
                activation += this.layers[i].neurons[j].weights[this.layers[i].neurons[j].weights.length - 1] * this.bias;
                outputs.push(this.sigmoid(activation, this.activationResponse));
            }
        }
        return outputs;
    };

    // Sigmoid!!!
    NeuralNet.prototype.sigmoid = function(netinput, response) {
        return (1 / (1 + Math.exp(-netinput / response)));
    };

    window.NeuralNet = NeuralNet;
}(window));
