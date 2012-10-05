define(function(require) {
    function Entity() {
        this.components = [];
        this.view = null;
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

    Entity.prototype.setView = function(view) {
        this.view = view;
    };

    Entity.prototype.update = function(dt) {
        this.components.forEach(function(component) {
            if (component.update) {
                component.update(this, dt);
            }
        }.bind(this));
    };

    Entity.prototype.render = function(context, dt, elapsed) {
        this.view.render(this, context, dt, elapsed);
    };

    return Entity;
});