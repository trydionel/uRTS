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
        var material = new THREE.MeshLambertMaterial({
            color: new THREE.Color(color)
        });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = mesh.receiveShadow = true;

        return mesh;
    };

    Appearance.prototype.onSelect = function() {
        this.selected = true;
    };

    Appearance.prototype.onUnselect = function() {
        this.selected = false;
    };

    Appearance.prototype.update = function(dt, elapsed) {
        var position = this.entity.getComponent('Transform');
        if (!position) return;

        elapsed = Math.clamp(elapsed, 0, 1);
        var x = Math.lerp(position.previousX, position.x, elapsed);
        var y = Math.lerp(position.previousY, position.y, elapsed);
        var z = Math.lerp(position.previousZ, position.z, elapsed);

        this.mesh.position.set(x, y, z);
    };

    return Appearance;
});