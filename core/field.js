define(function(require) {
    var Factory = require('core/factory');
    var EasyStar = require('EasyStar');

    var Brownian = require('util/brownian');
    var kNearestNeighborAverage = require('util/kNearestNeighborAverage');
    var quantize = require('util/quantize');
    var renderToCanvas = require('util/renderToCanvas');

    function Field(size) {
        this.size = size;
        this.entities = [];
        this.terrain = [];

        this.initializeTerrain();
        this.initializePath();
        this.initializeResources(2 * Math.sqrt(this.size));
    }

    Field.prototype.initializeTerrain = function() {
        var brownian = new Brownian(this.size, this.size, 6);
        this.terrain = quantize(kNearestNeighborAverage(brownian.toArray(), this.size, this.size, 2), 5);
    };

    Field.prototype.initializePath = function() {
        this.path = new EasyStar.js([0], this.onPathComplete.bind(this));
        this.path.setGrid(this.terrain);
    };

    Field.prototype.initializeResources = function(n) {
        var resource, x, y, cx, cy,
        clusterSize = Math.random() * 5,
        takenPositions = [];

        // Keep an index of resources for faster lookups
        this.resources = [];
        for (var i = 0; i < n; i++) {
            cx = Math.floor(Math.random() * this.size);
            cy = Math.floor(Math.random() * this.size);

            for (var c = 0; c < clusterSize; c++) {
                do {
                    x = cx + Math.floor(Math.random() * 2 - 1);
                    y = cy + Math.floor(Math.random() * 2 - 1);
                } while (takenPositions.indexOf([x, y]) != -1);

                resource = Factory.create('resource', { field: this, 'Transform': { x: x, y: y }});

                this.resources.push(resource);
                this.entities.push(resource);
                takenPositions.push([x, y]);

                this.clearTiles(x, y, 3);
            }
        }
    };

    Field.prototype.clearTiles = function(x, y, r) {
        for (var dy = -r; dy <= r; dy++) {
            for (var dx = -r; dx <= r; dx++) {
                this.terrain[y][x] = 0;
            }
        }
        this._cachedImage = null;
    };

    Field.prototype.update = function(dt) {
        this.entities.forEach(function(entity) {
            entity.update(dt);
        });
    };

    Field.prototype.render = function(context, dt, elapsed) {
        this.renderSelf(context);
        this.entities.forEach(function(entity) {
            entity.render(context, dt, elapsed);
        });
    };

    Field.prototype.renderSelf = function(context) {
        this._cachedImage = this._cachedImage || renderToCanvas(context.canvas.width, context.canvas.height, function(buffer) {
            var size = context.canvas.width / this.size;
            var color, lum;
            this.terrain.forEach(function(row, y) {
                row.forEach(function(height, x) {
                    lum = 20 + (1 + height) / 8.0 * 100;
                    color = 'hsl(90, 60%, ' + lum + '%)';

                    buffer.fillStyle = color;
                    buffer.fillRect(size * x, size * y, size, size);
                });
            });
        }.bind(this));
        context.drawImage(this._cachedImage, 0, 0);
    };

    Field.prototype.availableResources = function(player) {
        return this.resources.filter(function(resource) {
            var storage  = resource.getComponent('Storage');
            var position = resource.getComponent('Transform');
            return !storage.isEmpty() && !player.underFog(position.x, position.y);
        });
    };

    Field.prototype.nearbyResource = function(player, x, y) {
        var available = this.availableResources(player);
        var manhattan = function(x1, y1, x2, y2) {
            return Math.abs(x2 - x1) + Math.abs(y2 - y1);
        };
        available.sort(function(a, b) {
            return manhattan(a.x, a.y, x, y) - manhattan(b.x, b.y, x, y);
        });
        return available[Math.floor(Math.random() * available.length)];
    };

    Field.prototype.onPathComplete = function(path) {
        this._lastPath = path;
    };

    Field.prototype.search = function(sx, sy, fx, fy, callback) {
        try {
            this.path.setPath(sx, sy, fx, fy);
            this.path.calculate();
            return this._lastPath;
        } catch(e) {
            return null;
        }
    };

    return Field;
});