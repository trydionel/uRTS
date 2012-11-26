define(function(require) {
    var _ = require('underscore');
    var Entity = require('core/entity');
    var async = require('lib/async');

    function Factory() {
        this.storage = null;
        this.prefabs = {};
        this.components = {};
    }

    Factory.prototype.preloadResources = function(complete) {
        var factory = this;
        var loadPrefab = function(res) {
            return function(next) {
                var path = 'json!prefabs/' + res + '.json';
                require([path], function(Prefab) {
                    factory.prefabs[res] = Prefab;
                    next();
                });
            };
        };
        var loadComponent = function(res) {
            return function(next) {
                var path = 'components/' + res;
                var label = res[0].toUpperCase() + res.slice(1);
                require([path], function(Component) {
                    factory.components[label] = Component;
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
            loadComponent('camera'),
            loadComponent('transform'),
            loadComponent('movementSystem'),
            loadComponent('pathfinding'),
            loadComponent('storage'),
            loadComponent('workerAI'),
            loadComponent('warriorAI'),
            loadComponent('resourceAI'),
            loadComponent('terrain'),
            loadComponent('terrainGenerator')
        ], complete);
    };

    Factory.prototype.create = function(name, attributes) {
        if (!(name in this.prefabs)) throw "ArgumentError: " + name + " is not a valid prefab.";

        attributes = attributes || {};
        var prefab = this.prefabs[name];
        var entity = new Entity();

        entity.field = attributes.field;
        entity.player = attributes.player;
        entity.tag = attributes.tag || prefab.tag;

        for (var component in prefab.components) {
            var defaults = prefab.components[component];
            var options = _.extend({}, defaults, attributes[component]);
            var Component = this.components[component];
            entity.addComponent(new Component(options));
        }

        if (this.storage) this.storage.addEntity(entity);
        return entity;
    };

    var instance = new Factory();
    return instance;
});