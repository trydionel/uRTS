define(function(require) {
    var Field = require('core/field');
    var Player = require('core/player');
    var requestAnimationFrame = require('lib/requestAnimationFrame');
    var InputManager = require('core/inputManager');
    var Display = require('core/display');

    function Game(options) {
        this.playing = true;
        this.entities = [];

        this.width = 800;
        this.height = 600;
        this.display = new Display(this.width, this.height);

        this.field = new Field(this, 100);
        this.addEntity(this.field);

        this.players = [
            new Player(this, 'blue', this.field, { human: true }),
            new Player(this, 'red', this.field)
        ];
        this.entities.push(this.players[0]);
        this.entities.push(this.players[1]);

        //this.context = this.canvas.getContext('2d');
        //this.input = new InputManager(this);
        this.display.lookAt(this.players[0].base.getComponent('Transform'));
    }

    Game.prototype.addEntity = function(entity) {
        this.entities.push(entity);

        var appearance = entity.getComponent('Appearance');
        if (appearance) {
            var mesh = appearance.mesh;
            this.display.add(mesh);
        }
    };

    Game.prototype.removeEntity = function(entity) {
        var index = this.entities.indexOf(entity);
        if (index != -1) {
            this.entities.splice(index);

            var appearance = entity.getComponent('Appearance');
            if (appearance) {
                var mesh = appearance.mesh;
                this.display.remove(mesh);
            }
        }
    };

    Game.prototype.update = function(dt) {
        this.entities.forEach(function(entity) {
            entity.update(dt);
        });
    };

    Game.prototype.render = function(context, dt, elapsed) {
        this.display.render();
        //this.input.render(context);
    };

    Game.prototype.run = function() {
        this.playing = true;

        var t0 = +new Date() - 16;
        var game = this;
        var logicRate = 200; // 5fps
        var lastLogicTick;

        //this.input.bind();
        this.entities.forEach(function(entity) {
            entity.broadcast('Start', game);
        });

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
        //this.input.unbind();
        this.playing = false;
    };

    return Game;
});