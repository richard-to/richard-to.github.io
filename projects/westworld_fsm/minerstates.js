(function(window, undefined) {

    // Includes
    var LocationTypes = window.LocationTypes;
    var getNameOfEntity = window.helper.getNameOfEntity;
    var EntityName = window.helper.EntityName;
    var MsgType = window.helper.MsgType;

    // Constants
    var COMFORT_LEVEL = window.helper.COMFORT_LEVEL;
    var MAX_NUGGETS = window.helper.MAX_NUGGETS;
    var THIRST_LEVEL = window.helper.THIRST_LEVEL;
    var TIREDNESS_THRESHOLD = window.helper.TIREDNESS_THRESHOLD;

    var SEND_MSG_IMMEDIATELY = window.messaging.SEND_MSG_IMMEDIATELY;
    var NO_ADDITIONAL_INFO = window.messaging.NO_ADDITIONAL_INFO;

    var dispatcher = window.helper.dispatcher;

    // Namespace
    var MinerStates = {};
    window.MinerStates = MinerStates;


    // Go Home and Sleep State
    var GoHomeAndSleepTilRested = function() {};
    GoHomeAndSleepTilRested.prototype.enter = function(miner) {
        if (miner.getLocation() != LocationTypes.SHACK) {
            console.log(getNameOfEntity(miner.getId()) + ": Walking to home");
            miner.changeLocation(LocationTypes.SHACK);
            dispatcher.dispatch(
                SEND_MSG_IMMEDIATELY,
                miner.getId(),
                EntityName.ELSA,
                NO_ADDITIONAL_INFO);
        }
    };
    GoHomeAndSleepTilRested.prototype.execute = function(miner) {
        if (!miner.fatigued()) {
            console.log(getNameOfEntity(miner.getId())
                + ": What a God darn fantastic nap! Time to find more gold");
            miner.getFSM().changeState(new EnterMineAndDigForNugget());
        } else {
            miner.decreaseFatigue();
            console.log(getNameOfEntity(miner.getId()) + ": ZZZZZZ....");
        }
    };
    GoHomeAndSleepTilRested.prototype.exit = function(miner) {
        console.log(getNameOfEntity(miner.getId()) + ": Leaving the house");
    };
    GoHomeAndSleepTilRested.prototype.onMessage = function(miner, msg) {
        switch (msg.msg) {
            case MsgType.STEW_READY:
                console.log(getNameOfEntity(miner.getId()) + ": Coming home for stew!");
                miner.getFSM().changeState(new EatStew());
                return true;
        };
        return false;
    };


    MinerStates.GoHomeAndSleepTilRested = GoHomeAndSleepTilRested;


    // Visit Bank State
    var VisitBankAndDepositGold = function() {};
    VisitBankAndDepositGold.prototype.enter = function(miner) {
        if (miner.getLocation() != LocationTypes.BANK) {
            console.log(getNameOfEntity(miner.getId()) + ": Walking to the bank");
        }
        miner.changeLocation(LocationTypes.BANK);
    };
    VisitBankAndDepositGold.prototype.execute = function(miner) {
        miner.addToWealth(miner.getGoldCarried());
        miner.setGoldCarried(0);

        console.log(getNameOfEntity(miner.getId())
            + ": Depositing gold. Told savings now: "
            + miner.wealth());

        if (miner.wealth() >= COMFORT_LEVEL) {
            console.log(getNameOfEntity(miner.getId())
                + ": WooHoo! Rich enough for now. Back home to mah li'lle lady");
            miner.getFSM().changeState(new GoHomeAndSleepTilRested());
        } else {
            miner.getFSM().changeState(new EnterMineAndDigForNugget());
        }
    };
    VisitBankAndDepositGold.prototype.exit = function(miner) {
        console.log(getNameOfEntity(miner.getId()) + ": Leaving the bank");
    };
    VisitBankAndDepositGold.prototype.onMessage = function(miner, msg) {
        return false;
    };

    MinerStates.VisitBankAndDepositGold = VisitBankAndDepositGold;


    // Enter Mine and Dig for Nugget State
    var EnterMineAndDigForNugget = function() {};
    EnterMineAndDigForNugget.prototype.enter = function(miner) {
        if (miner.getLocation() != LocationTypes.GOLDMINE) {
            console.log(getNameOfEntity(miner.getId()) + ": Walking to the goldmine");
        }
        miner.changeLocation(LocationTypes.GOLDMINE);
    };
    EnterMineAndDigForNugget.prototype.execute = function(miner) {
        miner.addToGoldCarried(1);
        miner.increaseFatigue();
        console.log(getNameOfEntity(miner.getId()) + ": Picking up a nugget");

        if (miner.pocketsFull()) {
            miner.getFSM().changeState(new VisitBankAndDepositGold());
        }

        if (miner.thirsty()) {
            miner.getFSM().changeState(new QuenchThirst());
        }
    };
    EnterMineAndDigForNugget.prototype.exit = function(miner) {
        console.log(getNameOfEntity(miner.getId()) + ": Leaving the gold mine");
    };
    EnterMineAndDigForNugget.prototype.onMessage = function(miner, msg) {
        return false;
    };
    MinerStates.EnterMineAndDigForNugget = EnterMineAndDigForNugget;


    // Quench Thirst State
    var QuenchThirst = function() {

    };
    QuenchThirst.prototype.enter = function(miner) {
        if (miner.getLocation() != LocationTypes.SALOON) {
            miner.changeLocation(LocationTypes.SALOON);
            console.log(getNameOfEntity(miner.getId()) + ": Walking to the saloon");
        }
    };
    QuenchThirst.prototype.execute = function(miner) {
        miner.buyAndDrinkWhiskey();
        console.log(getNameOfEntity(miner.getId()) + ": That's mighty good whiskey");
        miner.getFSM().changeState(new EnterMineAndDigForNugget());
    };
    QuenchThirst.prototype.exit = function(miner) {
        console.log(getNameOfEntity(miner.getId()) + ": Leaving the saloon");
    };
    QuenchThirst.prototype.onMessage = function(miner, msg) {
        return false;
    };
    MinerStates.QuenchThirst = QuenchThirst;


    // Eat Stew State.
    var EatStew = function() {};
    EatStew.prototype.enter = function(miner) {
        console.log(getNameOfEntity(miner.getId()) + ": Smells really good Elsa!");
    };
    EatStew.prototype.execute = function(miner) {
        console.log(getNameOfEntity(miner.getId()) + ": Tastes really good Elsa!");
        miner.getFSM().revertToPreviousState();
    };
    EatStew.prototype.exit = function(miner) {
        console.log(getNameOfEntity(miner.getId()) + ": Thanks for stew! Back to whatever!");
    };
    EatStew.prototype.onMessage = function(miner, msg) {
        return false;
    };
    MinerStates.EatStew = EatStew;
}(window));