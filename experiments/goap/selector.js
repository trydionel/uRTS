define(function(require) {

    var _ = require('underscore');

    function Selector() {
        this.goals = [];
    }

    Selector.prototype.addGoal = function(goal) {
        this.goals.push(goal);
    };

    Selector.prototype.selectGoal = function() {
        return _.max(this.goals, function(goal) {
            return goal.relevance();
        });
    };

    return Selector;
});