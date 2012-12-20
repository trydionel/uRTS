define(function(require) {

    var _ = require('underscore');

    function Planner() {
        this.actions = [];
    }

    Planner.prototype.addAction = function(action) {
        this.actions.push(action);
    };

    Planner.prototype.generatePlan = function(goal) {
        var preconditions = goal.preconditions();
        var precondition, action, postconditions, foundAction, plan = [];

        while (preconditions.length) {
            precondition = preconditions[0];
            foundAction = false;

            for (var i = 0, _len = this.actions.length; i < _len; i++) {
                action = this.actions[i];
                postconditions = action.postconditions();
                if (_.include(postconditions, precondition)) {
                    preconditions.shift();
                    preconditions.unshift.apply(preconditions, action.preconditions());
                    plan.unshift(action);
                    foundAction = true;
                    break;
                }
            }

            // Couldn't satisfy condition. Abork abork.
            if (!foundAction) {
                plan = [];
                break;
            }
        }

        return plan;
    };

    return Planner;
});