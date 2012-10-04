/*global webkitRequestAnimationFrame: true */
define(function(require) {
    var Field = require('core/field');
    var Player = require('core/player');
    
    function Game(options) {
        this.playing = true;
        this.field = new Field(100);
        this.players = [
            new Player('blue', this.field, { human: true }),
            new Player('red', this.field)
        ];
        this.canvas = document.getElementById('game');
        this.context = this.canvas.getContext('2d');

        this.entities = [this.field, this.players[1], this.players[0]];
    }

    Game.prototype.update = function(dt) {
        this.entities.forEach(function(entity) {
            entity.update(dt);
        });
    };

    Game.prototype.render = function(context) {
        this.entities.forEach(function(entity) {
            entity.render(context);
        });
    };

    Game.prototype.run = function() {
        this.playing = true;

        var t0 = +new Date() - 16;
        var game = this;
        var render = function() {
            if (game.playing) webkitRequestAnimationFrame(render);
            game.render(game.context);
        };
        render();

        var logic = function() {
            var dt = +new Date() - t0;
            game.update(dt);
            if (game.playing) setTimeout(logic, 200); // 5fps
        };
        logic();
    };

    Game.prototype.stop = function() {
        this.playing = false;
    };

    return Game;
});