define(function() {
    function WorkerAI() {
        this.target = null;
    }

    WorkerAI.prototype.onEmpty = function() {
        this.target = null;
    };

    WorkerAI.prototype.onResourceExhausted = function(resource) {
        if (this.target === resource) {
            this.target = null;
        }
    };

    WorkerAI.prototype.search = function(tag) {
        var position = this.entity.getComponent('Transform');
        var path     = this.entity.getComponent('Pathfinding');

        if (tag === 'resource') {
            this.target = this.entity.field.nearbyResource(this.entity.player, position.x, position.y);
        } else if (tag === 'base') {
            this.target = this.entity.player.base;
        }

        if (this.target) {
            path.search(this.target.getComponent('Transform'));
        }
    };

    WorkerAI.prototype.atTarget = function() {
        if (!this.target) return;

        var position = this.entity.getComponent('Transform');
        var destination = this.target.getComponent('Transform');

        return Math.abs(destination.x - position.x) <= 1 &&
            Math.abs(destination.y - position.y) <= 1;
    };


    WorkerAI.prototype.update = function(entity, dt) {
        var path    = this.entity.getComponent('Pathfinding');
        var storage = this.entity.getComponent('Storage');

        if (this.atTarget()) {
            path.clearPath();

            if (this.target.tag === 'Base') {
                storage.deposit(this.target);
            } else if (this.target.tag === 'Resource') {
                if (storage.isFull()) {
                    this.search('base');
                } else {
                    storage.consume(this.target);
                }
            }
        } else if (path.isPathing()) {
            path.move();
        } else {
            this.search('resource');

            // Return home if no resources left
            if (!this.target) {
                this.search('base');
            }
        }
    };

    return WorkerAI;
});