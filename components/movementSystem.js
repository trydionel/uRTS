define(function() {
    var EPSILON = 0.01;

    function MovementSystem(options) {
        options = options || {};
        this.speed = options.speed || 1;
        this.direction = { x: 0, y: 0 };
        this.target = null;
    }

    MovementSystem.prototype.isMoving = function() {
        return this.direction.x !== 0 && this.direction.y !== 0;
    };

    MovementSystem.prototype.move = function(direction) {
        this.direction = direction;
    };

    MovementSystem.prototype.moveTo = function(target) {
        var position = this.entity.getComponent('Transform');

        this.target = target;
        this.move({
            x: target.x - position.x,
            y: target.y - position.y
        });
    };

    MovementSystem.prototype.atTarget = function() {
        var position = this.entity.getComponent('Transform');
        //var distance = Math.sqrt(Math.pow(position.x - this.target.x, 2) + Math.pow(position.y - this.target.y, 2));
        return this.target &&
            Math.abs(this.target.x - position.x) <= 1 &&
            Math.abs(this.target.y - position.y) <= 1;
    };

    MovementSystem.prototype.update = function(dt) {
        var position = this.entity.getComponent('Transform');
        var x = position.x + this.direction.x;
        var y = position.y + this.direction.y;
        var z = this.entity.field.terrain[y][x] + 0.5;

        position.set(x, y, z);

        if (this.atTarget()) {
            this.target = null;
            this.move({ x: 0, y: 0, z: 0 });
            this.entity.broadcast('TargetReached');
        }
    };

    return MovementSystem;
});