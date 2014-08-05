(function(window, undefined) {
    // Includes
    var EntityName = window.helper.EntityName;
    var Miner = window.Miner;
    var MinersWife = window.MinersWife;

    // Singleton Type objects
    var entityManager = window.helper.entityManager;
    var dispatcher = window.helper.dispatcher;

    // Basic Settings
    var updateInterval = 800;
    var iterations = 30;

    var miner = new Miner(EntityName.MINER_BOB);
    var elsa = new MinersWife(EntityName.ELSA);

    entityManager.register(miner);
    entityManager.register(elsa);

    // Game Loop
    var i = 0;
    var intervalId = 0;
    intervalId = setInterval(function() {
        miner.update();
        elsa.update();
        dispatcher.dispatchDelayedMessages();
        i++;
        if (i == iterations) {
            clearInterval(intervalId);
        }
    }, updateInterval);
}(window));