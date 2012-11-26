define(function() {
    function WarriorAI() {
    }

    WarriorAI.prototype.onStart = function() {
        this.position = this.entity.getComponent('Transform');
        this.path     = this.entity.getComponent('Pathfinding');
    };

    WarriorAI.prototype.fixedUpdate = function(entity, dt) {
        this.entity.player.clearFog(this.position.x, this.position.y, 3);

        if (this.path.isPathing()) {
            this.path.move();
        } else {
            this.explore();
        }
    };

    WarriorAI.prototype.explore = function() {
        var destX = this.position.x + Math.round(Math.random() * 10 - 5);
        var destY = this.position.y + Math.round(Math.random() * 10 - 5);
        this.path.search({ x: destX, y: destY });
    };

    return WarriorAI;
});
