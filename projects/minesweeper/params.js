// Porting tutorial code from http://www.ai-junkie.com/ann/evolved/nnt1.html
// Unfortunately I'm on a Mac and the code is developed for Windows machines.
// So just gonna do this in Javascript for simplicity.
(function(window, undefined) {
    var Params = {
        pi: Math.PI,
        halfPi: Math.PI/2,
        twoPi: Math.PI * 2,
        windowWidth: 400,
        windowHeight: 400,
        framesPerSecond: 0,
        numInputs: 0,
        numHidden: 0,
        neuronsPerHiddenLayer: 0,
        numOutputs: 0,
        activationResponse: 0,
        bias: 0,
        maxTurnRate: 0,
        maxSpeed: 0,
        sweeperScale: 0,
        numSweepers: 0,
        numMines: 0,
        numTicks: 0,
        mineScale: 0,
        crossoverRate: 0,
        mutationRate: 0,
        maxPerturbation: 0,
        numElite: 0,
        numCopiesElite: 0
    };

    var UserParams = {
        framesPerSecond: 60,
        numInputs: 4,
        numHidden: 1 ,
        neuronsPerHiddenLayer: 6,
        numOutputs: 2,
        activationResponse: 1,
        bias: -1,
        maxTurnRate: 0.3,
        maxSpeed: 2,
        sweeperScale: 5,
        numMines: 40,
        numSweepers: 30,
        numTicks: 2000,
        mineScale: 2,
        crossoverRate: 0.7,
        mutationRate: 0.1,
        maxPerturbation: 0.3,
        numElite: 4,
        numCopiesElite: 1
    };

    for (var key in UserParams) {
        if (Params[key] !== undefined) {
            Params[key] = UserParams[key];
        }
    }

    window.Params = Params;
}(window));