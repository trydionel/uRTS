define(function(require) {

    function Action() {
        this.complete = false;
        this.cost = 0;
    }

    Action.prototype.preconditions = function() {
        return [];
    };

    Action.prototype.postconditions = function() {
        return [];
    };

    Action.prototype.preconditionsSatisfied = function() { };
    Action.prototype.postconditionsSatisfied = function() { };
    Action.prototype.update = function(dt) { };

    return Action;
});