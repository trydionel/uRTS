define(function(require) {
    var THREE = require('THREE');
    var Input = require('core/inputManager');

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
    }

    Camera.prototype.lookAt = function(position) {
        this.camera.position.x = position.x - this.distanceX;
        this.camera.position.y = position.y - this.distanceY;
        this.camera.position.z = this.cameraHeight;
        this.camera.lookAt(new THREE.Vector3(position.x, position.y, position.z));
    };

    Camera.prototype.follow = function(entity) {
        var appearance = entity.getComponent('Appearance');
        if (!appearance) return;

        var mesh = appearance.mesh;
        this.target = mesh.position;
    };

    Camera.prototype.update = function(dt, elapsed) {
        var pan = this.pan();
        if (pan) {
            this.target = null;
            this.camera.position.addSelf(pan);
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

        this.matrix.multiplyVector3(tmp.normalize().multiplyScalar(this.speed));

        return tmp;
    }

    return Camera;
});