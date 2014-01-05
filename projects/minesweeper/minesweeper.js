// Porting tutorial code from http://www.ai-junkie.com/ann/evolved/nnt1.html
// Unfortunately I'm on a Mac and the code is developed for Windows machines.
// So just gonna do this in Javascript for simplicity.
(function(window, undefined) {
    var Minesweeper = function() {
        this.brain = new NeuralNet();
        this.position =
            new Vector2d(Math.random() * Params.windowWidth, Math.random() * Params.windowHeight);
        this.direction = new Vector2d();
        this.rotation = Math.random() * Params.twoPi;
        this.speed;
        this.lTrack = 0.16;
        this.rTrack = 0.16;
        this.fitness = 0;
        this.scale = Params.sweeperScale;
        this.iClosestMine = 0;
    };

    // Update minesweeper position using neural network
    Minesweeper.prototype.update = function(mines) {
        var inputs = [];
        this.closestMine = this.getClosestMine(mines);
        Vector2dNormalize(this.closestMine);

        inputs.push(this.closestMine.x);
        inputs.push(this.closestMine.y);
        inputs.push(this.direction.x);
        inputs.push(this.direction.y);

        var output = this.brain.update(inputs);

        // If num outputs are not correct, exit
        if (output.length < Params.numOutputs) {
            return false;
        }

        this.lTrack = output[0];
        this.rTrack = output[1];

        // Clamp the rot force between -0.3 and 0.3
        var rotForce = this.lTrack - this.rTrack;
        var min  = -1 * Params.maxTurnRate;
        var max = Params.maxTurnRate;
        if (rotForce < min) {
            rotForce = min;
        }

        if (rotForce > max) {
            rotForce = max;
        }

        // Rotate sweeper
        this.rotation += rotForce;

        this.speed = (this.lTrack + this.rTrack);

        this.direction.x= -1 * Math.sin(this.rotation);
        this.direction.y = Math.cos(this.rotation);

        this.position.x += this.speed * this.direction.x;
        this.position.y += this.speed * this.direction.y;

        // Make sure position is not out of the window
        if (this.position.x > Params.windowWidth) {
            this.position.x = 0;
        }

        if (this.position.x < 0) {
            this.position.x = Params.windowWidth;
        }

        if (this.position.y > Params.windowHeight) {
            this.position.y = 0;
        }

        if (this.position.y < 0) {
            this.position.y = Params.windowHeight;
        }

        return true;
    };

    // Where does vector Spoints come from?
    Minesweeper.prototype.worldTransform = function(sweeperVerts) {
        var mat = new Matrix2d();
        mat.scale(this.scale, this.scale);
        mat.rotate(this.rotation);
        mat.translate(this.position.x, this.position.y);
        mat.transformPoints(sweeperVerts);
    };


    Minesweeper.prototype.getClosestMine = function(mines) {
        var closestMineDist = 99999;
        var closestMine = Vector2d(0, 0);
        for (var i = 0; i < mines.length; i++) {
            var distToMine = Vector2dLength(Vector2dSub(mines[i], this.position));
            if (distToMine < closestMineDist) {
                closestMineDist = distToMine;
                closestMine = Vector2dSub(this.position, mines[i]);
                this.iClosestMine = i;
            }
        }
        return closestMine;
    };

    // Check for closeset mine. Return -1 if none are close enough
    // What is the 5 for? Also what is size?
    Minesweeper.prototype.checkForMine = function(mines, size) {
        var distToMine = Vector2dSub(this.position, mines[this.iClosestMine]);
        if (Vector2dLength(distToMine) < (size + 5)) {
            return this.iClosestMine;
        }
        return -1;
    };

    Minesweeper.prototype.reset = function() {
        this.position = new Vector2d(Math.random() * Params.windowWidth, Math.random() * Params.windowHeight);
        this.fitness = 0;
        this.rotation = Math.random() * Params.twoPi;
    };

    Minesweeper.prototype.position = function() {
        return this.position;
    };

    Minesweeper.prototype.incrementFitness = function() {
        this.fitness++;
    };

    Minesweeper.prototype.getFitness = function() {
        return this.fitness;
    };

    Minesweeper.prototype.putWeights = function(weights) {
        this.brain.putWeights(weights);
    };

    Minesweeper.prototype.getNumWeights = function() {
        return this.brain.getNumWeights();
    };

    window.Minesweeper = Minesweeper;
}(window));