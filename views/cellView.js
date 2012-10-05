define(function() {
    function CellView(color, size) {
        this.color  = color;
        this.size   = size || 1;
        this.offset = Math.floor(this.size / 2.0);
    }

    CellView.prototype.render = function(entity, context, dt, elapsed) {
        elapsed = elapsed || 0;
        var scale = context.canvas.width / entity.field.size;
        var position = entity.getComponent('Transform');
        var team = entity.getComponent('Team');
        var storage = entity.getComponent('Storage');
        var x, y, w, h, capacity;

        var lerp = function(a, b, t) {
            return (1 - t) * a + t * b;
        };

        if (!position) throw 'MissingComponent: CellView requires a Position component.';
        x = scale * (lerp(position.previousX, position.x, elapsed) - this.offset);
        y = scale * (lerp(position.previousY, position.y, elapsed) - this.offset);
        w = scale * this.size;
        h = scale * this.size;

        context.fillStyle = this.color;
        context.fillRect(x, y, w, h);

        if (team) {
            context.fillStyle = team.color;
            context.fillRect(x, y + h - 2, w, 2);
        }

        if (storage) {
            capacity = storage.quantity / storage.capacity;

            context.fillStyle = 'white';
            context.fillRect(x, y, w, 2);

            context.fillStyle = 'red';
            context.fillRect(x, y, capacity * w, 2);
        }
    };

    return CellView;
});