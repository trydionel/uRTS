define(function(require) {
    var _ = require('underscore');
    var THREE = require('THREE');
    var EventBus = require('core/eventBus');

    function InputManager() {
        this.listeners = [];
        this.observed = {};

        // Mouse handling. Probably need to extract this to new object...
        //
        this.clicked = false;
        this.position = { screenX: 0, screenY: 0, worldX: 0, worldY: 0 };
        this.projector = new THREE.Projector();
        this.camera = null;
        this.width = 1;
        this.height = 1;

        EventBus.subscribe('CameraLoaded', function(camera) {
            this.camera = camera.camera;
        }.bind(this));
    }

    InputManager.prototype.bind = function(source, event, method) {
        method = method || event;

        var f = this[method].bind(this);
        this.listeners.push([source, event, f]);
        source.addEventListener(event, f, false);
    };

    InputManager.prototype.detach = function() {
        var listener;
        for (var i = 0; i < this.listeners.length; i++) {
            listener = this.listeners[i];
            listener[0].removeEventListener(listener[1], listener[2]);
        }
    };

    InputManager.prototype.keydown = function(event) {
        var key = String.fromCharCode(event.which);
        this.observed[key] = true;
    };

    InputManager.prototype.keyup = function(event) {
        var key = String.fromCharCode(event.which);
        delete this.observed[key];
    };

    // FIXME: This belongs somewhere else!
    //
    InputManager.prototype.click = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        this.clicked = true;
        this.position.screenX = x;
        this.position.screenY = y;

        var world = this.screenCoordinatesToWorld(x, y);
        var ray = this.pickingRay(x, y);
        var intersections = ray.intersectObjects(this.camera.parent.children);
        this.position.worldX = world.x;
        this.position.worldY = world.y;
        var entity;
        try {
            entity = intersections[0].object.entity;
        } catch(e) {}

        if (entity) entity.broadcast('Click');
    };

    var screenVector = function(input, x, y) {
        return new THREE.Vector3(2 * (x / input.width) - 1, -2 * (y / input.height) + 1, 0.5);
    };

    InputManager.prototype.pickingRay = function(x, y) {
        var ray = this.projector.pickingRay(screenVector(this, x, y), this.camera);
        return ray;
    };

    InputManager.prototype.screenCoordinatesToWorld = function(x, y) {
        var vector = this.projector.unprojectVector(screenVector(this, x, y), this.camera);
        return vector;
    };

    InputManager.prototype.observe = function(source) {
        //this.bind(source, "mousedown", "mousedown");
        //this.bind(source, "mousemove", "mousemove");
        //this.bind(source, "mouseup", "mouseup");

        this.bind(source, 'click');
        this.bind(source, 'keydown');
        this.bind(source, 'keyup');

        this.bindings = {
            W: "panUp",
            A: "panLeft",
            S: "panDown",
            D: "panRight",
            Q: "rotateLeft",
            E: "rotateRight",
            M: "toggleMenu"
        };
    };

    InputManager.prototype.update = function() {
        var property, observed;
        for (var key in this.bindings) {
            property = this.bindings[key];
            observed = this.observed[key];
            this[property] = observed;
            if (observed) EventBus.publish(property, null);
        }
    };

    InputManager.prototype.lateUpdate = function() {
        this.clicked = false;
    };

    var instance = new InputManager();
    return instance;
});