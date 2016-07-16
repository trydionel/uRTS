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
        this.halo = this.haloMesh();

        EventBus.on('SelectEntity', this.checkSelection.bind(this));
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
        EventBus.publish('MeshAdded', this.halo);
    };

    Appearance.prototype.onRemove = function() {
        EventBus.publish('MeshRemoved', this.mesh);
        EventBus.publish('MeshRemoved', this.halo);
    };

    Appearance.prototype.onClick = function() {
        EventBus.trigger('SelectEntity', this.entity);
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

    Appearance.prototype.haloMesh = function() {
        var geometry = new THREE.CircleGeometry(1.1 * this.size);
        var material = new THREE.LineBasicMaterial({
            color: new THREE.Color(0xff0000)
        });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = mesh.receiveShadow = mesh.visible = false;

        return mesh;
    };

    Appearance.prototype.checkSelection = function(entity) {
        this.selected = (this.entity === entity);
    };

    Appearance.prototype.update = function(dt, elapsed) {
        if (!this.position) return;

        var x, y, z;
        x = Math.lerp(this.position.previousX, this.position.x, elapsed);
        y = Math.lerp(this.position.previousY, this.position.y, elapsed);
        z = Math.lerp(this.position.previousZ, this.position.z, elapsed);

        this.mesh.position.set(x, y, z);

        this.halo.position.set(x, y, z - 0.49 * this.size);
        this.halo.visible = this.selected;
    };

    return Appearance;
});