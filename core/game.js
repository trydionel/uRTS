define(function(require) {
    var Field = require('core/field');
    var Player = require('core/player');
    var requestAnimationFrame = require('lib/requestAnimationFrame');

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

        // FIXME: Need to tear down these bindings somewhere so reroll will
        // work properly.
        this.canvas.addEventListener("mousedown", this.startSelect.bind(this));
        this.canvas.addEventListener("mousemove", this.updateSelect.bind(this));
        this.canvas.addEventListener("mouseup", this.stopSelect.bind(this));
        this.canvas.addEventListener("click", this.issueCommand.bind(this));
    }

    Game.prototype.update = function(dt) {
        this.entities.forEach(function(entity) {
            entity.update(dt);
        });
    };

    Game.prototype.render = function(context, dt, elapsed) {
        this.entities.forEach(function(entity) {
            entity.render(context, dt, elapsed);
        });
        this.renderSelect(context);
    };

    Game.prototype.renderSelect = function(context) {
        if (this.selecting) {
            var x = Math.min(this.bb.x1, this.bb.x2);
            var y = Math.min(this.bb.y1, this.bb.y2);
            var w = Math.abs(this.bb.x2 - this.bb.x1);
            var h = Math.abs(this.bb.y2 - this.bb.y1);

            context.strokeStyle = "white";
            context.strokeWidth = 2;
            context.fillStyle = 'rgba(255, 255, 255, 0.25)';
            context.fillRect(x, y, w, h);
            context.strokeRect(x, y, w, h);
        }
    };

    Game.prototype.startSelect = function(event) {
        this.selecting = true;
        this.bb = {};
        this.bb.x1 = event.offsetX;
        this.bb.y1 = event.offsetY;
        this.bb.x2 = this.bb.x1;
        this.bb.y2 = this.bb.y1;
    };

    Game.prototype.updateSelect = function(event) {
        if (this.selecting) {
            this.bb.x2 = event.offsetX;
            this.bb.y2 = event.offsetY;
        }
    };

    Game.prototype.stopSelect = function(event) {
        if (this.selecting) {
            var scale = this.canvas.width / this.field.size;
            var x = Math.min(this.bb.x1, this.bb.x2) / scale;
            var y = Math.min(this.bb.y1, this.bb.y2) / scale;
            var w = Math.abs(this.bb.x2 - this.bb.x1) / scale;
            var h = Math.abs(this.bb.y2 - this.bb.y1) / scale;

            // Ignore tiny rects
            if (w > 3 && h > 3) {
                //console.log(this.bb, x, y, w, h, this.players[0].unitsInBB(x, y, w, h));
                if (this.selected) {
                    this.selected.forEach(function(entity) {
                        entity.selected = false;
                    });
                }
                this.selected = this.players[0].unitsInBB(x, y, w, h);
                this.selected.forEach(function(entity) {
                    entity.selected = true;
                });
            }

            this.bb = null;
            this.selecting = false;
        }
    };

    Game.prototype.issueCommand = function(event) {
        if (this.selected) {
            var x = Math.floor(event.offsetX / (this.canvas.width / this.field.size));
            var y = Math.floor(event.offsetY / (this.canvas.width / this.field.size));
            this.selected.forEach(function(entity) {
                var path = entity.getComponent('Pathfinding');
                if (!path) return;

                path.search({ x: x, y: y });
            });
        }
    };

    Game.prototype.run = function() {
        this.playing = true;

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
        this.playing = false;
    };

    return Game;
});