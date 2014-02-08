QUnit.assert.contains = function(needle, haystack, message) {
    var actual = haystack.indexOf(needle) > -1;
    QUnit.push(actual, actual, needle, message);
};

test( "Test shuffle function", function() {
    var list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    var shuffled = eightPuzzle.shuffle(list);

    deepEqual(list, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], "List not modified.");

    ok(shuffled.length == list.length, "Both lists are equal in length");

    // Not always true. It's possible that the list could be shuffled in order.
    // There is not check for that in my shuffle implementation.
    notDeepEqual(shuffled, list, "Numbers are in different order.");

    shuffled.sort();

    deepEqual(shuffled, list, "Both lists contain the same numbers.");
});

test("Test range function", function() {
    var list = eightPuzzle.range(10);
    deepEqual(list, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], "Valid range list.");
});

test("Test range function with negative number", function() {
    var list = eightPuzzle.range(-1);
    deepEqual(list, [], "Valid range list.");
});

test("Test 1D array (1x9) to 2D square (3x3)", function() {
    var length = 9;
    var side = 3;
    var list = eightPuzzle.range(length);
    var list2d = eightPuzzle.to2d(list, side);
    for (var x = 0; x < side; ++x) {
        for (var y = 0; y < side; ++y) {
            ok(list2d[x][y] == list[x * side + y]);
        }
    }
});

test("Test 2D (3x3) to 1D (1x9)", function() {
    var length = 9;
    var side = 3;
    var list = eightPuzzle.range(length);
    var list2d = eightPuzzle.to2d(list, side);
    var list1d = eightPuzzle.to1d(list2d);
    deepEqual(list1d, list, "2d list converted to 1d successfully");
});

test("Test shallow cloning of 2d array", function() {
    var length = 9;
    var side = 3;
    var list = eightPuzzle.range(length);
    var list2d = eightPuzzle.to2d(list, side);
    var listClone = eightPuzzle.clone2d(list2d);
    deepEqual(list2d, listClone, "Cloned list has the same values and order");

    listClone[0][1] = 50;
    notDeepEqual(list2d, listClone, "Cloned list is cloned correctly");
});

test("Test simple Set implementation", function() {
    var set = new eightPuzzle.Set();
    var obj1 = {
        state: [1, 2, 3]
    };
    var obj2 = {
        state: [1, 2, 3, 5]
    };
    set.add(obj1);
    equal(set.notContains(obj1), false, "Object exists in set");
    equal(set.notContains(obj2), true, "Object does not exist in set");
    set.add(obj2);
    equal(set.notContains(obj2), false, "Object exists in set");
    equal(set.length(), 2, "2 items in set");
    set.add(obj2);
    equal(set.length(), 2, "Duplicate items not allowed");
});

test("Test Heap implementation", function(){
    var heap = new eightPuzzle.Heap(function(a, b) {
        if (a > b) {
            return 1;
        } else if (a < b) {
            return -1;
        } else {
            return 0;
        }
    });

    ok(heap.empty() === true, "Heap is empty");
    ok(heap.count() === 0, "Heap size is 0");
    ok(heap.pop() === null, "Pop empty heap results in null");

    heap.insert(5).insert(2).insert(20).insert(6).insert(40).insert(20).insert(1).insert(55);
    ok(heap.empty() === false, "Heap is not empty");
    ok(heap.count() === 8, "Heap size is correct");
    ok(heap.min() === 1, "Min value is correct");

    ok(heap.pop() === 1, "Min value is correct");
    ok(heap.pop() === 2, "Min value is correct");
    ok(heap.pop() === 5, "Min value is correct");
    ok(heap.pop() === 6, "Min value is correct");
    ok(heap.pop() === 20, "Min value is correct");
    ok(heap.pop() === 20, "Min value is correct");
    ok(heap.pop() === 40, "Min value is correct");
    ok(heap.pop() === 55, "Min value is correct");
    ok(heap.pop() === null, "Min value is correct");
});

test("Test Invalid Puzzle by checking parity", function() {
    var startState = [
        [0, 2, 1],
        [3, 4, 5],
        [6, 7, 8]
    ];
    var endState = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];

    var puzzleStart = new eightPuzzle.PuzzleState(startState);
    var puzzleEnd = new eightPuzzle.PuzzleState(endState);

    ok(puzzleStart.parity() !== puzzleEnd.parity(), "Parity should not be equal");
});

