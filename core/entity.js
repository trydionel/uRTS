define(function(require) {
    var id = 0;

    function Entity() {
        this.components = {};
        this.tag = null;
        this.id = id++;
    }

    Entity.prototype.addComponent = function(component) {
        if (this.components[component.constructor.name]) throw "Duplicate component inserted into Entity";

        component.entity = this;
        this.components[component.constructor.name] = component;
    };

    Entity.prototype.getComponent = function(name) {
        return this.components[name];
    };

    Entity.prototype.removeComponent = function(component) {
        if (component.entity === this) {
            component.entity = null;
            delete this.components[component.constructor.name];
        }
    };

    Entity.prototype.update = function(dt, elapsed) {
        this.execute('update', dt, elapsed);
    };

    Entity.prototype.lateUpdate = function(dt) {
        this.execute('lateUpdate', dt);
    };

    Entity.prototype.fixedUpdate = function(dt) {
        this.execute('fixedUpdate', dt);
    };

    Entity.prototype.broadcast = function(message, data) {
        var method = "on" + message;
        this.execute(method, data);
    };

    var slice = Array.prototype.slice;
    Entity.prototype.execute = function(method) {
       var args = slice.call(arguments, 1);
       for (var name in this.components) {
           var component = this.components[name];
           if (component[method]) {
               component[method].apply(component, args);
           }
       }
    };

    return Entity;
});