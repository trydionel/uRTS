define(function(require) {

    var _ = require('underscore');
    var Factory = require('core/factory');
    var EasyStar = require('EasyStar');
    var THREE = require('THREE');

    function Terrain(options) {
        this.size = options.size || 0;
        this.data = options.data || [];
        this.resources = options.resources || [];
    }

    Terrain.prototype.onStart = function() {
        this.initializePath();
    };

    Terrain.prototype.initializePath = function() {
        this.path = new EasyStar.js(_.range(-20, 20, 1), this.onPathComplete.bind(this));
        this.path.setGrid(this.data);
    };

    Terrain.prototype.clearTiles = function(x, y, r) {
        for (var dy = -r; dy <= r; dy++) {
            for (var dx = -r; dx <= r; dx++) {
                this.data[x + this.size * y] = 0;
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
            return this.data[x + this.size * y];
        }
    };

    return Terrain;
});