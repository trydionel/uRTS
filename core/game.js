define(function(require) {
    var Field = require('core/field');
    var Player = require('core/player');
    var requestAnimationFrame = require('lib/requestAnimationFrame');
    var CellView = require('views/cellView');
    var InputManager = require('core/inputManager');

    function Game(options) {
        this.playing = true;
        this.entities = [];

        this.field = new Field(this, 100);
        this.entities.unshift(this.field);

        this.players = [
            new Player(this, 'blue', this.field, { human: true }),
            new Player(this, 'red', this.field)
        ];
        this.entities.push(this.players[0]);
        this.entities.push(this.players[1]);

        this.canvas = document.getElementById('game');
        this.context = this.canvas.getContext('2d');
        this.renderer = new CellView(this.context);
        this.input = new InputManager(this);
    }

    Game.prototype.update = function(dt) {
        this.entities.forEach(function(entity) {
            entity.update(dt);
        });
    };

    Game.prototype.render = function(context, dt, elapsed) {
        var renderer = this.renderer;
        this.entities.forEach(function(entity) {
            renderer.render(entity, dt, elapsed);
        });
        this.input.render(context);
    };

    Game.prototype.run = function() {
        this.playing = true;
        this.input.bind();

        var t0 = +new Date() - 16;
        var game = this;
        var logicRate = 200; // 5fps
        var lastLogicTick;

        var render = function(t) {
            var dt = t - t0;
            var elapsed = (t - lastLogicTick) / logicRate;
            if (game.playing) requestAnimationFrame(render);
            game.render(game.context, dt, elapsed);
        };
        render(16);

        var logic = function() {
            var dt;
            lastLogicTick = +new Date();
            dt = lastLogicTick - t0;
            game.update(dt);
            if (game.playing) setTimeout(logic, logicRate);
        };
        logic();
    };

    Game.prototype.stop = function() {
        this.input.unbind();
        this.playing = false;
    };

    return Game;
});