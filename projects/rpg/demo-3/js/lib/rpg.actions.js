/** @jsx React.DOM */

// TODO(richard-to): This is a rough prototype of how this could work
(function(window, undefined) {
    var problems = {};
    var actions = {};

    var Addition = function(min, max) {
        var min = min || 0;
        var max = max || 20;
        var num1 =  Math.floor(Math.random() * max);
        var num2 = Math.floor(Math.random() * max);
        this.instructions = "Add the following numbers";
        this.problem = {
            num1: num1,
            num2: num2,
            answer: num1 + num2,
            display: num1 + " + " + num2 + " = "
        };
    };

    Addition.prototype.validate = function(answer) {
        return (answer == this.problem.answer);
    };
    problems.Addition = Addition;

    var Subtraction = function(min, max) {
        var min = min || 0;
        var max = max || 20;
        var num1 =  Math.floor(Math.random() * max);
        var num2 = Math.floor(Math.random() * max);
        this.instructions = "Subtract the following numbers";
        this.problem = {
            num1: num1,
            num2: num2,
            answer: num1 - num2,
            display: num1 + " - " + num2 + " = "
        };
    };

    Subtraction.prototype.validate = function(answer) {
        return (answer == this.problem.answer);
    };
    problems.Subtraction = Subtraction

    var ProblemSet = function(problems, number) {
        this.problems = problems;
        this.number = number;
        this.correct = 0;
        this.attempted = 0;
        this.set = [];
        this.currentProblem = null;
        for (var i = 0; i < this.number; i++) {
            this.set.push(new this.problems[Math.floor(Math.random() * this.problems.length)]());
        }
    };

    ProblemSet.prototype.empty = function() {
        return (this.set.length == 0);
    };

    ProblemSet.prototype.nextProblem = function() {
        this.currentProblem = this.set.shift();
        this.attempted += 1;
    };

    ProblemSet.prototype.instructions = function() {
        return this.currentProblem.instructions;
    };

    ProblemSet.prototype.display = function() {
        return this.currentProblem.problem.display;
    };

    ProblemSet.prototype.validate = function(answer) {
        if (this.currentProblem.validate(answer)) {
            this.correct += 1;
        }
    };
    problems.ProblemSet = ProblemSet;


    var Strike = function(options) {
        this.attr = {
            name: 'Strike',
            description: 'A very powerful attack that requires perfection to pull off. To perform this move, solve 3 addition problems.',
            lvl: 1,
            att: 15,
            sp: 0,
            numProblems: 3
        };
        _.extend(this.attr, options);
    };

    Strike.prototype.calcAttack = function(problemSet) {
        if (problemSet.correct == problemSet.attempted) {
            return this.attr.att;
        } else {
            return 0;
        }
    };

    Strike.prototype.select = function() {
        return new ProblemSet([Addition], this.attr.numProblems);
    };
    actions.Strike = Strike;


    var Slash = function(options) {
        this.attr = {
            name: 'Slash',
            description: 'This swift attack can land multiple hits if done perfectly. To perform this move, solve 3 subtraction problems.',
            lvl: 1,
            att: 5,
            sp: 0,
            numProblems: 3
        };
    };

    Slash.prototype.calcAttack = function(problemSet) {
        return this.attr.att * problemSet.correct;
    };

    Slash.prototype.select = function() {
        return new ProblemSet([Subtraction], this.attr.numProblems);
    };
    actions.Slash = Slash;


    if (window.rpg === undefined) {
        window.rpg = {};
    }
    window.rpg.actions = actions;
    window.rpg.problems = problems;
}(window));