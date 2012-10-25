define(function(require) {
    var _ = require('underscore');

    function InputManager(game) {
        this.game = game;
        this.canvas = game.canvas;
        _.bindAll(this, 'startSelect', 'updateSelect', 'stopSelect', 'issueCommand');
    }

    InputManager.prototype.bind = function() {
        this.canvas.addEventListener("mousedown", this.startSelect);
        this.canvas.addEventListener("mousemove", this.updateSelect);
        this.canvas.addEventListener("mouseup", this.stopSelect);
        this.canvas.addEventListener("click", this.issueCommand);
    };

    InputManager.prototype.unbind = function() {
        this.canvas.removeEventListener("mousedown", this.startSelect);
        this.canvas.removeEventListener("mousemove", this.updateSelect);
        this.canvas.removeEventListener("mouseup", this.stopSelect);
        this.canvas.removeEventListener("click", this.issueCommand);
    };

    InputManager.prototype.render = function(context) {
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

    InputManager.prototype.startSelect = function(event) {
        this.selecting = true;
        this.bb = {};
        this.bb.x1 = event.offsetX;
        this.bb.y1 = event.offsetY;
        this.bb.x2 = this.bb.x1;
        this.bb.y2 = this.bb.y1;
    };

    InputManager.prototype.updateSelect = function(event) {
        if (this.selecting) {
            this.bb.x2 = event.offsetX;
            this.bb.y2 = event.offsetY;
        }
    };

    InputManager.prototype.stopSelect = function(event) {
        if (this.selecting) {
            var scale = this.canvas.width / this.game.field.size;
            var x = Math.min(this.bb.x1, this.bb.x2) / scale;
            var y = Math.min(this.bb.y1, this.bb.y2) / scale;
            var w = Math.abs(this.bb.x2 - this.bb.x1) / scale;
            var h = Math.abs(this.bb.y2 - this.bb.y1) / scale;

            // Ignore tiny rects
            if (w > 3 && h > 3) {
                //console.log(this.bb, x, y, w, h, this.players[0].unitsInBB(x, y, w, h));
                if (this.selected) {
                    this.selected.forEach(function(entity) {
                        entity.broadcast('Unselect');
                    });
                }
                this.selected = this.game.players[0].unitsInBB(x, y, w, h);
                this.selected.forEach(function(entity) {
                    entity.broadcast('Select');
                });
            }

            this.bb = null;
            this.selecting = false;
        }
    };

    InputManager.prototype.issueCommand = function(event) {
        if (this.selected) {
            var x = Math.floor(event.offsetX / (this.canvas.width / this.game.field.size));
            var y = Math.floor(event.offsetY / (this.canvas.width / this.game.field.size));
            this.selected.forEach(function(entity) {
                var path = entity.getComponent('Pathfinding');
                if (!path) return;

                path.search({ x: x, y: y });
            });
        }
    };

    return InputManager;
});