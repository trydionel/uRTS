define(function(require) {
    var FogOfWar = require('core/fogOfWar');
    var Factory = require('core/factory');

    function Player(game, color, field, options) {
        options = options || {};

        this.game = game;
        this.color = color;
        this.field = field;
        this.human = options.human;
        this.entities = [];
        this.fog = new FogOfWar(this.field.size);

        this.initializeBase();
        this.initializeWorkers(3);
        this.initializeWarriors(1);
    }

    Player.prototype.initializeBase = function() {
        var x = Math.floor(Math.random() * (this.field.size - 4)) + 2;
        var y = Math.floor(Math.random() * (this.field.size - 4)) + 2;
        this.base = Factory.create('base', { field: this.field, player: this, Transform: { x: x, y: y }});
        this.game.entities.push(this.base);

        // Create opening in terrain and fog-of-war around the base
        this.clearFog(x, y, 6);
        this.field.clearTiles(x, y, 5);
    };

    Player.prototype.initializeWorkers = function(n) {
        var worker, x, y, position = this.base.getComponent('Transform');
        for (var i = 0; i < n; i++) {
            x = position.x + Math.floor(Math.random() * 4 - 2);
            y = position.y + Math.floor(Math.random() * 4 - 2);
            //worker = Factory.worker(this.field, this, x, y);
            worker = Factory.create('worker', { field: this.field, player: this, 'Transform': { x: x, y: y }});
            this.entities.push(worker);
            this.game.entities.push(worker);
        }
    };

    Player.prototype.initializeWarriors = function(n) {
        var warrior, x, y, position = this.base.getComponent('Transform');
        for (var i = 0; i < n; i++) {
            x = position.x + Math.floor(Math.random() * 4 - 2);
            y = position.y + Math.floor(Math.random() * 4 - 2);
            warrior = Factory.create('warrior', { field: this.field, player: this, 'Transform': { x: x, y: y } });
            this.entities.push(warrior);
            this.game.entities.push(warrior);
        }
    };

    Player.prototype.update = function() {};

    Player.prototype.render = function(context, dt, elapsed) {
        if (this.human) this.fog.render(context);
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