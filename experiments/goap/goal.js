define(function(require) {
    function Goal() {
    }

    Goal.prototype.relevance = function() {
      return 0;
    };

    Goal.prototype.preconditions = function() {
        return [];
    };

    return Goal;
});