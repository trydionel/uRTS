define(function(require) {
    function Entity() {
        this.components = {};
        this.tag = null;
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

    Entity.prototype.broadcast = function(message, data) {
        var method = "on" + message;
        for (var name in this.components) {
            var component = this.components[name];
            if (component[method]) {
                component[method](data);
            }
        }
    };

    Entity.prototype.setTag = function(tag) {
        this.tag = tag;
    };

    Entity.prototype.update = function(dt) {
        for (var name in this.components) {
            var component = this.components[name];
            if (component.update) {
                component.update(dt);
            }
        }
    };

    return Entity;
});