test("Test valid Puzzle by checking parity", function() {
    var startState = [
        [0, 1, 3],
        [4, 2, 5],
        [7, 8, 6]
    ];

    var endState = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];

    var puzzleStart = new eightPuzzle.PuzzleState(startState);
    var puzzleEnd = new eightPuzzle.PuzzleState(endState);

    ok(puzzleStart.parity() === puzzleEnd.parity(), "Parity should be equal");
});

test("Test find blank (0) in puzzle", function() {
    var startState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];

    var puzzleStart = new eightPuzzle.PuzzleState(startState);
    deepEqual(puzzleStart.findBlankPos(), [1, 1], "Blank located at 1,1");
});

test("Test puzzles not equal", function() {
    var startState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];

    var endState = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];
    var puzzleStart = new eightPuzzle.PuzzleState(startState);
    var puzzleEnd = new eightPuzzle.PuzzleState(endState);
    ok(puzzleStart.notEquals(puzzleEnd) === true, "Puzzles are not equal");
});

test("Test puzzles equal", function() {
    var startState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];

    var endState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];
    var puzzleStart = new eightPuzzle.PuzzleState(startState);
    var puzzleEnd = new eightPuzzle.PuzzleState(endState);
    ok(puzzleStart.equals(puzzleEnd) === true, "Puzzles are equal");
});

test("Test puzzles has last", function() {
    var startState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];

    var endState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];

    var puzzleStart = new eightPuzzle.PuzzleState(startState);
    var puzzleEnd = new eightPuzzle.PuzzleState(endState);
    ok(puzzleStart.hasLast() === false, "Puzzle does not have last");

    eightPuzzle.PuzzleState.last = puzzleEnd;
    ok(puzzleStart.hasLast() === false, "Puzzle does not have last");
});

test("Test puzzle slide up action", function() {
    var startState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];

    var expectedState1 = [
        [8, 0, 3],
        [4, 1, 5],
        [7, 2, 6]
    ];

    var puzzleStart = new eightPuzzle.PuzzleState(startState);
    var puzzleResult = puzzleStart.slideUp();
    ok(puzzleResult.equals(new eightPuzzle.PuzzleState(expectedState1)), "Puzzle slide up moved correctly");
    ok(puzzleResult.last === puzzleStart, "Puzzle previous state is correct");
});

test("Test puzzle slide up action invalid", function() {
    var startState = [
        [8, 0, 3],
        [4, 1, 5],
        [7, 2, 6]
    ];

    var expectedState1 = [
        [8, 0, 3],
        [4, 1, 5],
        [7, 2, 6]
    ];

    var puzzleStart = new eightPuzzle.PuzzleState(startState);
    var puzzleResult = puzzleStart.slideUp();
    ok(puzzleStart.slideUp() === null, "Puzzle slide up moved correctly");
});

test("Test puzzle slide down action", function() {
    var startState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];

    var expectedState1 = [
        [8, 1, 3],
        [4, 2, 5],
        [7, 0, 6]
    ];

    var puzzleStart = new eightPuzzle.PuzzleState(startState);
    var puzzleResult = puzzleStart.slideDown();
    ok(puzzleResult.equals(new eightPuzzle.PuzzleState(expectedState1)), "Puzzle slide down moved correctly");
});

test("Test puzzle slide left action", function() {
    var startState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];

    var expectedState1 = [
        [8, 1, 3],
        [0, 4, 5],
        [7, 2, 6]
    ];

    var puzzleStart = new eightPuzzle.PuzzleState(startState);
    var puzzleResult = puzzleStart.slideLeft();
    ok(puzzleResult.equals(new eightPuzzle.PuzzleState(expectedState1)), "Puzzle slide left moved correctly");
});

test("Test puzzle slide right action", function() {
    var startState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];

    var expectedState1 = [
        [8, 1, 3],
        [4, 5, 0],
        [7, 2, 6]
    ];

    var puzzleStart = new eightPuzzle.PuzzleState(startState);
    var puzzleResult = puzzleStart.slideRight();
    ok(puzzleResult.equals(new eightPuzzle.PuzzleState(expectedState1)), "Puzzle slide right moved correctly");
});

