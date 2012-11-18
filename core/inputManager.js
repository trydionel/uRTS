define(function(require) {
    var _ = require('underscore');

    function InputManager() {
        this.listeners = [];
        this.observed = {};
    }

    InputManager.prototype.bind = function(source, event, method) {
        var f = this[method].bind(this);
        this.listeners.push([source, event, f]);
        source.addEventListener(event, f);
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

    InputManager.prototype.observe = function(source) {
        //this.bind(source, "mousedown", "mousedown");
        //this.bind(source, "mousemove", "mousemove");
        //this.bind(source, "mouseup", "mouseup");
        //this.bind(source, "click", "click");

        this.bind(source, 'keydown', 'keydown');
        this.bind(source, 'keyup', 'keyup');

        this.bindings = {
            W: "panUp",
            A: "panLeft",
            S: "panDown",
            D: "panRight"
        };
    };

    InputManager.prototype.update = function() {
        var property;
        for (var key in this.bindings) {
            property = this.bindings[key];
            this[property] = this.observed[key];
        }
    };

    var instance = new InputManager();
    return instance;
});