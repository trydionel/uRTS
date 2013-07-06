define(function(require) {

    var THREE = require('THREE');
    var EventBus = require('core/eventBus');
    var Factory = require('core/factory');

    function Appearance(options) {
        options = options || {};
        this.color = options.color;
        this.size = options.size || 1;
        this.selected = false;
        this.position = null;

        this.mesh = options.mesh || this.loadSTL(options.model) || this.genericMesh();
    }

    Appearance.prototype.loadSTL = function(model) {
        if (!model) return;
        var color = parseInt(this.color.replace('#', ''), 16);
        var geometry = Factory.getModel(model);
        var material = new THREE.MeshLambertMaterial({
            color: new THREE.Color(color)
        });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = mesh.receiveShadow = true;

        return mesh;
    };

    Appearance.prototype.onStart = function() {
        // Store a reference back to the entity on the mesh
        this.mesh.entity = this.entity;

        this.position = this.entity.getComponent('Transform');

        EventBus.publish('MeshAdded', this.mesh);
    };

    Appearance.prototype.onRemove = function() {
        EventBus.publish('MeshRemoved', this.mesh);
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