test("Test puzzle is goal", function() {
    var startState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];

    var goalState = [
        [8, 1, 3],
        [4, 0, 5],
        [7, 2, 6]
    ];

    var puzzleGoal = new eightPuzzle.PuzzleState(goalState);
    var puzzleStart = new eightPuzzle.PuzzleState(startState, null, puzzleGoal);
    ok(puzzleStart.isGoal(), "Puzzle at goal!");
});

test("Test default predicted cost", function() {
    var startState = [
        [0, 1, 3],
        [4, 2, 5],
        [7, 8, 6]
    ];

    var goalState = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];

    var puzzleGoal = new eightPuzzle.PuzzleState(goalState);
    var puzzleStart = new eightPuzzle.PuzzleState(startState, null, puzzleGoal);
    var puzzleLast = puzzleStart.slideDown();
    ok(puzzleLast.predictedCost() === 1, "Puzzle cost is 1");
});

test("Test misplaced tiles heuristic", function() {
    var startState = [
        [0, 1, 3],
        [4, 2, 5],
        [7, 8, 6]
    ];

    var goalState = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];

    var puzzleGoal = new eightPuzzle.PuzzleState(goalState);
    var puzzleStart = new eightPuzzle.PuzzleState(startState, null, puzzleGoal);
    puzzleStart.heuristic = eightPuzzle.misplacedTilesHeuristic;
    ok(puzzleStart.predictedCost() === 6, "Puzzle cost is correct");
});

test("Test manhattan distance heuristic", function() {
    var startState = [
        [0, 1, 3],
        [4, 2, 5],
        [7, 8, 6]
    ];

    var goalState = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];

    var puzzleGoal = new eightPuzzle.PuzzleState(goalState);
    var puzzleStart = new eightPuzzle.PuzzleState(startState, null, puzzleGoal);
    puzzleStart.heuristic = eightPuzzle.manhattanHeuristic;
    ok(puzzleStart.predictedCost() === 10, "Puzzle cost is correct");
});

test("Test greedy cost", function() {
    var startState = [
        [0, 1, 3],
        [4, 2, 5],
        [7, 8, 6]
    ];

    var goalState = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];

    var puzzleGoal = new eightPuzzle.PuzzleState(goalState);
    var puzzleStart = new eightPuzzle.PuzzleState(startState, null, puzzleGoal);
    var puzzleLast = puzzleStart.slideDown();
    var puzzleLast = puzzleLast.slideUp();
    puzzleLast.heuristic = eightPuzzle.manhattanHeuristic;
    puzzleLast.predictedCost = eightPuzzle.greedyCost;
    ok(puzzleLast.predictedCost() === 10, "Puzzle cost is correct");
});

test("Test uniform cost", function() {
    var startState = [
        [0, 1, 3],
        [4, 2, 5],
        [7, 8, 6]
    ];

    var goalState = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];

    var puzzleGoal = new eightPuzzle.PuzzleState(goalState);
    var puzzleStart = new eightPuzzle.PuzzleState(startState, null, puzzleGoal);
    var puzzleLast = puzzleStart.slideDown();
    var puzzleLast = puzzleLast.slideUp();
    puzzleLast.heuristic = eightPuzzle.manhattanHeuristic;
    puzzleLast.predictedCost = eightPuzzle.uniformCost;
    ok(puzzleLast.predictedCost() === 12, "Puzzle cost is correct");
});

test("Test PuzzleStateQueue", function() {
    var startState = [
        [1, 0, 3],
        [4, 2, 5],
        [7, 8, 6]
    ];

    var goalState = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];

    var puzzleGoal = new eightPuzzle.PuzzleState(goalState);
    var puzzleStart = new eightPuzzle.PuzzleState(startState, null, puzzleGoal);

    var puzzleDown = puzzleStart.slideDown();
    puzzleDown.heuristic = eightPuzzle.misplacedTilesHeuristic;

    var puzzleLeft = puzzleStart.slideLeft();
    puzzleLeft.heuristic = eightPuzzle.misplacedTilesHeuristic;

    var queue = new eightPuzzle.PuzzleStateQueue();

    ok(queue.empty() === true, "Queue is empty");

    queue.add(puzzleDown);
    queue.add(puzzleLeft);

    ok(queue.empty() === false, "Queue is not empty");
    ok(queue.size() === 2, "Queue size is 2");

    ok(queue.next().equals(puzzleLeft), "Puzzle Right has best cost!");
});
