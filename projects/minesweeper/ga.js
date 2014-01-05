// Porting tutorial code from http://www.ai-junkie.com/ann/evolved/nnt1.html
// Unfortunately I'm on a Mac and the code is developed for Windows machines.
// So just gonna do this in Javascript for simplicity.
(function(window, undefined) {

    var Genome = function(weights, fitness) {
        // An array of weights
        this.weights = weights;

        this.fitness = fitness;
    };

    var GA = function(popSize, mutationRate, crossoverRate, numWeights) {

        // Holds entire population of chromosomes
        this.pop = [];

        // Size of population
        this.popSize = popSize;

        // Weights per chromosome
        this.numWeights = numWeights;

        // Rate of mutation
        this.mutationRate = mutationRate;

        // Rate of crossover
        this.crossoverRate = crossoverRate;

        // Total fitness of all chromosomes
        this.totalFitness = 0;

        // Best fitness
        this.bestFitness = 0;

        // Avg fitness of all chromosomes
        this.avgFitness = 0;

        // Default worst fitness to a big negative number
        this.worstFitness = 9999999;

        // Fittest chromsome/genome
        this.fittestGenome = 0;

        // Current generation
        this.generation = 0;

        // Generate a population of of chromosomes with random weights
        // Also set fitnesses to 0
        for (var i = 0; i < this.popSize; i++) {
            var weights = [];
            for (var j = 0; j < this.numWeights; j++) {
                weights.push(Math.random() - Math.random());
            }
            this.pop.push(new Genome(weights, 0));
        }
    };

    // Parent1, parent2, baby1, and baby2 are all genomes
    // Looks like implementation of single point crossover
    GA.prototype.crossover = function(parent1, parent2, baby1, baby2) {
        // If our random number exceeds cross over rate, then
        // then no cross over is performed.
        if (Math.random() > this.crossoverRate) {
            for (var i = 0; i < parent1.weights.length; i++) {
                baby1.weights[i] = parent1.weights[i];
                baby2.weights[i] = parent2.weights[i];
            }
            baby1.fitness = parent1.fitness;
            baby2.fitness = parent2.fitness;
        } else {
            // Pick a crossover point.
            var cp = Math.floor((Math.random() * (this.numWeights - 1)));

            // Swap weights
            for (var i = 0; i < cp; i++) {
                baby1.weights[i] = parent1.weights[i];
                baby2.weights[i] = parent2.weights[i];
            }

            for (var i = cp; i < parent1.weights.length; i++) {
                baby1.weights[i] = parent1.weights[i];
                baby2.weights[i] = parent2.weights[i];
            }
        }
        baby1.fitness = parent1.fitness;
        baby2.fitness = parent2.fitness;
    };

    // Mutation function
    // Chromo is genome in this code? Probably?
    // Where does the .3 come from again? dmaxPerturbation. I guess
    // that means th range in which the weights change +0.3 or -0.3
    GA.prototype.mutate = function(chromo) {
        for (var i = 0; i < chromo.weights.length; i++) {
            if (Math.random() < this.mutationRate) {
                chromo.weights[i] += (Math.random() - Math.random()) * Params.maxPerturbation;
            }
        }
    };

    // Maybe switch this out with Tournament selection?
    GA.prototype.getChromoRoulette = function() {
        // Why total fitness of all genomes?
        // Oh yeah, we need to select from all genomes and not
        // individuals.
        var slice = Math.random() * this.totalFitness;

        var chosenGenome = null;
        var currentFitness = 0;
        // Keep adding fitness until it is above the slice,
        // then we stop and take the current genome.
        for (var i = 0; i < this.popSize; i++) {
            currentFitness += this.pop[i].fitness;
            if (currentFitness >= slice) {
                chosenGenome = this.pop[i];
                break;
            }
        }
        return chosenGenome;
    };


    // Pretty interesting survival function here.
    // Basically we want to get the N best genomes and then
    // Copy them M times.
    GA.prototype.grabNBest = function(nBest, numCopies) {
        var pop = [];
        while (nBest--) {
            for (var i = 0; i < numCopies; i++) {
                pop.push(this.pop[(this.popSize - 1) - nBest]);
            }
        }
        return pop;
    };

    GA.prototype.calculateBestWorstAvTot = function() {
        this.totalFitness = 0;
        bestFitness = 0;
        lowestFitness = 9999999;
        for (var i = 0; i < this.popSize; i++) {
            if (this.pop[i].fitness > bestFitness) {
                bestFitness = this.pop[i].fitness;
                this.bestFitness = bestFitness;
                this.fittestGenome = this.pop[i];
            }

            if (this.pop[i].fitness < lowestFitness) {
                lowestFitness = this.pop[i].fitness;
                this.lowestFitness = lowestFitness;
            }
            this.totalFitness += this.pop[i].fitness;
        }

        this.avgFitness = this.totalFitness/this.popSize;
    };

    GA.prototype.reset = function() {
        this.totalFitness = 0;
        this.bestFitness = 0;
        this.worstFitness = 9999999;
        this.avgFitness = 0;
    };

    GA.prototype.epoch = function(oldPop) {
        this.pop = oldPop;
        this.reset();

        // Sort best to worst fitness?
        this.pop.sort(function(a, b) {
            if (a.fitness > b.fitness) {
                return 1;
            } else if (a.fitness < b.fitness) {
                return -1;
            } else {
                return 0;
            }
        });

        // Calculate fitness values
        this.calculateBestWorstAvTot();

        // Add some elistism here? Interesting.
        // Need even number for population or roulette wheel crashes
        // TODO(richard-to): Remvoe these hardcoded parameters
        // Essentially new pop starts off with the best 4 genomes here
        // After that the rest are filled in trhough crossover, mutation
        var newPop = this.grabNBest(Params.numElite, Params.numCopiesElite);

        while (newPop.length < this.popSize) {
            var parent1 = this.getChromoRoulette();
            var parent2 = this.getChromoRoulette();
            var baby1 = new Genome(new Array(this.numWeights), 0);
            var baby2 = new Genome(new Array(this.numWeights), 0);
            this.crossover(parent1, parent2, baby1, baby2);
            this.mutate(baby1);
            this.mutate(baby2);
            newPop.push(baby1);
            newPop.push(baby2);
        }

        // replace old pop with new pop
        this.pop = newPop;
        return this.pop;
    };

    GA.prototype.getChromos = function() {
        return this.pop;
    };

    GA.prototype.getAvgFitness = function() {
        return this.avgFitness;
    };

    GA.prototype.getBestFitness = function() {
        return this.bestFitness;
    };
    window.GA = GA;
}(window));