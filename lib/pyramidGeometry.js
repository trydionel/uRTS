define(function(require) {
   var THREE = require('THREE');

   function PyramidGeometry(width, height) {
        THREE.Geometry.call(this);

        var i, len;
        var hw = 0.5 * width;
        var vs = [
            [-hw, 0, -hw],
            [hw, 0, -hw],
            [hw, 0, hw],
            [-hw, 0, hw],
            [0, height, 0]
        ];
        var fs = [
            [4, 1, 0],
            [4, 2, 1],
            [4, 3, 2],
            [0, 3, 4]
        ];

        for (i = 0, len = vs.length; i < len; i++) {
            var vector = new THREE.Vector3(vs[i][0], vs[i][1], vs[i][2]);
            this.vertices.push(vector);
        }

        for (i = 0, len = fs.length; i < len; i++) {
            var v1 = this.vertices[fs[i][0]];
            var v2 = this.vertices[fs[i][1]];
            var v3 = this.vertices[fs[i][2]];
            var face = new THREE.Face3(fs[i][0], fs[i][1], fs[i][2]);
            face.centroid.add(v1).add(v2).add(v3).divideScalar(3);
            face.normal = face.centroid.clone().normalize();

            this.faces.push(face);
        }
    }

    PyramidGeometry.prototype = Object.create(THREE.Geometry.prototype);

    return PyramidGeometry;
});