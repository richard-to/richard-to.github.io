(function(window, undefined) {

    // Includes
    var BaseEntity = window.entity.BaseEntity;
    var StateMachine = window.util.StateMachine;
    var LocationTypes = window.LocationTypes;
    var WifesGlobalState = window.MinersWifeStates.WifesGlobalState;
    var DoHouseWork = window.MinersWifeStates.DoHouseWork;

    var MinersWife = function(id) {
        BaseEntity.call(this, id);
        this.location = LocationTypes.SHACK;
        this.stateMachine = new StateMachine(this);
        this.stateMachine.setCurrentState(new DoHouseWork());
        this.stateMachine.setGlobalState(new WifesGlobalState());
    };
    MinersWife.prototype = Object.create(BaseEntity.prototype);
    MinersWife.prototype.constructor = BaseEntity;

    MinersWife.prototype.update = function() {
        this.stateMachine.update();
        this.cooking = false;
    };

    MinersWife.prototype.handleMessage = function(msg) {
        return this.stateMachine.handleMessage(msg);
    }

    MinersWife.prototype.getFSM = function() {
        return this.stateMachine;
    };

    MinersWife.prototype.getLocation = function() {
        return this.location;
    };

    MinersWife.prototype.changeLocation = function(location) {
        this.location = location;
    };

    MinersWife.prototype.isCooking = function() {
        return this.cooking;
    };

    MinersWife.prototype.setCooking = function(yes) {
        this.cooking = yes;
    };
    window.MinersWife = MinersWife;
}(window));