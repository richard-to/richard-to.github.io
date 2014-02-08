(function(window, undefined) {

    var clone2d = function(list2d) {
        var list2dClone = [];
        for (var x = 0; x < list2d.length; ++x) {
            list2dClone[x] = list2d[x].slice(0);
        }
        return list2dClone;
    };

    var to1d = function(list) {
        var list1d = [];
        for (var x = 0; x < list.length; ++x) {
            for (var y = 0; y < list[x].length; ++y) {
                list1d.push(list[x][y]);
            }
        }
        return list1d;
    };

    var to2d = function(list, side) {
        var list2d = [];
        for (var x = 0; x < side; ++x) {
            list2d[x] = [];
            for (var y = 0; y < side; ++y) {
                list2d[x][y] = list[x * side + y];
            }
        }
        return list2d;
    };

    var range = function(n) {
        var a = [];
        while (n > 0) {
            a.unshift(--n);
        }
        return a;
    };

    var shuffle = function(list_in) {
        var pick, temp;
        var list = list_in.slice(0);
        var i = list.length;
        while (--i > 0) {
            pick = Math.floor(Math.random() * i);
            temp = list[i];
            list[i] = list[pick];
            list[pick] = temp;
        }
        return list;
    };

    var Set = function() {
        this.table = {};
        this.count = 0;
    };

    Set.prototype.notContains = function(obj) {
        if (this.table[obj.state]) {
            return false;
        } else {
            return true;
        }
    };

    Set.prototype.length = function() {
        return this.count;
    };

    Set.prototype.add = function(obj) {
        if (!this.table[obj.state]) {
            this.table[obj.state] = true;
            ++this.count;
        }
    };

    var Heap = function(compare) {
        this._compare = compare;
        this._heap = [];
    };

    Heap.prototype.empty = function() {
        return this._heap.length == 0;
    };

    Heap.prototype.count = function() {
        return this._heap.length;
    };

    Heap.prototype.insert = function(obj) {
        this._heap.push(obj);
        this._percolateUp(this._heap.length - 1);
        return this;
    };

    Heap.prototype.min = function() {
        return this._heap[0];
    };

    Heap.prototype.pop = function() {
        if (this.empty()) {
            return null;
        } else if (this._heap.length == 1) {
            return this._heap.pop();
        } else {
            var min = this._heap[0];
            this._heap[0] = this._heap.pop();
            this._percolateDown(0);
            return min;
        }
    };

    Heap.prototype._percolateUp = function(hole) {
        if (hole > 0) {
            var parent = null;
            parent = Math.floor((hole - 1) / 2);
            if (this._compare(this._heap[hole], this._heap[parent]) < 0)  {
                var temp = this._heap[parent];
                this._heap[parent] = this._heap[hole];
                this._heap[hole] = temp;
                this._percolateUp(parent);
            }
        }
    };

    Heap.prototype._percolateDown = function(hole) {
        parent = this._heap[hole];
        child1 = 2 * hole + 1;
        child2 = child1 + 1;
        if (child1 < this._heap.length &&
            (child2 >= this._heap.length || this._compare(this._heap[child1], this._heap[child2]) < 0)) {
            if (this._compare(parent, this._heap[child1]) > 0) {
                this._heap[hole] = this._heap[child1];
                this._heap[child1] = parent;
                this._percolateDown(child1);
            }
        } else if (child2 < this._heap.length) {
            if (this._compare(parent, this._heap[child2]) > 0) {
                this._heap[hole] = this._heap[child2];
                this._heap[child2] = parent;
                this._percolateDown(child2);
            }
        }
    };


    var PuzzleState = function(state, last, goal, cost) {
        this.state = state;
        this.last = last || null;
        this.goal = goal || null;
        this.cost = cost || 1;
        this.blank = 0;
        this.stepCost = null;

        this.sideLen = this.state.length;
        this.blankPos = this.findBlankPos();
        this.pathCost = this.calcPathCost();
    };

    PuzzleState.prototype.slideUp = function() {
        return this.swap(this.blankPos[0] - 1, this.blankPos[1]);
    };

    PuzzleState.prototype.slideDown = function() {
        return this.swap(this.blankPos[0] + 1, this.blankPos[1])
    };

    PuzzleState.prototype.slideLeft = function() {
        return this.swap(this.blankPos[0], this.blankPos[1] - 1)
    };

    PuzzleState.prototype.slideRight = function() {
        return this.swap(this.blankPos[0], this.blankPos[1] + 1)
    };

    PuzzleState.prototype.validPos = function(col, row) {
        return (col >= 0 && col < this.sideLen && row >= 0 && row < this.sideLen);
    };

    PuzzleState.prototype.swap = function(col, row) {
        if (!this.validPos(col, row)) {
            return null;
        }

        var currentState = this.state;
        var newState = clone2d(currentState);
        newState[this.blankPos[0]][this.blankPos[1]] = newState[col][row]
        newState[col][row] = this.blank

        var nextPuzzleState = new PuzzleState(newState, this, this.goal);
        return nextPuzzleState;
    };

    PuzzleState.prototype.isGoal = function() {
        return this.equals(this.goal);
    };

    PuzzleState.prototype.predictedCost = function() {
        return this.pathCost + this.calcStepCost();
    };

    PuzzleState.prototype.heuristic = function() {
        return 0;
    };

    PuzzleState.prototype.calcStepCost = function() {
        if (!this.stepCost) {
            this.stepCost = this.heuristic();
        }
        return this.stepCost;
    };

    PuzzleState.prototype.calcPathCost = function() {
        var pathCost = 0;
        if (this.last) {
            pathCost = this.cost + this.last.pathCost;
        }
        return pathCost;
    };

    PuzzleState.prototype.hasLast = function() {
        return this.last != null;
    };

    PuzzleState.prototype.printState = function() {
        for (var x = 0; x < this.state.length; ++x) {
            console.log(this.state[x]);
        }
    };

    PuzzleState.prototype.parity = function() {
        var parity = 0;
        var stateList = to1d(this.state);
        stateList.splice(stateList.indexOf(this.blank), 1);
        while (stateList.length > 0) {
            state = stateList.shift();
            for (var i = 0; i < stateList.length; ++i) {
                if (state > stateList[i]) {
                    parity += 1;
                }
            }
        }
        return (parity % 2 == 0) ? false : true;
    };

    PuzzleState.prototype.findBlankPos = function() {
        var state = this.state;
        var sideLen = this.sideLen;
        var blank = this.blank;
        for (var x = 0; x < sideLen; ++x) {
            for (var y = 0; y < sideLen; ++y) {
                if (state[x][y] == blank) {
                    return [x, y];
                }
            }
        }
    };

    PuzzleState.prototype.equals = function(other) {
        return this.statesAreEqual(other);
    };

    PuzzleState.prototype.notEquals = function(other) {
        return !this.equals(other);
    };

    PuzzleState.prototype.statesAreEqual = function(otherState) {
        var a = this.state;
        var b = otherState.state;

        if (a === b) {
            return true;
        }

        if (a == null || b == null) {
            return false;
        }

        if (a.length != b.length) {
            return false;
        }

        for (var x = 0; x < a.length; ++x) {
            for (var y = 0; y < a.length; ++y) {
                if (a[x][y] !== b[x][y]) {
                    return false;
                }
            }
        }
        return true;
    };

    var PuzzleStateQueue = function() {
        this.counter = 0;
        this.heap = new Heap(function(a, b) {
            if (a[0].predictedCost() > b[0].predictedCost()) {
                return 1;
            } else if (a[0].predictedCost() < b[0].predictedCost()) {
                return -1;
            } else {
                return 0;
            }
        });
    };

    PuzzleStateQueue.prototype.size = function() {
        return this.heap.count();
    };

    PuzzleStateQueue.prototype.empty = function() {
        return this.heap.empty();
    };

    PuzzleStateQueue.prototype.add = function(state) {
        this.counter += 1;
        this.heap.insert([state, this.counter]);
    };

    PuzzleStateQueue.prototype.next = function() {
        var result = this.heap.pop();
        if (result) {
            return result[0];
        } else {
            return null;
        }
    };

    var genRandPuzzle = function(side) {
        var size = side * side;
        while (true) {
            start = range(size);
            start = shuffle(start);
            startState = to2d(start, side);
            startState = new PuzzleState(startState)

            goal = range(size);
            goalState = to2d(goal, side);
            goalState = new PuzzleState(goalState)
            if (startState.parity() == goalState.parity()) {
                startState.goal = goalState;
                return startState;
            }
        }
    };

    var noHeuristic = function() {
        return 0;
    };

    var manhattanHeuristic = function() {
        var count = 0;
        var startState = this.state;
        var goalState = this.goal.state;
        var sideLen = this.sideLen;
        var goalY = range(sideLen * sideLen);
        var goalX = range(sideLen * sideLen);
        for (var x = 0; x < sideLen; ++x) {
            for (var y = 0; y < sideLen; ++y) {
                goalY[goalState[x][y]] = y;
                goalX[goalState[x][y]] = x;
            };
        }

        for (var x = 0; x < sideLen; ++x) {
            for (var y = 0; y < sideLen; ++y) {
                var tile = startState[x][y];
                if (tile != 0 && tile != goalState[x][y]) {
                    count += Math.abs(goalX[tile] - x) + Math.abs(goalY[tile] - y);
                }
            }
        }
        return count;
    };

    var misplacedTilesHeuristic = function() {
        var count = 0;
        var startState = this.state;
        var goalState = this.goal.state;
        var sideLen = this.sideLen;
        for (var x = 0; x < sideLen; ++x) {
            for (var y = 0; y < sideLen; ++y) {
                var tile = startState[x][y];
                if (tile != 0 && tile != goalState[x][y]) {
                    count += 1;
                }
            }
        }
        return count;
    };

    var uniformCost = function() {
        return this.pathCost + this.calcStepCost();
    };


    var greedyCost = function() {
        return this.calcStepCost();
    };

    var solve = function(startState, heuristic, predictedCost) {
        var size = 3;
        var maxIterations = 10000;

        PuzzleState.prototype.heuristic = heuristic;
        PuzzleState.prototype.predictedCost = predictedCost;

        var visited = new Set();

        var queue = new PuzzleStateQueue();
        queue.add(startState);

        var iteration = 0;
        var endState = null;

        var newState;
        var currentState;
        while (iteration < maxIterations && !endState && !queue.empty()) {
            currentState = queue.next();
            if (visited.notContains(currentState)) {
                visited.add(currentState);
                if (currentState.isGoal()) {
                    endState = currentState;
                } else {
                    newState = currentState.slideUp();
                    if (newState) {
                        queue.add(newState);
                    }

                    newState = currentState.slideDown();
                    if (newState) {
                        queue.add(newState);
                    }

                    newState = currentState.slideLeft();
                    if (newState) {
                        queue.add(newState);
                    }

                    newState = currentState.slideRight();
                    if (newState) {
                        queue.add(newState);
                    }
                }
                ++iteration;
            }
        }

        var path = [];
        var pathState = endState;
        while (pathState.last) {
            path.unshift(pathState);
            pathState = pathState.last;
        }
        return [startState, path, iteration, queue.size() + visited.length()];
    };

    window.eightPuzzle = {
        Set: Set,
        Heap: Heap,
        clone2d: clone2d,
        to1d: to1d,
        to2d: to2d,
        range: range,
        shuffle: shuffle,
        PuzzleState: PuzzleState,
        PuzzleStateQueue: PuzzleStateQueue,
        noHeuristic: noHeuristic,
        misplacedTilesHeuristic: misplacedTilesHeuristic,
        manhattanHeuristic: manhattanHeuristic,
        uniformCost: uniformCost,
        greedyCost: greedyCost,
        genRandPuzzle: genRandPuzzle,
        solve: solve
    };
}(window));