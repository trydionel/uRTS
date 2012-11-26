define(function(require) {
    var machina = require('machina');

    function WorkerAI() {
        var ai = this;

        this.target = null;
        this.fsm = new machina.Fsm({
            initialState: 'idle',
            states: {
                'idle': {
                    'update': function(entity) {
                        ai.search('resource');
                        if (!ai.target) {
                            ai.search('base');
                        }
                    }
                },
                'moving': {
                    'update': function(entity) {
                        var path = entity.getComponent('Pathfinding');

                        if (ai.atTarget()) {
                            this.transition('interacting');
                        } else {
                            path.move();
                        }
                    }
                },
                'interacting': {
                    'update': function(entity) {
                        var storage = entity.getComponent('Storage');

                        if (ai.target.tag === 'Resource') {
                            storage.consume(ai.target);
                        } else if (ai.target.tag === 'Base') {
                            storage.deposit(ai.target);
                        }
                    }
                }
            }
        });
    }

    WorkerAI.prototype.onStart = function() {
        this.terrain  = this.entity.field.getComponent('Terrain');
        this.position = this.entity.getComponent('Transform');
        this.path     = this.entity.getComponent('Pathfinding');
    };

    WorkerAI.prototype.onEmpty = function() {
        this.fsm.transition('idle');
    };

    WorkerAI.prototype.onFull = function() {
        this.search('base');
    };

    WorkerAI.prototype.onResourceExhausted = function(resource) {
        if (this.target === resource) {
            this.fsm.transition('idle');
        }
    };

    WorkerAI.prototype.search = function(tag) {
        var prevTarget = this.target;

        if (tag === 'resource') {
            this.target = this.terrain.nearbyResource(this.entity.player, this.position.x, this.position.y);
        } else if (tag === 'base') {
            this.target = this.entity.player.base;
        }

        if (this.target && this.target !== prevTarget) {
            this.path.search(this.target.getComponent('Transform'));
            if (this.target) {
                this.fsm.transition('moving');
            }
        }
    };

    WorkerAI.prototype.atTarget = function() {
        if (!this.target) return;

        var destination = this.target.getComponent('Transform');

        return Math.abs(destination.x - this.position.x) <= 1 &&
            Math.abs(destination.y - this.position.y) <= 1;
    };


    WorkerAI.prototype.fixedUpdate = function(dt) {
        this.fsm.handle('update', this.entity);
    };

    return WorkerAI;
});