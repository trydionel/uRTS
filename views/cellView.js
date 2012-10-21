define(function() {
    function CellView(context) {
        this.context = context;
    }

    CellView.prototype.render = function(entity, dt, elapsed) {
        elapsed = elapsed || 0;

        // Shim in previous behavior
        if (entity.render) {
            entity.render(this.context, dt, elapsed);
            return;
        }

        var appearance = entity.getComponent('Appearance');
        if (!appearance) return;

        var context = this.context;
        var scale = context.canvas.width / entity.field.size;
        var position = entity.getComponent('Transform');
        var storage = entity.getComponent('Storage');
        var offset, x, y, w, h, capacity;

        var lerp = function(a, b, t) {
            return (1 - t) * a + t * b;
        };

        if (!position) throw 'MissingComponent: CellView requires a Position component.';
        offset = Math.floor(appearance.size / 2.0);
        x = scale * (lerp(position.previousX, position.x, elapsed) - offset);
        y = scale * (lerp(position.previousY, position.y, elapsed) - offset);
        w = scale * appearance.size;
        h = scale * appearance.size;

        context.fillStyle = appearance.color;
        context.fillRect(x, y, w, h);

        if (entity.player) {
            context.fillStyle = entity.player.color;
            context.fillRect(x, y + h - 2, w, 2);
        }

        if (storage) {
            capacity = storage.quantity / storage.capacity;

            context.fillStyle = 'white';
            context.fillRect(x, y, w, 2);

            context.fillStyle = 'red';
            context.fillRect(x, y, capacity * w, 2);
        }

        if (entity.selected) {
            context.strokeStyle = 'yellow';
            context.strokeRect(x, y, w, h);
        }
    };

    return CellView;
});