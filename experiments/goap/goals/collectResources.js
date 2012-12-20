define(function(require) {

    var Goal = require('experiments/goap/goal');

    function CollectResources() {

    }

    CollectResources.prototype = Object.create(Goal.prototype);

    CollectResources.prototype.relevance = function() {
        return 100;
    };

    CollectResources.prototype.preconditions = function() {
        return ['CollectingResources'];
    };

    return CollectResources;
});