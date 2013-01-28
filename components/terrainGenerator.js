define(function(require) {

    var THREE = require('THREE');
    var PyramidGeometry = require('lib/pyramidGeometry');
    var Brownian = require('util/brownian');
    var kNearestNeighborAverage = require('util/kNearestNeighborAverage');
    var quantize = require('util/quantize');

    var Appearance = require('components/appearance');
    var Terrain = require('components/terrain');

    function TerrainGenerator(options) {
        this.size = options.size || 0;
        this.mesh = new THREE.Object3D();
        this.terrain = [];
    }

    // Build and decorate a terrain, add the appropriate components, then remove
    // the generator component.
    //
    TerrainGenerator.prototype.onStart = function() {
        console.log("Generating terrain");
        this.generate();
        this.decorate();

        this.entity.addComponent(new Appearance({ mesh: this.mesh }));
        this.entity.getComponent('Appearance').onStart();

        this.entity.addComponent(new Terrain({
            size: this.size,
            data: this.terrain
        }));
        this.entity.removeComponent(this);
    };

    TerrainGenerator.prototype.generate = function() {
        var brownian = new Brownian(this.size, this.size, 8, 0.01);
        this.terrain = quantize(kNearestNeighborAverage(brownian.toArray(), this.size, this.size, 2), 2);

        // FIXME: Nasty hacks until Field is a proper Entity
        var mesh, geometry, material, modelAsPlane = false;
        material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        if (modelAsPlane) {
            geometry = new THREE.PlaneGeometry(this.size, this.size, this.size, this.size);
            mesh = new THREE.Mesh(geometry, material);

            for (var x = 0; x < this.size; x++) {
                for (var y = 0; y < this.size; y++) {
                    var vertex = geometry.vertices[this.size * y + x];
                    vertex.z = this.terrain[y][x] - 0.5;
                }
            }
            geometry.verticesNeedUpdate = true;
        } else {
            var merged, cube;
            merged = new THREE.Geometry();
            geometry = new THREE.CubeGeometry(1, 1, 1);

            for (var y = 0; y < this.size; y++) {
                for (var x = 0; x < this.size; x++) {
                    cube = new THREE.Mesh(geometry, null);
                    cube.position.x = x - 0.5 * this.size;
                    cube.position.y = y - 0.5 * this.size;
                    cube.position.z = this.terrain[y][x] - 0.5;
                    THREE.GeometryUtils.merge(merged, cube);
                }
            }

            mesh = new THREE.Mesh(merged, material);
        }

        mesh.name = "Terrain";
        mesh.position.set(this.size / 2, this.size / 2, 0);
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();

        this.mesh.add(mesh);
    };

    TerrainGenerator.prototype.decorate = function() {
        var N = 3;       // number of unique materials
        var M = 500 / N; // trees per material
        var color = new THREE.Color();
        var material;

        for (var n = 0; n < N; n++) {
            // Generate random greenish color
            color.setHSV((110 + 40 * Math.random()) / 360, 0.9, 0.3 + 0.4 * Math.random());
            material = new THREE.MeshLambertMaterial({ color: color });

            for (var m = 0; m < M; m++) {
                var w = 1;
                var h = 2 + Math.random() * 3;
                var x = Math.floor(Math.random() * 100);
                var y = Math.floor(Math.random() * 100);
                var z = this.terrain[y][x];
                var poly = new PyramidGeometry(w, h);
                var mesh = new THREE.Mesh(poly, material);
                mesh.rotation.x = Math.PI / 2;
                mesh.position.set(x, y, z);
                this.mesh.add(mesh);
            }
        }
    };

    return TerrainGenerator;
});