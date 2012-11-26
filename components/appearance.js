define(function(require) {

    var THREE = require('THREE');

    function Appearance(options) {
        options = options || {};
        this.color = options.color;
        this.size = options.size || 1;
        this.selected = false;
        this.position = null;

        this.mesh = options.mesh || this.genericMesh();
    }

    Appearance.prototype.onStart = function() {
        this.position = this.entity.getComponent('Transform');
    };

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
        if (!this.position) return;

        var x, y, z;
        x = Math.lerp(this.position.previousX, this.position.x, elapsed);
        y = Math.lerp(this.position.previousY, this.position.y, elapsed);
        z = Math.lerp(this.position.previousZ, this.position.z, elapsed);

        this.mesh.position.set(x, y, z);
    };

    return Appearance;
});