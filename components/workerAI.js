define(function(require) {
    var machina = require('lib/machina');

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

                        path.move();
                        if (ai.atTarget()) {
                            this.transition('interacting');
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
        var position = this.entity.getComponent('Transform');
        var path     = this.entity.getComponent('Pathfinding');
        var prevTarget = this.target;

        if (tag === 'resource') {
            this.target = this.entity.field.nearbyResource(this.entity.player, position.x, position.y);
        } else if (tag === 'base') {
            this.target = this.entity.player.base;
        }

        if (this.target && this.target !== prevTarget) {
            path.search(this.target.getComponent('Transform'));
            this.fsm.transition('moving');
        }
    };

    WorkerAI.prototype.atTarget = function() {
        if (!this.target) return;

        var position = this.entity.getComponent('Transform');
        var destination = this.target.getComponent('Transform');

        return Math.abs(destination.x - position.x) <= 1 &&
            Math.abs(destination.y - position.y) <= 1;
    };


    WorkerAI.prototype.update = function(dt) {
        this.fsm.handle('update', this.entity);
    };

    return WorkerAI;
});