define(function() {
    function WarriorAI() {
    }

    WarriorAI.prototype.update = function(entity, dt) {
        var position = this.entity.getComponent('Transform');
        var path     = this.entity.getComponent('Pathfinding');

        this.entity.player.clearFog(position.x, position.y, 3);

        if (path.isPathing()) {
            path.move();
        } else {
            this.explore();
        }
    };

    WarriorAI.prototype.explore = function() {
        var position = this.entity.getComponent('Transform');
        var path     = this.entity.getComponent('Pathfinding');

        var destX = position.x + Math.round(Math.random() * 10 - 5);
        var destY = position.y + Math.round(Math.random() * 10 - 5);
        path.path = this.entity.field.search(position.x, position.y, destX, destY);
    };

    return WarriorAI;
});
