define(function(require) {
    var FogOfWar = require('core/fogOfWar');
    var Factory = require('core/factory');
    var Entity = require('core/entity');
    var async = require('lib/async');

    function Player(game, color, field, options) {
        Entity.call(this);
        options = options || {};

        this.game = game;
        this.color = color;
        this.field = field;
        this.human = options.human;
        this.entities = [];
        this.fog = new FogOfWar(this.field.getComponent('TerrainGenerator').size, this.human);
        this.game.addEntity(this.fog);

        this.initializeBase();
        this.initializeWorkers(3);
        this.initializeWarriors(1);
    }

    Player.prototype = new Entity();

    Player.prototype.initializeBase = function() {
        var terrain = this.field.getComponent('TerrainGenerator'); // FIXME: ugh.
        var x = Math.floor(Math.random() * (terrain.size - 4)) + 2;
        var y = Math.floor(Math.random() * (terrain.size - 4)) + 2;

        this.base = Factory.create('base', { field: this.field, player: this, Transform: { x: x, y: y }});

        // Create opening in terrain and fog-of-war around the base
        this.clearFog(x, y, 6);
        //this.field.clearTiles(x, y, 5);
    };

    Player.prototype.initializeWorkers = function(n, cb) {
        var worker, x, y;
        for (var i = 0; i < n; i++) {
            x = this.base.x + Math.floor(Math.random() * 4 - 2);
            y = this.base.y + Math.floor(Math.random() * 4 - 2);
            worker = Factory.create('worker', { field: this.field, player: this, 'Transform': { x: x, y: y }});
            this.entities.push(worker);
        }
    };

    Player.prototype.initializeWarriors = function(n, cb) {
        var warrior, x, y;
        for (var i = 0; i < n; i++) {
            x = this.base.x + Math.floor(Math.random() * 4 - 2);
            y = this.base.y + Math.floor(Math.random() * 4 - 2);
            warrior = Factory.create('warrior', { field: this.field, player: this, 'Transform': { x: x, y: y } });
            this.entities.push(warrior);
        }
    };

    Player.prototype.underFog = function(x, y) {
        return this.fog.presentAt(x, y);
    };

    Player.prototype.clearFog = function(x, y, radius) {
        this.fog.reveal(x, y, radius);
    };

    Player.prototype.unitsInBB = function(x, y, w, h) {
        return this.entities.filter(function(entity) {
            var position = entity.getComponent('Transform');

            return (position.x >= x) &&
                (position.x < x + w) &&
                (position.y >= y) &&
                (position.y < y + h);
        });
    };

    return Player;
});