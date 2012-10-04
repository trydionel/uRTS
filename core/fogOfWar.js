define(function(require) {
    var renderToCanvas = require('util/renderToCanvas');
    
    var FOG_MASK = 1;

    function FogOfWar(size) {
        this.size = size;

        var row, fog = [];
        for (var j = 0; j < this.size; j++) {
            row = [];
            for (var i = 0; i < this.size; i++) {
                row.push(FOG_MASK);
            }
            fog.push(row);
        }
        this.fog = fog;
    }

    FogOfWar.prototype.presentAt = function(x, y) {
        return this.fog[y][x] === FOG_MASK;
    };

    FogOfWar.prototype.reveal = function(x, y, radius) {
        var tx, ty, current, updated, changed;
        radius = radius || 1;

        for (var dy = -radius; dy <= radius; dy++) {
            for (var dx = -radius; dx <= radius; dx++) {
                if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                    tx = x + dx;
                    ty = y + dy;
                    if (tx >= 0 && tx < this.size && ty >= 0 && ty < this.size) {
                        current = this.fog[ty][tx];
                        updated = current & ~FOG_MASK;
                        changed |= (current !== updated);

                        this.fog[ty][tx] = updated;
                    }
                }
            }
        }

        if (changed) this._cached = null;
    };

    FogOfWar.prototype.render = function(context) {
        this._cached = this._cached || renderToCanvas(context.canvas.width, context.canvas.height, function(buffer) {
            var size = buffer.canvas.width / this.size;
            buffer.fillStyle = 'darkgray';

            for (var y = 0; y < this.size; y++) {
                for (var x = 0; x < this.size; x++) {
                    if (this.presentAt(x, y)) {
                        buffer.fillRect(size * x, size * y, size, size);
                    }
                }
            }
        }.bind(this));

        context.drawImage(this._cached, 0, 0);
    };

    return FogOfWar;
});