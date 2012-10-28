define(function(require) {
    var THREE = require('THREE');
    var Field = require('core/field');
    var Player = require('core/player');
    var requestAnimationFrame = require('lib/requestAnimationFrame');
    var InputManager = require('core/inputManager');

    function Game(options) {
        this.playing = true;
        this.entities = [];

        this.container = document.getElementById('game');
        this.width = 800;
        this.height = 600;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 1, 10000);
        //this.camera = new THREE.OrthographicCamera( this.width / - 2, this.width / 2, this.height / 2, this.height / - 2, - 200, 1000 );
        this.camera.position.x = 10;
        this.camera.position.y = 7.0711; // 30 degree angle from the xz plane
        this.camera.position.z = 10;
        this.camera.up = new THREE.Vector3( 0, 0, 1 );

        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer();
        this.canvas = this.renderer.domElement;
        this.renderer.setSize(this.width, this.height);
        this.container.appendChild(this.canvas);
        //this.renderer = new THREE.CanvasRenderer({ canvas: this.canvas });

        this.field = new Field(this, 100);
        this.addEntity(this.field);

        this.players = [
            new Player(this, 'blue', this.field, { human: true }),
            new Player(this, 'red', this.field)
        ];
        this.entities.push(this.players[0]);
        this.entities.push(this.players[1]);

        var position = this.players[0].base.getComponent('Transform');
        this.camera.lookAt(new THREE.Vector3(position.x, position.y, 0));

        this.context = this.canvas.getContext('2d');
        this.input = new InputManager(this);
    }

    Game.prototype.addEntity = function(entity) {
        this.entities.push(entity);

        var appearance = entity.getComponent('Appearance');
        if (appearance) {
            var mesh = appearance.mesh;
            this.scene.add(mesh);
        }
    };

    Game.prototype.removeEntity = function(entity) {
        var index = this.entities.indexOf(entity);
        if (index != -1) {
            this.entities.splice(index);

            var appearance = entity.getComponent('Appearance');
            if (appearance) {
                var mesh = appearance.mesh;
                this.scene.remove(mesh);
            }
        }
    };

    Game.prototype.update = function(dt) {
        this.entities.forEach(function(entity) {
            entity.update(dt);
        });
    };

    Game.prototype.render = function(context, dt, elapsed) {
        this.renderer.render(this.scene, this.camera);
        this.input.render(context);
    };

    Game.prototype.run = function() {
        this.playing = true;

        var t0 = +new Date() - 16;
        var game = this;
        var logicRate = 200; // 5fps
        var lastLogicTick;

        this.input.bind();
        this.entities.forEach(function(entity) {
            entity.broadcast('Start', game);
        });

        var render = function(t) {
            var dt = t - t0;
            var elapsed = (t - lastLogicTick) / logicRate;
            if (game.playing) requestAnimationFrame(render);
            game.render(game.context, dt, elapsed);
        };
        render(16);

        var logic = function() {
            var dt;
            lastLogicTick = +new Date();
            dt = lastLogicTick - t0;
            game.update(dt);
            if (game.playing) setTimeout(logic, logicRate);
        };
        logic();
    };

    Game.prototype.stop = function() {
        this.input.unbind();
        this.playing = false;
    };

    return Game;
});