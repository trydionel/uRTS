define(function(require) {

    var Factory = require('core/factory');
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
        //this.terrain = [];
        this.terrain = new Int32Array(this.size * this.size);
        this.resources = [];
        this.component = new Terrain({
            size: this.size
        });
    }

    // Build and decorate a terrain, add the appropriate components, then remove
    // the generator component.
    //
    TerrainGenerator.prototype.onStart = function() {
        console.time("Generating terrain");
        this.generate();
        this.addResources(10);
        this.decorate();

        var component = new Appearance({ mesh: this.mesh });
        this.entity.addComponent(component);
        component.onStart();

        this.component.data = this.terrain;
        this.component.resources = this.resources;
        this.entity.addComponent(this.component);
        this.component.onStart();

        this.entity.removeComponent(this);
        console.timeEnd("Generating terrain");
    };

    TerrainGenerator.prototype.generate = function() {
        var brownian = new Brownian(this.size, this.size, 8, 0.01);
        var noise = quantize(kNearestNeighborAverage(brownian.toArray(), this.size, this.size, 2), 2);
        for (var x = 0; x < this.size; x++) {
            for (var y = 0; y < this.size; y++) {
                this.terrain[x + this.size * y] = noise[y][x];
            }
        }

        // FIXME: Nasty hacks until Field is a proper Entity
        var mesh, geometry, material, modelAsPlane = true;
        material = new THREE.MeshLambertMaterial({ color: 0x00ff00, shading: THREE.FlatShading });
        if (modelAsPlane) {
            geometry = new THREE.PlaneGeometry(this.size, this.size, this.size - 1, this.size - 1);
            mesh = new THREE.Mesh(geometry, material);

            for (var x = 0; x < this.size; x++) {
                for (var y = 0; y < this.size; y++) {
                    var vertex = geometry.vertices[this.size * (this.size - y - 1) + x];
                    vertex.z = this.terrain[x + this.size * y] - 0.5;
                }
            }
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
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

    TerrainGenerator.prototype.addResources = function(n) {
        var resource, x, y, z, cx, cy,
        valid = false,
        clusterSize = Math.random() * 5,
        takenPositions = [];

        // Keep an index of resources for faster lookups
        this.resources = [];
        for (var i = 0; i < n; i++) {
            cx = Math.floor(Math.random() * (this.size - 4)) + 2;
            cy = Math.floor(Math.random() * (this.size - 4)) + 2;

            for (var c = 0; c < clusterSize; c++) {
                do {
                    valid = true;
                    x = cx + Math.floor(Math.random() * 2 - 1);
                    y = cy + Math.floor(Math.random() * 2 - 1);

                    if (x < 0 || x >= this.size) valid = false;
                    if (y < 0 || y >= this.size) valid = false;
                    if (valid) z = this.terrain[x + this.size * y] + 0.5;
                } while (valid && takenPositions.indexOf([x, y]) != -1);

                resource = Factory.create('resource', {
                    field: this.component,
                    'Transform': { x: x, y: y, z: z }
                });
                this.resources.push(resource);
                takenPositions.push([x, y]);
            }
        }
    };

    TerrainGenerator.prototype.decorate = function() {
        var N = 3;       // number of unique materials
        var M = 5 * this.size / N; // trees per material
        var color = new THREE.Color();
        var material;

        for (var n = 0; n < N; n++) {
            // Generate random greenish color
            color.setHSL((110 + 40 * Math.random()) / 360, 0.9, 0.3 + 0.4 * Math.random());
            material = new THREE.MeshLambertMaterial({ color: color });

            for (var m = 0; m < M; m++) {
                var w = 1;
                var h = 2 + Math.random() * 3;
                var x = Math.floor(Math.random() * this.size);
                var y = Math.floor(Math.random() * this.size);
                var z = this.terrain[x + this.size * y];
                var poly = new PyramidGeometry(w, h);
                var mesh = new THREE.Mesh(poly, material);
                mesh.rotation.x = Math.PI / 2;
                mesh.position.set(x + 0.5 * w, y + 0.5 * w, z - 0.5);
                mesh.castShadow = true;
                this.mesh.add(mesh);
            }
        }
    };

    return TerrainGenerator;
});