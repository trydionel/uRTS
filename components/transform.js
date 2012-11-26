define(function() {
    function Transform(options) {
        options = options || {};
        this.previousX = this.x = options.x || 0;
        this.previousY = this.y = options.y || 0;
        this.previousZ = this.z = options.z || 0;
    }

    Transform.prototype.set = function(x, y, z) {
        this.previousX = this.x;
        this.previousY = this.y;
        this.previousZ = this.z;
        this.x = x || this.previousX;
        this.y = y || this.previousY;
        this.z = z || this.previousZ;
    };

    return Transform;
});