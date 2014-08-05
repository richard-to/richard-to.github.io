(function(window, undefined) {

    var PriorityQueue = window.util.PriorityQueue;

    var SMALLEST_DELAY = 0.25;
    var SEND_MSG_IMMEDIATELY = 0.0;
    var NO_ADDITIONAL_INFO = 0;

    // Telegrams are messages sent to entities in the game.
    // Telgrams are delivered by Message Dispatcher objects.
    //
    // Time is described in milliseconds since 1970 - new Date().getTime()
    // sender and receiver are ids for entities. Actually entities not passed
    // Info is option data to pass to entity
    var Telegram = function(time, sender, receiver, msg, info) {
        this.dispatchTime = time;
        this.sender = sender;
        this.receiver = receiver;
        this.msg = msg;
        this.info = info;
    };

    Telegram.prototype.equals = function(t2) {
        return ((Math.abs(this.dispatchTime - t2.dispatchTime) < SMALLEST_DELAY) &&
            (this.sender == t2.sender) &&
            (this.receiver == t2.receiver) &&
            (this.msg == t2.msg));
    };

    Telegram.prototype.lt = function(t2) {
        if (this.equals(t2)) {
            return false;
        } else {
            return (this.dispatchTime < t2.dispatchTime);
        }
    };

    Telegram.prototype.gt = function(t2) {
        if (this.equals(t2)) {
            return false;
        } else {
            return (this.dispatchTime > t2.dispatchTime);
        }
    };

    Telegram.prototype.log = function() {
        console.log(
            "Time: " + this.dispatchTime +
            " Sender: " + this.sender +
            " Receiver: "  + this.receiver +
            " Msg: " + this.msg
        );
    };

    // Comparator function used by Priority Queue to order
    // telgrams by time. Lowest to Highest
    var compareTelegramTimes = function(t1, t2) {
        if (t1.gt(t2)) {
            return 1;
        } else if (t1.lt(t2)) {
            return -1;
        } else {
            return 0;
        }
    };

    // The message dispatcher is responsible for sending messages
    // to entities.
    //
    // Seems to act kind of like a mediator. Or I guess more like an
    // event based system?
    //
    // EntityMgr looks up references to entities based on entity id
    var MessageDispatcher = function(entityMgr) {
        this.priorityQueue = new PriorityQueue(compareTelegramTimes);
        this.entityMgr = entityMgr;
    };

    // Send message to receiver to handle.
    // TODO(richard-to): Maybe change the name here. Similar to dispatch
    MessageDispatcher.prototype.discharge = function(entityReceiver, telegram) {
        if (!entityReceiver.handleMessage(telegram)) {
            console.log("Message not handled");
        }
    };

    MessageDispatcher.prototype.dispatch = function(delay, sender, receiver, msg, info) {
        var entitySender = this.entityMgr.getById(sender);
        var entityReceiver = this.entityMgr.getById(receiver);

        if (entityReceiver == null) {
            console.log("Receiver with id of " + receiver + " not found!");
            return;
        }

        var telegram = new Telegram(SEND_MSG_IMMEDIATELY, sender, receiver, msg, info);

        if (delay <= SEND_MSG_IMMEDIATELY) {
            this.discharge(entityReceiver, telegram);
        } else {
            var time = new Date().getTime();
            telegram.dispatchTime = time + delay;
            this.priorityQueue.insert(telegram);
        }
    };

    MessageDispatcher.prototype.dispatchDelayedMessages = function() {
        var time = new Date().getTime();
        while (!this.priorityQueue.empty() &&
            (this.priorityQueue.peek().dispatchTime < time) &&
            (this.priorityQueue.peek().dispatchTime > 0)) {
            var telegram = this.priorityQueue.peek();
            var entityReceiver = this.entityMgr.getById(telegram.receiver);
            this.discharge(entityReceiver, telegram);
            this.priorityQueue.remove();
        }
    };

    window.messaging = {
        MessageDispatcher: MessageDispatcher,
        SEND_MSG_IMMEDIATELY: SEND_MSG_IMMEDIATELY,
        NO_ADDITIONAL_INFO: NO_ADDITIONAL_INFO
    };
}(window));