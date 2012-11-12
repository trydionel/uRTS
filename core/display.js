define(function(require) {
    var THREE = require('THREE');
    var Stats = require('Stats');

    function Display(width, height) {
        this.width = width;
        this.height = height;
        this.distance = 25;
        this.azimuth = 45 * Math.PI / 180;
        this.altitude = 60 * Math.PI / 180;
        this.distanceX = this.distance * Math.cos(this.azimuth);
        this.distanceY = this.distance * Math.sin(this.azimuth);
        this.cameraHeight = this.distance * Math.sin(this.altitude);

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog( 0xffffff, 0.1, 500 );

        this.initCamera();
        this.initLights();
        this.initRenderer();
        this.initPostprocessing();
        this.initStats();

        this.scene.add(this.camera);
        this.scene.add(new THREE.AmbientLight(0x888888));
        this.scene.add(this.light);
        this.scene.add(this.shadow);

        document.getElementById('game').appendChild(this.renderer.domElement);
    }

    Display.prototype.initCamera = function() {
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.01, 1000);
        this.camera.up = new THREE.Vector3(0, 0, 1);
    };

    Display.prototype.initLights = function() {
        this.light = new THREE.DirectionalLight(0xffdddd, 0.8);
        this.light.position.x = 100;
        this.light.position.z = 50;
        this.light.castShadow = false;

        this.shadow = new THREE.DirectionalLight(0xffffff);
        this.shadow.position.set( 100, 100, 75 );
		this.shadow.castShadow = true;
		this.shadow.onlyShadow = true;
		this.shadow.shadowCameraNear = 0.1;
		this.shadow.shadowCameraFar = 250;
    };

    Display.prototype.initRenderer = function() {
        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor( this.scene.fog.color, 1 );
        this.renderer.shadowMapEnabled = true;
        //this.renderer.shadowMapSoft = true;

        this.renderer.shadowCameraNear = this.camera.near;
        this.renderer.shadowCameraFar = this.camera.far;
        this.renderer.shadowCameraFov = 50;

		this.renderer.gammaInput = true;
		this.renderer.gammaOutput = true;
		this.renderer.physicallyBasedShading = true;
        this.renderer.autoClear = false;

        this.renderer.shadowMapBias = 0.0039;
        this.renderer.shadowMapDarkness = 0.5;
        this.renderer.shadowMapWidth = 1024;
        this.renderer.shadowMapHeight = 1024;
    };

    Display.prototype.initPostprocessing = function() {
        this.postProcessing = true;

        // FIXME: Need to fix effect pipeline so that I can scale down the
        // shader targets without scaling the final result!
        //
        var SCALE = 1;
        var sW = SCALE * this.width;
        var sH = SCALE * this.height;

        var renderTargetParametersRGB = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
        var renderTargetParametersRGBA = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };

        /*******************************
         * Depth Pass
         *******************************/
        var depthShader = THREE.ShaderLib[ "depthRGBA" ];
        var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );
        this.depthTarget = new THREE.WebGLRenderTarget( sW, sH, renderTargetParametersRGBA );

        this.depthMaterial = new THREE.ShaderMaterial({
            fragmentShader: depthShader.fragmentShader,
            vertexShader: depthShader.vertexShader,
            uniforms: depthUniforms
        });
        this.depthMaterial.blending = THREE.NoBlending;

        /*******************************
         * Post-processing Passes
         *******************************/
        var passes = {
            'SSAO': {
                'tDepth': this.depthTarget,
                'size': new THREE.Vector2(sW, sH),
                'cameraNear': this.camera.near,
                'cameraFar': this.camera.far,
                'fogNear': this.scene.fog.near,
                'fogFar': this.scene.fog.far,
                'fogEnabled': true,
                'aoClamp': 0.5,
                'onlyAO': false
            },
            'ColorCorrection': {
                'mulRGB': new THREE.Vector3(1.4, 1.4, 1.4),
                'powRGB': new THREE.Vector3(1.2, 1.2, 1.2)
            },
            'FXAA': {
                'resolution': new THREE.Vector2(1 / sW, 1 / sH)
            }
        };

        // Using a custom render target because the one provided by EffectComposer
        // is too large -- it uses screen resolution rather than our much-constrained
        // fractional window size.
        //
        var colorTarget = new THREE.WebGLRenderTarget(this.width, this.height, renderTargetParametersRGB );
		this.composer = new THREE.EffectComposer(this.renderer, colorTarget);

        // Build out the post-processing shader passes. `passes` is a structure
        // of
        //    {
        //      passName1: uniforms,
        //      passName2: uniforms,
        //      ...
        //    }
        //
        var shader, uniforms, pass;
        for (var passName in passes) {
            shader = THREE[passName + 'Shader'];
            pass = new THREE.ShaderPass(shader);
            uniforms = passes[passName];

            for (var key in uniforms) {
                pass.uniforms[key].value = uniforms[key];
            }

            this.composer.addPass(pass);
        }

        // Draw the last pass of the composer to the screen.
        //
        this.composer.passes[this.composer.passes.length - 1].renderToScreen = true;
    };

    Display.prototype.initStats = function() {
        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.right = '0px';
        this.stats.domElement.style.bottom = '0px';

        document.body.appendChild( this.stats.domElement );
    };

    Display.prototype.add = function(mesh) {
        this.scene.add(mesh);
    };

    Display.prototype.remove = function(mesh) {
        this.scene.remove(mesh);
    };

    Display.prototype.lookAt = function(position) {
        this.camera.position.x = position.x - this.distanceX;
        this.camera.position.y = position.y - this.distanceY;
        this.camera.position.z = this.cameraHeight;
        this.camera.lookAt(new THREE.Vector3(position.x, position.y, position.z));
    };

    Display.prototype.render = function() {
        this.stats.begin();

        if (!this.postProcessing) {
            this.renderer.render(this.scene, this.camera);
        } else {
            // Depth pass
            this.scene.overrideMaterial = this.depthMaterial;
            this.renderer.render(this.scene, this.camera, this.depthTarget, true);

            // Color pass
            this.scene.overrideMaterial = null;
            this.renderer.render(this.scene, this.camera, this.composer.renderTarget2, true);

            // Postprocess pass
            this.composer.render(0.1);
        }

        this.stats.end();
    };

    return Display;
});