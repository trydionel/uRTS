define(function() {
    return function(data, width, height, k) {
        var out, n, values, sum;
    
        out = [];
        k = k || 2;
        sum = function(a, b) { return a + b; };
    
        for (var _y = 0; _y < height; _y++) out.push([]);
    
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                values = [];
    
                for (var dy = -k; dy <= k; dy++) {
                    for (var dx = -k; dx <= k; dx++) {
                        if ((x + dx >= 0) && (x + dx < width) && (y + dy >= 0) && (y + dy < height)) {
                            n = data[y + dy][x + dx];
                            values.push(n);
                        }
                    }
                }
    
                out[y][x] = values.reduce(sum, 0) / values.length;
            }
        }
    
        return out;
    };
});