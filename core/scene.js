define(function(require) {

    function Scene(game) {
        this.game = game;
        this.entities = [];
        this.callbacks = [];
    }

    Scene.prototype.addEntity = function(entity) {
        this.entities.push(entity);

        var appearance = entity.getComponent('Appearance');
        if (appearance) this.display.add(appearance.mesh);

        var camera = entity.getComponent('Camera');
        if (camera) this.display.add(camera.camera);
    };

    Scene.prototype.removeEntity = function(entity) {
        var index = this.entities.indexOf(entity);
        if (index != -1) {
            this.entities.splice(index, 1);

            var appearance = entity.getComponent('Appearance');
            if (appearance) this.display.remove(appearance.mesh);

            var camera = entity.getComponent('Camera');
            if (camera) this.display.remove(camera.camera);
        }
    };

    Scene.prototype.load = function() {};

    Scene.prototype.loaded = function() {
        var scene = this;
        this.callbacks.forEach(function(cb) { cb(scene); });
    };

    Scene.prototype.onLoad = function(cb) {
        if (cb instanceof Function) {
            this.callbacks.push(cb);
        }
    };

    return Scene;
});