define(function() {
    function Transform(x, y) {
        this.previousX = x;
        this.previousY = y;
        this.x = x;
        this.y = y;
    }

    Transform.prototype.set = function(x, y) {
        this.previousX = this.x;
        this.previousY = this.y;
        this.x = x;
        this.y = y;
    };

    return Transform;
});
