// Not the best filename, but let's go with this for now.
(function(window, undefined) {

    // Includes
    var EntityManager = window.entity.EntityManager;
    var MessageDispatcher = window.messaging.MessageDispatcher;


    // Constants
    // TODO(richard-to): Not the best place to put this...
    var COMFORT_LEVEL = 5;
    var MAX_NUGGETS = 3;
    var THIRST_LEVEL = 5;
    var TIREDNESS_THRESHOLD = 5;


    var EntityName = {
        MINER_BOB: 0,
        ELSA: 1
    };

    // Why not have get name method on miner object?
    var getNameOfEntity = function(n) {
        switch (n) {
            case EntityName.MINER_BOB:
                return "Miner Bob";
            case EntityName.ELSA:
                return "Elsa";
            default:
                return "Unknown";
        }
    };

    var MsgType = {
        HONEY_HOME: 0,
        STEW_READY: 1
    };

    var msgToString = function(n) {
        switch (n) {
            case MsgType.HONEY_HOME:
                return "HoneyHome";
            case MsgType.STEW_READY:
                return "StewReady";
            default:
                return "Not Recognized";
        }
    };

    // TODO(richard-to): Not a big fan of these global objects...
    var entityManager = new EntityManager();
    var dispatcher = new MessageDispatcher(entityManager);

    window.helper = {
        COMFORT_LEVEL: COMFORT_LEVEL,
        MAX_NUGGETS: MAX_NUGGETS,
        THIRST_LEVEL: THIRST_LEVEL,
        TIREDNESS_THRESHOLD: TIREDNESS_THRESHOLD,
        entityManager: entityManager,
        dispatcher: dispatcher,
        EntityName: EntityName,
        getNameOfEntity: getNameOfEntity,
        MsgType: MsgType,
        msgToString: msgToString
    };
}(window));