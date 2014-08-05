(function(window, undefined) {

    // Basic heap implementation
    //
    // This does not include a method to
    // to build a heap from an unordered array
    // and does not allow removal of specific items.
    //
    // Only implements insert, peek, pop, and empty,
    // which is good enough for what I need here.
    //
    // This implementation requires a compare function used
    // for ordering objects. Return 1 for greter than, 0 for equals
    // and -1 for less than.
    var Heap = function(compare) {
        this.compare = compare;
        this.heap = [];
    };

    Heap.prototype.empty = function() {
        return this.heap.length == 0;
    };

    Heap.prototype.insert = function(obj) {
        this.heap.push(obj);
        this.percolateUp(this.heap.length);
    };

    Heap.prototype.min = function() {
        return this.heap[0];
    };

    Heap.prototype.pop = function() {
        if (this.empty()) {
            return null;
        } else if (this.heap.length == 1) {
            return this.heap.pop();
        } else {
            var min = this.heap[0];
            this.heap[0] = this.heap.pop();
            this.percolateDown(0);
            return min;
        }
    };

    Heap.prototype.percolateUp = function(hole) {
        if (hole > 0) {
            var parent = null;
            if (hole % 2 == 0) {
                parent = (hole - 1) / 2;
            } else {
                parent = hole / 2;
            }
            if (parent < this.heap.length &&
                hole < this.heap.length &&
                this.compare(this.heap[hole], this.heap[parent]) > 0)  {

                var temp = this.heap[parent];
                this.heap[parent] = this.heap[hole];
                this.heap[hole] = temp;
                this.percolateUp(parent);
            }
        }
    };

    Heap.prototype.percolateDown = function(hole) {
        parent = this.heap[hole];
        child1 = 2 * hole + 1;
        child2 = child1 + 1;
        if (child1 < this.heap.length &&
            (child2 >= this.heap.length || this.compare(this.heap[child1], this.heap[child2]) < 0) &&
            this.compare(parent, this.heap[child1]) > 0) {
            this.heap[hole] = this.heap[child1];
            this.heap[child1] = parent;
            this.percolateDown(child1);
        } else if (child2 < this.heap.length && this.compare(parent, this.heap[child2]) > 0) {
            this.heap[hole] = this.heap[child2];
            this.heap[child2] = parent;
            this.percolateDown(child2);
        }
    };


    // Priority Queue object that uses heap data structure
    var PriorityQueue = function(compare) {
        this.heap = new Heap(compare);
    };

    PriorityQueue.prototype.empty = function() {
        return this.heap.empty();
    }

    PriorityQueue.prototype.insert = function(obj) {
        this.heap.insert(obj);
    };

    PriorityQueue.prototype.peek = function() {
        return this.heap.min();
    }

    PriorityQueue.prototype.remove = function() {
        return this.heap.pop();
    };


    // State Machine is used to manage entity states
    // in a resuable way. Seems like a good way to make
    // the state pattern more abstract
    //
    // There are some twists and modifications specific to game
    // entities. For instance there is a global state that is
    // always checked.
    var StateMachine = function(owner) {
        this.owner = owner;
        this.currentState = null;
        this.previousState = null;
        this.globalState = null;
    };

    StateMachine.prototype.handleMessage = function(msg) {
        if (this.currentState && this.currentState.onMessage(this.owner, msg)) {
            return true;
        }
        if (this.globalState && this.globalState.onMessage(this.owner, msg)) {
            return true;
        }
        return false;
    };

    StateMachine.prototype.setCurrentState = function(s) {
        this.currentState = s;
    };

    StateMachine.prototype.setGlobalState = function(s) {
        this.globalState = s;
    };

    StateMachine.prototype.setPreviousState = function(s) {
        this.previousState = s;
    };

    StateMachine.prototype.update = function() {
        if (this.globalState) {
            this.globalState.execute(this.owner);
        }

        if (this.currentState) {
            this.currentState.execute(this.owner);
        }
    };

    StateMachine.prototype.changeState = function(newState) {
        this.previousState = this.currentState;
        this.currentState.exit(this.owner);
        this.currentState = newState;
        this.currentState.enter(this.owner);
    };

    // Useful for blips states
    StateMachine.prototype.revertToPreviousState = function() {
        this.changeState(this.previousState);
    };

    // TODO(richard-to): Should make sure this actually works
    StateMachine.prototype.isInState = function(s) {
        return this.currentState instanceof s.constructor.name;
    };

    StateMachine.prototype.getCurrentState = function() {
        return this.currentState;
    };

    StateMachine.prototype.getGlobalState = function() {
        return this.globalState;
    };

    StateMachine.prototype.getPreviousState = function() {
        return this.previousState;
    };


    window.util = {
        PriorityQueue: PriorityQueue,
        StateMachine: StateMachine
    };
}(window));