define(function() {
    return function(data, steps) {
        for (var y = 0; y < data.length; y++) {
            for (var x = 0; x < data[y].length; x++) {
                data[y][x] = Math.round(data[y][x] * steps);
            }
        }
    
        return data;
    };
});