define(function(require) {
    var THREE = require('THREE');
    var Stats = require('Stats');

    function Display(width, height) {
        this.width = width;
        this.height = height;
        this.distance = 25;
        this.angle = 45 * Math.PI / 180;
        this.distanceX = this.distance * Math.cos(this.angle);
        this.distanceY = this.distance * Math.sin(this.angle);
        this.cameraHeight = 10;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog( 0x000000, 10, 10000 );

        this.initCamera();
        this.initLights();
        this.initRenderer();
        //this.initPostprocessing();

        this.scene.add(this.camera);
        this.scene.add(new THREE.AmbientLight(0x888888));
        this.scene.add(this.light);
        this.scene.add(this.shadow);

        document.getElementById('game').appendChild(this.renderer.domElement);
    }

    Display.prototype.initCamera = function() {
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 10000);
        this.camera.position.z = 10;
        this.camera.up = new THREE.Vector3(0, 0, 1);
        this.camera.lookAt(new THREE.Vector3(this.width / 2, this.height / 2, 0));
    };

    Display.prototype.initLights = function() {
        this.light = new THREE.DirectionalLight(0xffdddd, 0.95);
        this.light.position.x = 100;
        this.light.position.z = 50;
        this.light.castShadow = true;

        this.shadow = new THREE.DirectionalLight(0xffffff);
        this.shadow.position.set( 100, 100, 75 );
		this.shadow.castShadow = true;
		this.shadow.onlyShadow = true;
		//dirLight2.shadowCameraVisible = true;
		this.shadow.shadowCameraNear = 0.1;
		this.shadow.shadowCameraFar = 250;

		this.shadow.shadowDarkness = 0.25;
		this.shadow.shadowMapWidth = 2048;
		this.shadow.shadowMapHeight = 2048;

		var d = 100;
		this.shadow.shadowCameraLeft = -d * 2;
		this.shadow.shadowCameraRight = d * 2;
		this.shadow.shadowCameraTop = d;
		this.shadow.shadowCameraBottom = -d;
    };

    Display.prototype.initRenderer = function() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColorHex(0x87CEEB);
        this.renderer.setClearColor( this.scene.fog.color, 1 );
        this.renderer.shadowMapEnabled = true;
        this.renderer.shadowMapSoft = true;

        this.renderer.shadowCameraNear = 3;
        this.renderer.shadowCameraFar = this.camera.far;
        this.renderer.shadowCameraFov = 50;

		this.renderer.gammaInput = true;
		this.renderer.gammaOutput = true;
		this.renderer.physicallyBasedShading = true;
        //this.renderer.autoClear = false;

        this.renderer.shadowMapBias = 0.0039;
        this.renderer.shadowMapDarkness = 0.5;
        this.renderer.shadowMapWidth = 1024;
        this.renderer.shadowMapHeight = 1024;
    };

    Display.prototype.initPostprocessing = function() {
        var SCALE = 0.75;
        this.cubeCamera = new THREE.CubeCamera( 1, 10000, 128 );
		this.scene.add( this.cubeCamera );

        var renderTargetParametersRGB = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
        var renderTargetParametersRGBA = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
        var depthTarget = new THREE.WebGLRenderTarget( SCALE * this.width, SCALE * this.height, renderTargetParametersRGBA );
        var colorTarget = new THREE.WebGLRenderTarget( SCALE * this.width, SCALE * this.height, renderTargetParametersRGB );

		var effectColor = new THREE.ShaderPass( THREE.ShaderExtras[ "colorCorrection" ] );
        var effectSSAO = new THREE.ShaderPass( THREE.ShaderExtras[ "ssao" ] );
        var effectFXAA = new THREE.ShaderPass( THREE.ShaderExtras[ "fxaa" ] );
        var effectScreen = new THREE.ShaderPass( THREE.ShaderExtras[ "screen" ] );

		this.composer = new THREE.EffectComposer( this.renderer, colorTarget );
		this.composer.addPass( effectSSAO );
        this.composer.addPass( effectColor );
		this.composer.addPass( effectFXAA );
		this.composer.addPass( effectScreen );

        effectScreen.renderToScreen = true;
        effectScreen.enabled = true;

		this.depthPassPlugin = new THREE.DepthPassPlugin();
		this.depthPassPlugin.renderTarget = depthTarget;

		this.renderer.addPrePlugin( this.depthPassPlugin );

		effectSSAO.uniforms[ 'tDepth' ].texture = depthTarget;
		effectSSAO.uniforms[ 'size' ].value.set( SCALE * this.width, SCALE * this.height );
		effectSSAO.uniforms[ 'cameraNear' ].value = this.camera.near;
		effectSSAO.uniforms[ 'cameraFar' ].value = this.camera.far;
		effectSSAO.uniforms[ 'fogNear' ].value = this.scene.fog.near;
		effectSSAO.uniforms[ 'fogFar' ].value = this.scene.fog.far;
		effectSSAO.uniforms[ 'fogEnabled' ].value = 1;
		effectSSAO.uniforms[ 'aoClamp' ].value = 0.5;

		effectFXAA.uniforms[ 'resolution' ].value.set( 1 / ( SCALE * this.width ), 1 / ( SCALE * this.height ) );

		effectColor.uniforms[ 'mulRGB' ].value.set( 1.4, 1.4, 1.4 );
		effectColor.uniforms[ 'powRGB' ].value.set( 1.2, 1.2, 1.2 );
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
        this.renderer.render(this.scene, this.camera);
        return;

		this.renderer.autoClear = false;
		this.renderer.autoUpdateObjects = true;
		this.renderer.shadowMapEnabled = true;
		this.depthPassPlugin.enabled = true;

        //this.renderer.render(this.scene, this.camera, this.composer.renderTarget2, true);
		this.renderer.initWebGLObjects( this.scene );
		this.renderer.updateShadowMap( this.scene, this.camera );

        this.cubeCamera.updateCubeMap( this.renderer, this.scene );

		this.renderer.shadowMapEnabled = false;
		this.depthPassPlugin.enabled = false;
        this.composer.render(0.1);
    };

    return Display;
});