define(function(require) {
    var Mediator = require('mediator');
    var _ = require('underscore');

    function EventBus() {
        Mediator.apply(this, arguments);
        this.queue = [];
        this.immediateMode = false;
    }

    var Surrogate = function() { this.constructor = EventBus };
    Surrogate.prototype = Mediator.prototype;
    EventBus.prototype = new Surrogate();

    var publish = EventBus.prototype.publish;
    EventBus.prototype.publish = function() {
        if (this.immediateMode) {
            publish.apply(this, arguments);
        } else {
            this.queue.push(arguments);
        }
    };

    EventBus.prototype.update = function(dt) {
        var event;
        while (event = this.queue.pop()) {
            publish.apply(this, event);
        }
    };

    var instance = new EventBus();
    return instance;
});