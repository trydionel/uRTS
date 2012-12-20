define(function(require) {

    var Action = require('experiments/goap/action');

    function Deposit() {
    }

    Deposit.prototype = Object.create(Action.prototype);

    Deposit.prototype.preconditions = function() {
        return ['AtTarget', 'StorageFull'];
    };

    Deposit.prototype.postconditions = function() {
        return ['CollectingResources'];
    };

    Deposit.prototype.update = function(entity, dt) {
        var storage = entity.getComponent('Storage');
        var target = entity.memory['CurrentTarget'];

        if (storage.isEmpty()) {
            this.complete = true;
        } else {
            storage.deposit(target);
        }
    };

    return Deposit;
});