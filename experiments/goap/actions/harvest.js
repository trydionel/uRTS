define(function(require) {

    var Action = require('experiments/goap/action');

    function Harvest() {

    }

    Harvest.prototype = Object.create(Action.prototype);

    Harvest.prototype.preconditions = function() {
        return ['AtTarget'];
    };

    Harvest.prototype.postconditions = function() {
        return ['StorageFull'];
    };

    Harvest.prototype.update = function(entity, dt) {
        var storage = entity.getComponent('Storage');
        var resource = entity.memory['CurrentTarget'];

        if (storage.isFull()) {
            this.complete = true;
        } else {
            storage.consume(resource);
        }
    };

    return Harvest;
});