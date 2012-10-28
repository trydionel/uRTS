define(function(require) {

    var THREE = require('THREE');

    function Appearance(options) {
        options = options || {};
        this.color = options.color;
        this.size = options.size || 1;
        this.selected = false;

        this.mesh = options.mesh || this.genericMesh();
    }

    Appearance.prototype.genericMesh = function() {
        var color = parseInt(this.color.replace('#', ''), 16);
        var geometry = new THREE.CubeGeometry(this.size, this.size, this.size);
        var material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color)
        });

        return new THREE.Mesh(geometry, material);
    };

    Appearance.prototype.onSelect = function() {
        this.selected = true;
    };

    Appearance.prototype.onUnselect = function() {
        this.selected = false;
    };

    Appearance.prototype.update = function(dt) {
        var position = this.entity.getComponent('Transform');
        if (!position) return;

        this.mesh.position.set(position.x, position.y, position.z);
    };

    return Appearance;
});