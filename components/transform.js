define(function() {
    function Transform(options) {
        options = options || {};
        this.previousX = this.x = options.x;
        this.previousY = this.y = options.y;
    }

    Transform.prototype.set = function(x, y) {
        this.previousX = this.x;
        this.previousY = this.y;
        this.x = x;
        this.y = y;
    };

    return Transform;
});
