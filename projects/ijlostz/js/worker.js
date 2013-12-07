var window = {};

importScripts('vendor/underscore.js');
importScripts('lib/ijlostz.js');
importScripts('lib/ijlostz.ga.js');

// Simulate Tetris moves using web worker. When finished return genotype
// with fitness value represented by final score.
var TetrisGA = window.TetrisGA;
self.addEventListener('message', function(e) {
    var data = e.data.data;
    var postMessage = self.postMessage;
    TetrisGA.simulateFitness(data.genotype, data.shapes, null, function(genotype) {
        postMessage({id: e.data.id, data: genotype});
    });
}, false);