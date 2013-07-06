define(function(require) {
    var THREE = require('THREE');
    var Input = require('core/inputManager');
    var EventBus = require('core/eventBus');

    function Camera(options) {
        this.width = options.width || window.innerWidth;
        this.height = options.height || window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.01, 1000);
        this.camera.up = new THREE.Vector3(0, 0, 1);

        this.distance = 25;
        this.azimuth = 45 * Math.PI / 180;
        this.altitude = 60 * Math.PI / 180;
        this.distanceX = this.distance * Math.cos(this.azimuth);
        this.distanceY = this.distance * Math.sin(this.azimuth);
        this.cameraHeight = this.distance * Math.sin(this.altitude);
        this.speed = 1;
        this.matrix = new THREE.Matrix4().makeRotationAxis(this.camera.up, -this.azimuth);
        this.target = null;

        this.lookAt(new THREE.Vector3(0, 0, 0));

        EventBus.publish('CameraLoaded', this);
    }

    Camera.prototype.lookAt = function(position) {
        this.camera.position.x = position.x - this.distanceX;
        this.camera.position.y = position.y - this.distanceY;
        this.camera.position.z = this.cameraHeight;
        this.camera.lookAt(new THREE.Vector3(position.x, position.y, position.z));
    };

    Camera.prototype.follow = function(entity) {
        var position = entity.getComponent('Transform');
        var appearance = entity.getComponent('Appearance');

        if (appearance) {
            var mesh = appearance.mesh;
            this.target = mesh.position;
        } else if (position) {
            this.target = position;
        } else {
            console.log("No followable position on ", entity);
        }
    };

    Camera.prototype.update = function(dt, elapsed) {
        var rotation = Input.rotateLeft ? 1 : Input.rotateRight ? -1 : 0;
        var dr = 0.017 * rotation; // ~1deg / frame
        if (dr) {
            this.azimuth += dr;
            this.distanceX = this.distance * Math.cos(this.azimuth);
            this.distanceY = this.distance * Math.sin(this.azimuth);
        }

        var pan = this.pan();
        if (pan) {
            this.target = null;
            this.camera.position.add(pan);
        } else if (this.target) {
            this.lookAt(this.target);
        }
    };

    var tmp = new THREE.Vector3(0, 0, 0);
    Camera.prototype.pan = function() {
        tmp.set(0, 0, 0);
        if (Input.panLeft)  tmp.x = -1;
        if (Input.panRight) tmp.x = +1;
        if (Input.panUp)    tmp.y = +1;
        if (Input.panDown)  tmp.y = -1;
        if (tmp.length() === 0) return null;

        tmp.normalize().multiplyScalar(this.speed).applyProjection(this.matrix);

        return tmp;
    };

    return Camera;
});