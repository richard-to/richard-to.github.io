(function(window, undefined) {

    var Tetris = window.Tetris;

    // Main namespace for Tetris Genetic Algorithm.
    var TetrisGA = {};

    var Constraints = {
        WIDTH: 10,
        HEIGHT: 22,
        ROTATION: 4,
        STACK_BONUS: 4
    };
    TetrisGA.Constraints = Constraints;

    // A view object that does nothing. It is not necessary
    // to show the canvas when running the simulation.
    var NullView = function() {};

    // Override the paint method to do nothing.
    // The settings object here refers to the settings in Tetris
    // module.
    NullView.prototype.paint = function(board, settings) {};
    TetrisGA.NullView = NullView;

    // Pass in a known sequence of shapes for testing GA.
    var MockGenerator = function(shapeSequence) {
        this.bag = shapeSequence;
    };

    // Override nextShape method to only shift off
    // available shapes. Once no shapes exist return
    // a null shape.
    MockGenerator.prototype.nextShape = function() {
        var shape = this.bag.shift();
        if (shape == null) {
            throw new Error();
        }
        return shape;
    };
    TetrisGA.MockGenerator = MockGenerator;

    // Clones genotype
    var cloneGenotype = function(genotype) {
        return {
            xPos: genotype.xPos.slice(),
            rotation: genotype.rotation.slice(),
            fitness: genotype.fitness
        };
    };
    TetrisGA.cloneGenotype = cloneGenotype;

    var randXPos = function() {
        return _.random(Constraints.WIDTH - 1);
    };
    TetrisGA.randXPos = randXPos;

    var randRotation = function() {
        return _.random(Constraints.ROTATION - 1);
    };
    TetrisGA.randRotation = randRotation;

    var Control = Tetris.Control;

    // Class that converts a genotype to a sequence of
    // playable moves.
    //
    // Additionally there is a cache to avoid redundant
    // calculations.
    var GenotypeToMoveConverter = function() {
        var cache = {};

        // Gets rotated version of shape
        this.getRotatedShape = function(shape, rotation) {
            var shapeIndex = rotation % shape.shape.length;
            return shape.shape[shapeIndex];
        };

        // Converts rotation allele to rotation key sequence
        this.convertRotation = function(moves, rotation) {
            if (rotation === 1) {
                moves.push(Control.ROTATE_RIGHT);
            } else if (rotation === 2) {
                moves.push(Control.ROTATE_RIGHT);
                moves.push(Control.ROTATE_RIGHT);
            } else if (rotation === 3) {
                moves.push(Control.ROTATE_LEFT);
            }
            return moves;
        };

        // Find the left index of tetromino in shape matrix
        this.findLeftPos = function(shape) {
            var width = shape[0].length;
            var height = shape.length;
            for (var x = 0; x < width; x++) {
                for (var y = 0; y < height; y++) {
                    if (shape[y][x] > 0) {
                        return x;
                    }
                }
            }
            throw new Error();
        };

        // Find the right index of tetromino in shape matrix
        this.findRightPos = function(shape) {
            var xStart = shape[0].length - 1;
            var height = shape.length;
            for (var x = xStart; x > 0; --x) {
                for (var y = 0; y < height; ++y) {
                    if (shape[y][x] > 0) {
                        return x;
                    }
                }
            }
            throw new Error();
        };

        //Calculate moves to get to specified x pos.
        this.convertXPos = function(moves, shape, xStart, xPos) {
            var dim = {
                left: this.findLeftPos(shape),
                right: this.findRightPos(shape)
            };

            var startX = xStart + dim.left;

            if (xPos < startX) {
                var curX = startX;
                while (curX > xPos) {
                    moves.push(Control.LEFT);
                    curX--;
                }
            } else if (xPos > startX) {
                var distStartX = xPos - startX;
                var distEndX = xPos + dim.right - dim.left;
                if (distEndX >= Constraints.WIDTH) {
                    distStartX -= (distEndX - Constraints.WIDTH + 1);
                }
                var distCur = 0;
                while (distCur < distStartX) {
                    moves.push(Control.RIGHT);
                    distCur++;
                }
            }
            return moves;
        };

        // Converts genotype to sequence of moves.
        this.convert = function(genotype, shapes) {
            var moves = [];

            var rotation = genotype.rotation;
            var xPos = genotype.xPos;
            var length = shapes.length;

            var self = this;
            _(length).times(function(i) {
                moves = self.convertRotation(moves, rotation[i]);
                var shape = self.getRotatedShape(shapes[i], rotation[i]);
                moves = self.convertXPos(moves, shape, shapes[i].start.x, xPos[i]);
                moves.push(Control.HARDDROP);
            });
            return moves;
        };
    }
    TetrisGA.GenotypeToMoveConverter = GenotypeToMoveConverter;

    // Initializes random sequence of shapes
    var initializeShapes = function(tetrominoCount, generator) {
        var shapes = [];
        _(tetrominoCount).times(function(n){
            shapes.push(generator.nextShape());
        });
        return shapes;
    };
    TetrisGA.initializeShapes = initializeShapes;

    // Function that initializes a gene pool that represents
    // possible move sequences for each Tetromino.
    var initializeGenePool = function(populationSize, tetrominoCount) {
        var genePool = [];
        _(populationSize).times(function(n){
            var sequence = {
                xPos: [],
                rotation: []
            };
            _(tetrominoCount).times(function(n){
                sequence.xPos.push(randXPos());
                sequence.rotation.push(randRotation());
            });
            genePool.push(sequence);
        });
        return genePool;
    };
    TetrisGA.initializeGenePool = initializeGenePool;

    // Select parents using tournament selection.
    // K represents the number of challengers to pick from.
    var tournamentSelection = function(genotypes, k) {
        var parents = [];
        var length = genotypes.length;
        var max = length - 1;
        while (parents.length < length) {
            var best = null;
            var challengers = [];
            _(k).times(function(n) {
                challengers.push(genotypes[_.random(max)])
            });
            for (var i = 0; i < k; i++) {
                if (best == null || challengers[i].fitness > best.fitness) {
                    best = challengers[i];
                }
            }
            parents.push(cloneGenotype(best));
        }
        return parents;
    };
    TetrisGA.tournamentSelection = tournamentSelection;

    // Uniform crossover
    //
    // If chosen for crossover, go through each allele and
    //randomly choose to swap or not swap alleles.
    var uniformCrossover = function(genotypes, pcx, pcr) {
        var ps = 0.5;
        var children = [];
        var length = Math.floor(genotypes.length / 2);
        for (var i = 0; i < length; i++) {
            var index = i * 2;
            var index2 = index + 1;
            var p1 = cloneGenotype(genotypes[index]);
            var p2 = cloneGenotype(genotypes[index2]);
            if (Math.random() < pcx) {
                for (var g = 0; g < p1.xPos.length; g++) {
                    if (Math.random() > ps) {
                        var temp = p1.xPos[g];
                        p1.xPos[g] = p2.xPos[g];
                        p2.xPos[g] = temp;
                    }
                }
            }

            if (Math.random() < pcr) {
                for (var g = 0; g < p1.rotation.length; g++) {
                    if (Math.random() > ps) {
                        var temp = p1.rotation[g];
                        p1.rotation[g] = p2.rotation[g];
                        p2.rotation[g] = temp;
                    }
                }
            }
            children.push(p1);
            children.push(p2);
        }
        return children;
    };
    TetrisGA.uniformCrossover = uniformCrossover;

    // N-point crossover
    //
    // Crossover allelele at N randomly selected points.
    // Number of genotypes must be an even number. Currently
    // does not handle that case yet.
    var nPointCrossover = function(genotypes, n, pcx, pcr) {
        var children = [];
        var length = genotypes.length / 2;

        for (var i = 0; i < length; i++) {

            var index = i * 2;
            var index2 = index + 1;
            var p1 = cloneGenotype(genotypes[index]);
            var p2 = cloneGenotype(genotypes[index2]);
            if (Math.random() < pcx) {

                var crossPoints = [];
                _(n).times(function(n) {
                    crossPoints.push(_.random(1, 8));
                });
                crossPoints = _.sortBy(
                    crossPoints, function(num){ return num });
                crossPoints = _.uniq(crossPoints);

                var cIndex = 0;
                var swap = false;

                for (var g = 0; g < p1.xPos.length; g++) {
                    if (cIndex != null && crossPoints[cIndex] == g) {
                        cIndex++;
                        if (cIndex < crossPoints.length) {
                            cIndex = null;
                        }
                        swap = swap === false ? true : false;
                    }
                    if (swap) {
                        var tempX = p1.xPos[g];
                        p1.xPos[g] = p2.xPos[g];
                        p2.xPos[g] = tempX;
                    }
                }
            }

            if (Math.random() < pcr) {

                var crossPoints = [];
                _(n).times(function(n) {
                    crossPoints.push(_.random(1, 8));
                });
                crossPoints = _.sortBy(
                    crossPoints, function(num){ return num });
                crossPoints = _.uniq(crossPoints);

                var cIndex = 0;
                var swap = false;

                for (var g = 0; g < p1.rotation.length; g++) {
                    if (cIndex != null && crossPoints[cIndex] == g) {
                        cIndex++;
                        if (cIndex < crossPoints.length) {
                            cIndex = null;
                        }
                        swap = swap === false ? true : false;
                    }
                    if (swap) {
                        var tempRotation = p1.rotation[g];
                        p1.rotation[g] = p2.rotation[g];
                        p2.rotation[g] = tempRotation;
                    }
                }
            }
            children.push(p1);
            children.push(p2);
        }
        return children;
    };
    TetrisGA.nPointCrossover = nPointCrossover;

    // Mutation using random reset algorithm for integers.
    //
    // Go through each allele and randomly pick a new value if within
    // mutation probability range
    var mutationRandomReset = function(genotypes, pmx, pmr) {
        var mutations = [];
        for (var i = 0; i < genotypes.length; i++) {
            mutations.push(cloneGenotype(genotypes[i]));
        }
        for (var i = 0; i < mutations.length; i++) {
            for (var g = 0; g < mutations[i].xPos.length; g++) {
                if (Math.random() < pmx) {
                   mutations[i].xPos[g] = randXPos();
                }
                if (Math.random() < pmr) {
                    mutations[i].rotation[g] = randRotation();
                }
            }
            return mutations;
        }
    };
    TetrisGA.mutationRandomReset = mutationRandomReset;

    // Creep mutation implementation.
    var mutationCreep = function(genotypes, range, pmx, pmr) {
        var mutations = [];
        for (var i = 0; i < genotypes.length; i++) {
            mutations.push(cloneGenotype(genotypes[i]));
        }
        for (var i = 0; i < mutations.length; i++) {
            for (var g = 0; g < mutations[i].xPos.length; g++) {
                if (Math.random() < pmx) {
                    var creepVal = _.random(range.min, range.max);
                    var newXPos = mutations[i].xPos[g] + creepVal;
                    if (newXPos < 0) {
                        newXPos = 0;
                    } else if (newXPos >= Constraints.WIDTH) {
                        newXPos = Constraints.WIDTH - 1;
                    }
                    mutations[i].xPos[g] = newXPos;
                }

                if (Math.random() < pmr) {
                    mutations[i].rotation[g] = randRotation();
                }
            }
            return mutations;
        }
    };
    TetrisGA.mutationCreep = mutationCreep;

    // A Computer player that plays tetris using a specific
    // sequence of moves at a constant speed per move.
    var ComputerPlayer = function(tetris, moves, reflexSpeed) {
        this.tetris = tetris;
        this.moves = moves;
        this.reflexSpeed = reflexSpeed || 0;
    };

    // Start playing Tetris.
    ComputerPlayer.prototype.play = function() {
        this.tetris.run();
        this.makeMove();
    };

    // Makes next move in the sequence of moves.
    // Once moves run out. Pause the game.
    ComputerPlayer.prototype.makeMove = function() {
        if (this.tetris.state === Tetris.GameState.RUNNING && this.moves.length > 0) {
            this.tetris.handleKeyEvent(this.moves.shift());
            var self = this;

            if (this.reflexSpeed > 0) {
                setTimeout(function() {
                    self.makeMove();
                }, this.reflexSpeed);
            } else {
                self.makeMove();
            }
        }
    };
    TetrisGA.ComputerPlayer = ComputerPlayer;

    // Calculate fitness
    //
    // Lower stack height is better. Max score 22.
    // Higher score is better.
    var calculateFitness = function(tetris, score) {
        var state = tetris.frozenBoard.state;
        var height = tetris.frozenBoard.height;
        var width = tetris.frozenBoard.width;

        var stackHeight = 0;
        for (var y = 0; y < height; ++y) {
            for (var x = 0; x < width; ++x) {
                if (state[y][x] !== 0) {
                    stackHeight = y;
                    break;
                }
            }
            if (stackHeight > 0) {
                break;
            }
        }
        return score + stackHeight * Constraints.STACK_BONUS;
    }
    TetrisGA.calculateFitness = calculateFitness;

    // Simulate Tetris and calculate fitness based on
    // score.
    var simulateFitness = function(genotype, shapes, reflexSpeed, callback) {
        var self = this;
        var converter = new GenotypeToMoveConverter();
        var moves = converter.convert(genotype, shapes);
        var shapeBag = new MockGenerator(_.clone(shapes));
        var tetris = new Tetris.Game(
            new NullView(),
            shapeBag,
            {
                keysEnabled: false,
                onGameEnd: function(score) {
                    genotype.fitness = calculateFitness(tetris, score);
                    callback(genotype);
                }
            }
        );
        var player = new ComputerPlayer(tetris, moves, reflexSpeed)
        player.play();
    };
    TetrisGA.simulateFitness = simulateFitness;

    // Web worker pool to run Tetris simulations in background
    var WorkerPool = function(script, numWorkers) {
        var event = "message";
        var numWorkers = numWorkers;
        var tasks = [];
        var pool = [];
        var pending = {};
        var workers = {};

        var runJob = function(data, callback) {
            if (pool.length > 0) {
                var workerMeta = pool.shift();
                var id = workerMeta.id;
                var worker = workerMeta.worker;
                worker.postMessage({id: id, data: data});
                pending[id] = callback;
            } else {
                tasks.push({data: data, callback: callback});
            }
        };
        this.runJob = runJob;

        for (var i = 0; i < numWorkers; i++) {
            var worker = new Worker(script);
            worker.addEventListener(event, function(msg) {
                var id = msg.data.id;
                var data = msg.data.data;
                var callback = pending[id];

                pending[id] = null;
                delete pending[id];

                pool.push({id: id, worker: workers[id]});

                if (tasks.length > 0) {
                    var task = tasks.shift();
                    runJob(task.data, task.callback);
                }

                callback(data);
            }, false);
            workers[i] = worker;
            pool.push({id: i, worker: worker});
        }

        this.terminateAll = function() {
            for (id in workers) {
                workers[id].terminate();
                delete workers[id];
            }
        }
    };
    TetrisGA.WorkerPool = WorkerPool;

    window.TetrisGA = TetrisGA;
})(window);