define(function() {
    function Pathfinding() {
        this.target = null;
        this.path = null;
        this.pathIndex = 0;
    }

    Pathfinding.prototype.search = function(target) {
        var position = this.entity.getComponent('Transform');

        this.setTarget(target);
        if (this.target) {
            this.path = this.entity.field.search(position.x, position.y, this.target.x, this.target.y);
            this.pathIndex = 0;
        }
    };

    Pathfinding.prototype.move = function() {
        if (!this.path) return;

        var motor = this.entity.getComponent('MovementSystem');
        if (!motor.isMoving()) {
            var x = this.path[this.pathIndex].x;
            var y = this.path[this.pathIndex].y;
            motor.moveTo({ x: x, y: y });
        }
    };

    Pathfinding.prototype.isPathing = function() {
        return !!this.path;
    };

    Pathfinding.prototype.setTarget = function(target) {
        if (this.target) this.target.occupied = null;
        this.target = target;
        if (this.target) this.target.occupied = this.player;
    };

    Pathfinding.prototype.clearPath = function() {
        this.path = null;
        this.pathIndex = 0;
    };

    Pathfinding.prototype.onTargetReached = function() {
        this.pathIndex++;
        if (this.pathIndex >= this.path.length) {
            this.entity.broadcast('PathComplete');
        }
    };

    Pathfinding.prototype.onPathComplete = function() {
        this.clearPath();
    };

    return Pathfinding;
});