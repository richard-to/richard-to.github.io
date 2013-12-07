// TODO: Clean this up!
(function() {

    // Global settings for Tetris GA
    var settings = {
        population: 100,
        shapeList: Tetris.ShapeList,
        shapes: 20,
        generations: 500,
        tournamentSize: 10,
        reflexSpeed: 200,
        crossover: {
            swap: 0.1,
            uniform: {
                func: TetrisGA.uniformCrossover,
                pcx: 0.65,
                pcr: 0.90
            },
            nPoint: {
                func: TetrisGA.nPointCrossover,
                pcx: 0.90,
                pcr: 0.65,
                n: 2
            }
        },
        mutation: {
            swap: 0.75,
            randomReset: {
                func: TetrisGA.mutationRandomReset,
                pmx: 0.10,
                pmr: 0.40
            },
            creep: {
                func: TetrisGA.mutationCreep,
                range: {
                    min: -2,
                    max: 2
                },
                pmx: 0.35,
                pmr: 0.15
            },
        },
        workers: {
            script: "js/worker.js",
            num: 8
        },
        id: {
            playerCanvas: "player-board",
            cpuCanvas: "cpu-board",
        },
        selector: {
            replayButton: '.replay-button',
            playerScore: ".player-game-container .score",
            playerBest: ".player-game-container .best-score",
            cpuScore: ".cpu-game-container .score",
            cpuBest: ".cpu-game-container .best-score",
            resultList: ".results-list"
        }
    };

    // Populate default settings
    $("#population").val(settings.population);
    $("#generations").val(settings.generations);
    $("#tetrominos").val(settings.shapes);
    $("#tournament").val(settings.tournamentSize);

    $("#crossover-swap").val(settings.crossover.swap);
    $("#mutation-swap").val(settings.mutation.swap);

    $("#uniform-pcx").val(settings.crossover.uniform.pcx);
    $("#uniform-pcr").val(settings.crossover.uniform.pcr);

    $("#npoint-n").val(settings.crossover.nPoint.n);
    $("#npoint-pcx").val(settings.crossover.nPoint.pcx);
    $("#npoint-pcr").val(settings.crossover.nPoint.pcr);

    $("#random-pmx").val(settings.mutation.randomReset.pmx);
    $("#random-pmr").val(settings.mutation.randomReset.pmr);

    $("#creep-min").val(settings.mutation.creep.range.min);
    $("#creep-max").val(settings.mutation.creep.range.max);
    $("#creep-pmx").val(settings.mutation.creep.pmx);
    $("#creep-pmr").val(settings.mutation.creep.pmr);

    $(".simulate-button").click(function(e){
        $(".settings-container").fadeOut('slow');

        // Update settings.
        //
        // TODO: Add validation
        settings.population = parseInt($("#population").val());
        settings.generations = parseInt($("#generations").val());
        settings.shapes = parseInt($("#tetrominos").val());
        settings.tournamentSize = parseInt($("#tournament").val());

        settings.crossover.swap = parseFloat($("#crossover-swap").val());
        settings.mutation.swap = parseFloat($("#mutation-swap").val());

        settings.crossover.uniform.pcx = parseFloat($("#uniform-pcx").val());
        settings.crossover.uniform.pcr = parseFloat($("#uniform-pcr").val());

        settings.crossover.nPoint.n = parseInt($("#npoint-n").val());
        settings.crossover.nPoint.pcx = parseFloat($("#npoint-pcx").val());
        settings.crossover.nPoint.pcr = parseFloat($("#npoint-pcr").val());

        settings.mutation.randomReset.pmx = parseFloat($("#random-pmx").val());
        settings.mutation.randomReset.pmr = parseFloat($("#random-pmr").val());

        settings.mutation.creep.range.min = parseInt($("#creep-min").val());
        settings.mutation.creep.range.max = parseInt($("#creep-max").val());
        settings.mutation.creep.pmx = parseFloat($("#creep-pmx").val());
        settings.mutation.creep.pmr = parseFloat($("#creep-pmr").val());

        var shapeDict = {
            I: Tetris.ShapeI,
            J: Tetris.ShapeJ,
            L: Tetris.ShapeL,
            O: Tetris.ShapeO,
            S: Tetris.ShapeS,
            T: Tetris.ShapeT,
            Z: Tetris.ShapeZ,
        };
        var shapeList = []
        var selectedShapes = $("#shapes").val();
        for (var i = 0; i < selectedShapes.length; i++) {
            shapeList.push(shapeDict[selectedShapes[i]]);
        }
        settings.shapeList = shapeList;

        // Get canvas elements that represent game board.
        var playerCanvas = document.getElementById(settings.id.playerCanvas);
        var cpuCanvas = document.getElementById(settings.id.cpuCanvas);

        // Random tetromino generator given a list of valid shapes.
        var randomGen = new Tetris.RandomGenerator(settings.shapeList);

        // Initialize a random sequence of n shapes with Random generator.
        var shapes = TetrisGA.initializeShapes(settings.shapes, randomGen);

        // Create n genotypes for generation 0.
        var genotypes = TetrisGA.initializeGenePool(settings.population, shapes.length);

        // Create tetris game for player.
        var playerTetris = new Tetris.Game(
            new Tetris.CanvasView(playerCanvas),
            new TetrisGA.MockGenerator(shapes.slice()),
            {
                onGameEnd: onPlayerGameEnd,
                onScoreUpdated: onPlayerScoreUpdated
            });
        playerTetris.run();

        // Callback that updates player score when score changes.
        function onPlayerScoreUpdated(score) {
            $(settings.selector.playerScore).text(score);
            if (score > parseInt($(settings.selector.playerBest).text())) {
                 $(settings.selector.playerBest).text(score);
            }
        }

        // Callback that restarts tetris game for player after Tetrominos sequence finished.
        function onPlayerGameEnd(score) {
            $(settings.selector.playerScore).text(0);
            playerTetris = new Tetris.Game(
                new Tetris.CanvasView(playerCanvas),
                new TetrisGA.MockGenerator(shapes.slice()),
                {
                    onGameEnd: onPlayerGameEnd,
                    onScoreUpdated: onPlayerScoreUpdated
                });
            playerTetris.run();
        }

        // Initialize a null cpuTetris player. Instantiate when worker jobs completed for each generation if
        // value is still null.
        var cpuTetris = null;

        // Callback that update CPU score.
        function onCpuScoreUpdated(score) {
            $(settings.selector.cpuScore).text(score);
            if (score > parseInt($(settings.selector.cpuBest).text())) {
                 $(settings.selector.cpuBest).text(score);
            }
        }

        // Callback that sets cpuTetris back to null so a new simulation can be run if available.
        function onCpuGameEnd(score) {
            cpuTetris = null;
        }

        var jobsCompleted = 0;
        var currentGeneration = 0;
        var bestFitness = 0;
        var globalBestGenotype = null;
        var bestGenotype = null;
        var sumFitness = 0;

        $(settings.selector.replayButton).click(function(e){
            if (cpuTetris == null) {
                $(settings.selector.cpuScore).text(0);
                var converter = new TetrisGA.GenotypeToMoveConverter();
                var cpuMoves = converter.convert(globalBestGenotype, shapes);
                var cpuShapeBag = new TetrisGA.MockGenerator(shapes.slice());

                cpuTetris = new Tetris.Game(
                    new Tetris.CanvasView(cpuCanvas),
                    cpuShapeBag,
                    {
                        keysEnabled: false,
                        onGameEnd: onCpuGameEnd,
                        onScoreUpdated: onCpuScoreUpdated
                    });
                var player = new TetrisGA.ComputerPlayer(cpuTetris, cpuMoves, settings.reflexSpeed);
                player.play();
            }
        });

        // Run Tetris GA simulation using Worker pool.
        var workerPool = new TetrisGA.WorkerPool(settings.workers.script, settings.workers.num);
        for (var i = 0; i < genotypes.length; i++) {
            workerPool.runJob({genotype: genotypes[i], shapes: shapes}, onJobCompleted);
        }

        // Callback for when web worker jobs completed
        // Returns a genotype with simulated fitness value.
        //
        // Need to refactor this at some point.
        function onJobCompleted(genotype) {
            // Keep track of completed jobs. Once all completed, then move
            // we can move to next generation.
            jobsCompleted++;

            // Add up fitness so we can average them out later.
            sumFitness += genotype.fitness;

            // Keep track of best genotype of generation.
            if (genotype.fitness >= bestFitness) {
                bestFitness = genotype.fitness;
                bestGenotype = TetrisGA.cloneGenotype(genotype);
            }

            // Generation end condition is when all genotypes have been simulated.
            if (jobsCompleted === genotypes.length) {

                // If no cpu simulation is running, run the best simulation.
                if (cpuTetris == null) {
                    $(settings.selector.cpuScore).text(0);
                    var converter = new TetrisGA.GenotypeToMoveConverter();
                    var cpuMoves = converter.convert(bestGenotype, shapes);
                    var cpuShapeBag = new TetrisGA.MockGenerator(shapes.slice());

                    cpuTetris = new Tetris.Game(
                        new Tetris.CanvasView(cpuCanvas),
                        cpuShapeBag,
                        {
                            keysEnabled: false,
                            onGameEnd: onCpuGameEnd,
                            onScoreUpdated: onCpuScoreUpdated
                        });
                    var player = new TetrisGA.ComputerPlayer(cpuTetris, cpuMoves);
                    player.play();
                }

                // Average the sum of all fitness values.
                var avgScore = sumFitness / settings.population;

                // Display results to UI.
                var li = $("<li>");
                li.text(bestFitness + " (" + avgScore.toFixed(2) + ")");
                $(settings.selector.resultList).prepend(li);

                jobsCompleted = 0;
                bestFitness = 0;
                sumFitness = 0;
                currentGeneration++;

                // Keep track of best genotype. Elitism.
                if (globalBestGenotype == null || bestGenotype.fitness >= globalBestGenotype.fitness) {
                    globalBestGenotype = TetrisGA.cloneGenotype(bestGenotype);
                }

                // Simulate the next generation if there are more to do.
                //
                // 1. Select parents
                // 2. Perform crossover on parents
                // 3. Mutation children
                // 4. Simulate fitness values of new generation
                // 5. Repeat.
                if (currentGeneration < settings.generations) {
                    var parents = TetrisGA.tournamentSelection(genotypes, settings.tournamentSize);
                    if (globalBestGenotype != null) {
                        parents.pop();
                        parents.push(TetrisGA.cloneGenotype(globalBestGenotype));
                    }
                    var children = null;
                    if (Math.random() > settings.crossover.swap) {
                        var crossover = settings.crossover.uniform;
                        children = crossover.func(parents, crossover.pcx, crossover.pcr);
                    } else {
                        var crossover = settings.crossover.nPoint;
                        children = crossover.func(parents, crossover.n, crossover.pcx, crossover.pcr);
                    }

                    var mutations = null;
                    if (Math.random() > settings.mutation.swap) {
                        var mutator = settings.mutation.randomReset;
                        mutations = mutator.func(children, mutator.pmx, mutator.pmr);
                    } else {
                        var mutator = settings.mutation.creep;
                        mutations = mutator.func(children, mutator.range, mutator.pmx, mutator.pmr);
                    }

                    genotypes = mutations;
                    for (var i = 0; i < genotypes.length; i++) {
                        workerPool.runJob({genotype: genotypes[i], shapes: shapes}, onJobCompleted);
                    }
                } else {
                    workerPool.terminateAll();
                    $(settings.selector.replayButton).show();
                }
            }
        }
    });
})();