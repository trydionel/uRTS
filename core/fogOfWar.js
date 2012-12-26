define(function(require) {
    var THREE = require('THREE');
    var Entity = require('core/entity');
    var Transform = require('components/transform');
    var Appearance = require('components/appearance');

    var FOG_MASK = 1;

    function FogOfWar(size, visible) {
        Entity.call(this);

        this.size = size;
        this.visible = visible;
        this.initializeFog();
    }

    FogOfWar.prototype = new Entity();

    FogOfWar.prototype.initializeFog = function() {
        var row, fog = [];
        for (var j = 0; j < this.size; j++) {
            row = [];
            for (var i = 0; i < this.size; i++) {
                row.push(FOG_MASK);
            }
            fog.push(row);
        }
        this.fog = fog;
        return;
        if (!this.visible) return;

        this.buildTexture();
        var geometry = new THREE.PlaneGeometry(this.size, this.size);
        var material = new THREE.MeshLambertMaterial({
            map: this.texture,
            transparent: true
        });
        var mesh = new THREE.Mesh(geometry, material);

        this.addComponent(new Transform({
            x: this.size / 2,
            y: this.size / 2,
            z: 3
        }));
        this.addComponent(new Appearance({ mesh: mesh }));
    };

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
                        changed = (current !== updated);

                        this.fog[ty][tx] = updated;
                        if (changed && this.texture) this.updateTexture(tx, ty, updated);
                    }
                }
            }
        }
    };

    FogOfWar.prototype.buildTexture = function() {
        var size = this.size * this.size;
        var colors = new Array(size * 4);
        var gray = 32, r = gray, g = gray, b = gray;
        for (var y = 0; y < this.size; y++) {
            for (var x = 0; x < this.size; x++) {
                var iy = this.size - y - 1; // invert y axis
                var i = this.size * iy + x;
                var a = this.presentAt(x, y) ? 255 : 0;
                colors[4 * i + 0] = r;
                colors[4 * i + 1] = b;
                colors[4 * i + 2] = g;
                colors[4 * i + 3] = a;
            }
        }

        this.textureData = new Uint8Array(size * 4);
        this.textureData.set(colors);
        this.texture = new THREE.DataTexture(this.textureData, this.size, this.size, THREE.RGBAFormat);
        this.texture.needsUpdate = true;
    };

    FogOfWar.prototype.updateTexture = function(x, y, mask) {
        var i = this.size * (this.size - y - 1) + x;
        var alpha = mask === FOG_MASK ? 255 : 0;
        this.textureData[4 * i + 3] = alpha;
        this.texture.needsUpdate = true;
    };

    return FogOfWar;
});