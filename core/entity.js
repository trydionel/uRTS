define(function(require) {
    function Entity() {
        this.components = [];
        this.tag = null;
    }

    Entity.prototype.addComponent = function(component) {
        component.entity = this;
        this.components.push(component);
    };

    Entity.prototype.getComponent = function(name) {
        var found = this.components.filter(function(component) {
            return component.constructor.name == name;
        });
        return found[0];
    };

    Entity.prototype.removeComponent = function(component) {
        if (component.entity === this) {
            component.entity = null;
            this.components.splice(this.components.indexOf(component));
        }
    };

    Entity.prototype.broadcast = function(message, data) {
        var method = "on" + message;
        this.components.forEach(function(component) {
            if (component[method]) {
                component[method](data);
            }
        });
    };

    Entity.prototype.setTag = function(tag) {
        this.tag = tag;
    };

    Entity.prototype.update = function(dt) {
        this.components.forEach(function(component) {
            if (component.update) {
                component.update(dt);
            }
        }.bind(this));
    };

    return Entity;
});