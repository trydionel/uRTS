define(function() {
    /*
     * Extends `Math` with some useful methods.
     */
    Math.lerp = function(a, b, t) {
        return (1 - t) * a + t * b;
    };

    Math.clamp = function(x, l, u) {
        return Math.min(u, Math.max(x, l));
    };

    return Math;
});