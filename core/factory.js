define(function(require) {
    var _ = require('underscore');
    var Entity = require('core/entity');
    var async = require('lib/async');

    function Factory() {
        this.storage = null;
        this.prefabs = { generic: {} };
        this.components = {};
    }

    Factory.prototype.getPrefab = function(name) {
        return this.prefabs[name];
    };

    Factory.prototype.registerPrefab = function(name, value) {
        if (this.prefabs.hasOwnProperty(name)) throw "Prefab '" + name + "' already exists";
        this.prefabs[name] = value;
    };

    Factory.prototype.getComponent = function(name) {
        return this.components[name];
    };

    Factory.prototype.registerComponent = function(name, value) {
        if (this.components.hasOwnProperty(name)) throw "Component '" + name + "' already exists";
        this.components[name] = value;
    };

    Factory.prototype.preloadResources = function(complete) {
        var factory = this;
        var loadPrefab = function(res) {
            return function(next) {
                var path = 'json!prefabs/' + res + '.json';
                require([path], function(Prefab) {
                    factory.registerPrefab(res, Prefab);
                    next();
                });
            };
        };
        var loadComponent = function(res) {
            return function(next) {
                var path = 'components/' + res;
                var label = res[0].toUpperCase() + res.slice(1);
                require([path], function(Component) {
                    factory.registerComponent(label, Component);
                    next();
                });
            };
        };

        async.series([
            loadPrefab('worker'),
            loadPrefab('field'),
            loadPrefab('camera'),
            loadPrefab('base'),
            loadPrefab('warrior'),
            loadPrefab('resource'),
            loadComponent('appearance'),
            loadComponent('building'),
            loadComponent('camera'),
            loadComponent('health'),
            loadComponent('movementSystem'),
            loadComponent('pathfinding'),
            loadComponent('resourceAI'),
            loadComponent('selectable'),
            loadComponent('storage'),
            loadComponent('terrain'),
            loadComponent('terrainGenerator'),
            loadComponent('transform'),
            loadComponent('warriorAI'),
            loadComponent('workerAI')
        ], complete);
    };

    Factory.prototype.create = function(name, overrides) {
        if (!(name in this.prefabs)) throw "ArgumentError: " + name + " is not a valid prefab.";

        overrides = overrides || {};
        var prefab = this.getPrefab(name);
        var entity = new Entity();

        entity.name = overrides.name || prefab.name;
        entity.field = overrides.field;
        entity.player = overrides.player;
        entity.tag = overrides.tag || prefab.tag;
        entity.attributes = _.extend({}, prefab.attributes, overrides.attributes);

        for (var component in prefab.components) {
            var defaults = prefab.components[component];
            var options = _.extend({}, defaults, overrides[component]);
            var Component = this.getComponent(component);
            entity.addComponent(new Component(options));
        }

        if (this.storage) this.storage.addEntity(entity);
        return entity;
    };

    var instance = new Factory();
    return instance;
});