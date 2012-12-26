define(function(require) {

    var _ = require('underscore');
    var Factory = require('core/factory');
    var EasyStar = require('EasyStar');

    function Terrain(options) {
        this.size = options.size || 0;
        this.data = options.data || [];
        this.resources = [];

        this.initializePath();
        this.initializeResources(10);
    }

    Terrain.prototype.initializePath = function() {
        this.path = new EasyStar.js(_.range(-20, 20, 1), this.onPathComplete.bind(this));
        this.path.setGrid(this.data);
    };

    Terrain.prototype.initializeResources = function(n) {
        var resource, x, y, z, cx, cy,
        valid = false,
        clusterSize = Math.random() * 5,
        takenPositions = [];

        // Keep an index of resources for faster lookups
        this.resources = [];
        for (var i = 0; i < n; i++) {
            cx = Math.floor(Math.random() * (this.size - 4)) + 2;
            cy = Math.floor(Math.random() * (this.size - 4)) + 2;

            for (var c = 0; c < clusterSize; c++) {
                do {
                    valid = true;
                    x = cx + Math.floor(Math.random() * 2 - 1);
                    y = cy + Math.floor(Math.random() * 2 - 1);

                    if (x < 0 || x >= this.size) valid = false;
                    if (y < 0 || y >= this.size) valid = false;
                    if (valid) z = this.data[y][x] + 0.5;
                } while (valid && takenPositions.indexOf([x, y]) != -1);

                resource = Factory.create('resource', { field: this, 'Transform': { x: x, y: y, z: z }});
                this.resources.push(resource);
                takenPositions.push([x, y]);
            }
        }
    };

    Terrain.prototype.clearTiles = function(x, y, r) {
        for (var dy = -r; dy <= r; dy++) {
            for (var dx = -r; dx <= r; dx++) {
                this.data[y][x] = 0;
            }
        }
        // FIXME: No way to update the mesh
    };

    Terrain.prototype.availableResources = function(player) {
        return this.resources.filter(function(resource) {
            var storage  = resource.getComponent('Storage');
            var position = resource.getComponent('Transform');
            return !storage.isEmpty() && !player.underFog(position.x, position.y);
        });
    };

    Terrain.prototype.nearbyResource = function(player, x, y) {
        var available = this.availableResources(player);
        var manhattan = function(x1, y1, x2, y2) {
            return Math.abs(x2 - x1) + Math.abs(y2 - y1);
        };
        available.sort(function(a, b) {
            return manhattan(a.x, a.y, x, y) - manhattan(b.x, b.y, x, y);
        });
        return available[Math.floor(Math.random() * available.length)];
    };

    Terrain.prototype.onPathComplete = function(path) {
        this._lastPath = path;
    };

    Terrain.prototype.search = function(sx, sy, fx, fy, callback) {
        try {
            this.path.setPath(sx, sy, fx, fy);
            this.path.calculate();
            return this._lastPath;
        } catch(e) {
            return null;
        }
    };

    Terrain.prototype.at = function(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return undefined;
        } else {
            return this.data[y][x];
        }
    };

    return Terrain;
});