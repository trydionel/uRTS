define(function(require) {
    //var SimplexNoise = require('util/simplexNoise');

    function Brownian(width, height, octaves, frequency) {
        this.width = width;
        this.height = height;
        this.octaves = octaves;
        this.frequency = frequency || 1;
        this.lacunarity = 1.92;
        this.gain = 0.5;

        this.simplex = new SimplexNoise();
    }

    Brownian.prototype.toArray = function() {
        var row;
        this.data = [];

        for (var y = 0; y < this.height; y++) {
            row = [];
            for (var x = 0; x < this.width; x++) {
                row.push(this.noise(x, y));
            }
            this.data.push(row);
        }

        return this.data;
    };

    Brownian.prototype.noise = function(x, y) {
        var sum = 0,
            freq = 1.0,
            amp = 1.0,
            n;

        for (var i = 0; i < this.octaves; i++) {
              n = this.simplex.noise(x * freq, y * freq);
              sum += n*amp;
              freq *= this.lacunarity;
              amp *= this.gain;
        }

        return sum;
    };

    return Brownian;
});