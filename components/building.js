define(function(require) {

    var Factory = require('core/factory');
    var _ = require('underscore');

    function Building() {
        this.available = [];
    }

    Building.prototype.onStart = function() {
        var name = this.entity.name;
        var race = this.entity.player.race;

        var prefabs = _.values(Factory.prefabs);
        var available = prefabs.filter(function(prefab) {
            return prefab.build && prefab.build.race === race && prefab.build.building === name;
        });

        this.available = available;
    };

    Building.prototype.build = function(type) {
        this.ensureValid(type);

        var entity = Factory.create(type, {
            player: this.entity.player,
            field: this.entity.field,
            Transform: this.entity.getComponent('Transform')
        });
        this.entity.player.entities.push(entity);
    };

    Building.prototype.ensureValid = function(type) {
        var valid = this.available.filter(function(prefab) { return prefab.name === type });
        if (!valid) throw "Attempting to build object which does not belong to player";
    };

    return Building;
});