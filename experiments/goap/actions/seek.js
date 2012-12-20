define(function(require) {

    var Action = require('experiments/goap/action');

    function Seek() {
        Action.apply(this, arguments);
    }

    Seek.prototype = Object.create(Action.prototype);

    Seek.prototype.preconditions = function() {
        return ['TargetChosen'];
    };

    Seek.prototype.postconditions = function() {
        return ['AtTarget'];
    };

    // Seek is satisfied if the entity in question can find a path to the
    // desired destination.
    //
    Seek.prototype.preconditionsSatisfied = function(world) {
        return true;
    };

    Seek.prototype.postconditionsSatisfied = function(world) {
        return true;
    };

    Seek.prototype.update = function(entity, dt) {
        var path = entity.getComponent('Pathfinding');
        var target = entity.memory['CurrentTarget'];

        if (path.target === target.getComponent('Transform') && path.isComplete()) {
            this.complete = true;
        } else if (!path.isPathing()) {
            path.search(target.getComponent('Transform'));
        } else {
            path.move();
        }
    };

    return Seek;
});