(function(window, undefined) {

    // Includes
    var LocationTypes = window.LocationTypes;
    var getNameOfEntity = window.helper.getNameOfEntity;
    var MsgType = window.helper.MsgType;
    var EntityName = window.helper.EntityName;

    var SEND_MSG_IMMEDIATELY = window.messaging.SEND_MSG_IMMEDIATELY;
    var NO_ADDITIONAL_INFO = window.messaging.NO_ADDITIONAL_INFO;

    var dispatcher = window.helper.dispatcher;

    // Namespace
    var MinersWifeStates = {};
    window.MinersWifeStates = MinersWifeStates;

    // Visit Bathroom State
    var VisitBathroom = function() {};
    VisitBathroom.prototype.enter = function(wife) {
        console.log(getNameOfEntity(wife.getId()) + ": Walking to the can");
    };
    VisitBathroom.prototype.execute = function(wife) {
        console.log(getNameOfEntity(wife.getId()) + ": Sweet relief.");
        wife.getFSM().revertToPreviousState();
    };
    VisitBathroom.prototype.exit = function(wife) {
        console.log(getNameOfEntity(wife.getId()) + ": Leaving the can.");
    };
    VisitBathroom.prototype.onMessage = function(wife, msg) {
        return false;
    };
    MinersWifeStates.VisitBathroom = VisitBathroom;


    // Do Housework State
    var DoHouseWork = function() {};
    DoHouseWork.prototype.enter = function(wife) {};
    DoHouseWork.prototype.execute = function(wife) {
        // TODO(richard-to): Make this a utility called RandInt() ?
        var value = Math.floor(Math.random() * 2);
        switch (value) {
            case 0:
                console.log(getNameOfEntity(wife.getId()) + ": Mopping the floor");
                break;
            case 1:
                console.log(getNameOfEntity(wife.getId()) + ": Washing the dishes");
                break;
            case 2:
                console.log(getNameOfEntity(wife.getId()) + ": Making the bed");
                break;
        }
    };
    DoHouseWork.prototype.exit = function(wife) {};
    DoHouseWork.prototype.onMessage = function(wife, msg) {
        return false;
    };
    MinersWifeStates.DoHouseWork = DoHouseWork;


    // Cook Stew State
    var CookStew = function() {};
    CookStew.prototype.enter = function(wife) {
        if (!wife.isCooking()) {
            console.log(getNameOfEntity(wife.getId()) + ": Putting stew in oven");
            dispatcher.dispatch(
                1500,
                wife.getId(),
                wife.getId(),
                MsgType.STEW_READY);
            wife.setCooking(true);
        }
    };
    CookStew.prototype.execute = function(wife) {
        console.log(getNameOfEntity(wife.getId()) + ": Fussing over food");
    };
    CookStew.prototype.exit = function(wife) {
        console.log(getNameOfEntity(wife.getId()) + ": Putting Stew on tables");
    };
    CookStew.prototype.onMessage = function(wife, msg) {
        switch (msg.msg) {
            case MsgType.STEW_READY:
            console.log(getNameOfEntity(wife.getId()) + ": Stew's Ready!");
            dispatcher.dispatch(
                SEND_MSG_IMMEDIATELY,
                wife.getId(),
                EntityName.MINER_BOB,
                MsgType.STEW_READY
            );
            wife.setCooking(false);
            wife.getFSM().changeState(new DoHouseWork());
        };
        return false;
    };
    MinersWifeStates.CookStew = CookStew;


    // Global Wife State
    var WifesGlobalState = function() {};
    WifesGlobalState.prototype.enter = function(wife) {};
    WifesGlobalState.prototype.execute = function(wife) {
        if (Math.random() < 0.1) {
            wife.getFSM().changeState(new VisitBathroom());
        }
    };
    WifesGlobalState.prototype.exit = function(wife) {};
    WifesGlobalState.prototype.onMessage = function(wife, msg) {
        switch (msg.msg) {
            case MsgType.HONEY_HOME:
                console.log(getNameOfEntity(wife.getId()) + ": Hi Honey. Let me make stew!");
                wife.getFSM().changeState(new CookStew());
                return true;
        };
        return false;
    };
    MinersWifeStates.WifesGlobalState = WifesGlobalState;

}(window));