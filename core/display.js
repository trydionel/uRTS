define(function(require) {
    var THREE = require('THREE');
    var Stats = require('Stats');
    var Factory = require('core/factory');
    var async = require('lib/async');

    function Display(game, width, height) {
        this.game = game;
        this.width = width;
        this.height = height;
        this.scene = new THREE.Scene();
        this.canvas = document.getElementById('game');
    }

    Display.prototype.initialize = function(complete) {
        var display = this;
        var wrap = function(fn) {
            return function(next) {
                fn.apply(display, [next]);
            };
        };

        async.waterfall([
            wrap(display.initCamera),
            wrap(display.initLights),
            wrap(display.initRenderer),
            wrap(display.initPostprocessing),
            wrap(display.initStats)
        ], function(err) {
            if (err) throw err;
            display.canvas.appendChild(display.renderer.domElement);
            complete();
        });
    };

    Display.prototype.initCamera = function(next) {
        Factory.create('camera', { 'Camera': { 'width': this.width, 'height': this.height }});
        next();
    };

    Display.prototype.initLights = function(next) {
        this.ambient = new THREE.AmbientLight(0x888888);
        this.scene.add(this.ambient);

        this.light = new THREE.DirectionalLight(0xffdddd, 0.8);
        this.light.position.x = -50;
        this.light.position.y = -100;
        this.light.position.z = 50;
        this.light.castShadow = true;
        this.scene.add(this.light);

        this.shadow = new THREE.DirectionalLight(0xffffff);
        this.shadow.position.set( 100, 100, 75 );
		this.shadow.castShadow = true;
		this.shadow.onlyShadow = true;
		this.shadow.shadowCameraNear = 0.1;
		this.shadow.shadowCameraFar = 250;
        this.scene.add(this.shadow);

        next();
    };

    Display.prototype.initRenderer = function(next) {
        // Add fog needed for Renderer & SSAO
        this.scene.fog = new THREE.Fog( 0xffffff, 0.1, 500 );

        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor( this.scene.fog.color, 1 );
        this.renderer.shadowMapEnabled = true;
        this.renderer.shadowMapSoft = true;

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

        next();
    };

    Display.prototype.initPostprocessing = function(next) {
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
        var finalPass = this.composer.passes[this.composer.passes.length - 1];
        if (finalPass) finalPass.renderToScreen = true;

        next();
    };

    Display.prototype.initStats = function(next) {
        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.right = '0px';
        this.stats.domElement.style.bottom = '0px';

        document.body.appendChild( this.stats.domElement );

        next();
    };

    Display.prototype.add = function(object) {
        if (object instanceof THREE.Camera) this.camera = object;
        this.scene.add(object);
    };

    Display.prototype.remove = function(object) {
        if (object instanceof THREE.Camera) this.camera = null;
        this.scene.remove(object);
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
            this.renderer.shadowMapEnabled = false;
            this.scene.overrideMaterial = null;
            this.renderer.render(this.scene, this.camera, this.composer.renderTarget2, true);
            this.renderer.shadowMapEnabled = true;

            // Postprocess pass
            this.composer.render(0.1);
        }

        this.stats.end();
    };

    return Display;
});