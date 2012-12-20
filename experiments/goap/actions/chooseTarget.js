define(function(require) {

    var Action = require('experiments/goap/action');

    function ChooseTarget() {

    }

    ChooseTarget.prototype = Object.create(Action.prototype);

    ChooseTarget.prototype.preconditions = function() {
        return [];
    };

    ChooseTarget.prototype.postconditions = function() {
        return ['TargetChosen'];
    };

    ChooseTarget.prototype.update = function(entity, dt) {
        var storage = entity.getComponent('Storage');
        var target;

        if (storage.isFull()) {
            target = entity.player.base;
        } else {
            var terrain = entity.field.getComponent('Terrain');
            var position = entity.getComponent('Transform');
            target = terrain.nearbyResource(entity.player, position.x, position.y);
        }
        entity.memory['CurrentTarget'] = target;
        this.complete = true;
    };

    return ChooseTarget;
});