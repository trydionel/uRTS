define(function(require) {
    var id = 0;

    function Entity() {
        this.components = {};
        this.tag = null;
        this.id = id++;
        this.attributes = {};
        this.memory = {};
    }

    Entity.prototype.addComponent = function(component) {
        if (this.components[component.constructor.name]) throw "Duplicate component inserted into Entity";

        component.entity = this;
        this.components[component.constructor.name] = component;
    };

    Entity.prototype.hasComponent = function(name) {
        return this.components.hasOwnProperty(name);
    };

    Entity.prototype.getComponent = function(name) {
        return this.components[name];
    };

    Entity.prototype.removeComponent = function(component) {
        if (typeof component == "string") {
            delete this.components[component];
            if (component.onRemove) component.onRemove();
        } else if (component.entity === this) {
            component.entity = null;
            delete this.components[component.constructor.name];
            if (component.onRemove) component.onRemove();
        }
    };

    Entity.prototype.hasAttribute = function(name) {
        return this.attributes.hasOwnProperty(name);
    };

    Entity.prototype.getAttribute = function(name) {
        return this.attributes[name];
    };

    Entity.prototype.setAttribute = function(name, value) {
        this.attributes[name] = value;
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