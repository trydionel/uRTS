define(function(require) {

    var EventBus = require('core/eventBus');

    function Scene(game) {
        this.game = game;
        this.entities = [];
        this.callbacks = [];
        this.isLoaded = false;

        EventBus.subscribe('entity', this.delegateEvent.bind(this));
    }

    Scene.prototype.addEntity = function(entity) {
        EventBus.publish('AddEntity', entity);
        this.entities.push(entity);

        // Ensure the 'Start' event is triggered on new entities, even after the
        // initial loading phase has completed.
        if (this.isLoaded) entity.broadcast('Start');
    };

    Scene.prototype.removeEntity = function(entity) {
        var index = this.entities.indexOf(entity);
        if (index != -1) {
            this.entities.splice(index, 1);
            EventBus.publish('RemoveEntity', entity);
        }
    };

    Scene.prototype.findEntity = function(query) {
        return this.entities.filter(function(entity) {
            // Allow coercion of ID, but strictly check other attributes
            return entity.id == query || entity.name === query || entity.tag === query;
        });
    };

    Scene.prototype.delegateEvent = function(event, channel) {
        console.log("Delegating event", arguments);
        var query = event[0];
        var message = event[1];
        var data = event[2];

        var target = this.findEntity(query);
        for (var i = 0; i < target.length; i++) {
            var entity = target[i];
            console.log("Fowarding", message, "to", entity, "with args", data);
            entity.broadcast(message, data);
        }
    };

    Scene.prototype.fixedUpdate = function(dt) {
        var entity;
        for (var i in this.entities) {
            entity = this.entities[i];
            entity.fixedUpdate(dt);
        }
    };

    Scene.prototype.update = function(dt, elapsed) {
        var entity;
        for (var i in this.entities) {
            entity = this.entities[i];
            entity.update(dt, elapsed);
        }
    };

    Scene.prototype.load = function() {};

    Scene.prototype.loaded = function() {
        var scene = this;
        this.isLoaded = true;
        this.callbacks.forEach(function(cb) { cb(scene); });
    };

    Scene.prototype.onLoad = function(cb) {
        if (cb instanceof Function) {
            this.callbacks.push(cb);
        }
    };

    return Scene;
});