define(function(require) {

    function Appearance(options) {
        options = options || {};
        this.color = options.color;
        this.size = options.size || 1;
        this.selected = false;
    }

    Appearance.prototype.onSelect = function() {
        this.selected = true;
    };

    Appearance.prototype.onUnselect = function() {
        this.selected = false;
    };

    return Appearance;
});