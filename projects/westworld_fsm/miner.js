(function(window, undefined) {

    // Includes
    var BaseEntity = window.entity.BaseEntity;
    var StateMachine = window.util.StateMachine;
    var LocationTypes = window.LocationTypes;
    var GoHomeAndSleepTilRested = window.MinerStates.GoHomeAndSleepTilRested;

    // Constants
    var COMFORT_LEVEL = window.helper.COMFORT_LEVEL;
    var MAX_NUGGETS = window.helper.MAX_NUGGETS;
    var THIRST_LEVEL = window.helper.THIRST_LEVEL;
    var TIREDNESS_THRESHOLD = window.helper.TIREDNESS_THRESHOLD;


    var Miner = function(id) {
        BaseEntity.call(this, id);

        this.stateMachine = new StateMachine(this);
        this.stateMachine.setCurrentState(new GoHomeAndSleepTilRested());
        this.locationType = LocationTypes.SHACK;
        this.goldCarried = 0;
        this.moneyInBank = 0;
        this.thirst = 0;
        this.fatigue = 0;
    };
    Miner.prototype = Object.create(BaseEntity.prototype);
    Miner.prototype.constructor = BaseEntity;

    Miner.prototype.getFSM = function() {
        return this.stateMachine;
    };

    Miner.prototype.handleMessage = function(msg) {
        return this.stateMachine.handleMessage(msg);
    }

    Miner.prototype.update = function() {
        this.thirst += 1;
        this.stateMachine.update();
    };

    Miner.prototype.getLocation = function() {
        return this.locationType;
    };

    Miner.prototype.changeLocation = function(location) {
        this.locationType = location;
    };

    Miner.prototype.getGoldCarried = function() {
        return this.goldCarried;
    };

    Miner.prototype.addToGoldCarried = function(gold) {
        this.goldCarried += gold;
        if (this.goldCarried < 0) {
            this.goldCarried = 0;
        }
    };

    Miner.prototype.setGoldCarried = function(gold) {
        this.goldCarried = gold;
    };

    Miner.prototype.pocketsFull = function() {
        return this.goldCarried >= MAX_NUGGETS;
    };

    Miner.prototype.fatigued = function() {
        return this.fatigue >= TIREDNESS_THRESHOLD;
    };

    Miner.prototype.decreaseFatigue = function() {
        this.fatigue -= 1;
    };

    Miner.prototype.increaseFatigue = function() {
        this.fatigue += 1;
    };

    Miner.prototype.wealth = function() {
        return this.moneyInBank;
    };

    Miner.prototype.setWealth = function(money) {
        this.moneyInBank = money;
    };

    Miner.prototype.addToWealth = function(money) {
        this.moneyInBank += money;
        if (this.moneyInBank < 0) {
            this.moneyInBank = 0;
        }
    };

    Miner.prototype.thirsty = function() {
        return this.thirst >= THIRST_LEVEL;
    };

    Miner.prototype.buyAndDrinkWhiskey = function() {
        this.thirst = 0;
        this.moneyInBank -= 2;
    };

    window.Miner = Miner;

}(window));