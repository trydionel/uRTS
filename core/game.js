/*global performance:true*/
define(function(require) {
    require('util/math');

    var Factory = require('core/factory');
    var Field = require('core/field');
    var Player = require('core/player');
    var requestAnimationFrame = require('lib/requestAnimationFrame');
    var InputManager = require('core/inputManager');
    var Display = require('core/display');

    function Game(options) {
        this.playing = true;
        this.entities = [];

        this.width = 800;
        this.height = 600;
        this.display = new Display(this.width, this.height);

        this.camera = Factory.create('camera', { 'Camera': { 'width': this.width, 'heigth': this.height }});
        this.addEntity(this.camera);

        this.field = new Field(this, 100);
        this.addEntity(this.field);

        this.players = [
            new Player(this, 'blue', this.field, { human: true }),
            new Player(this, 'red', this.field)
        ];
        this.entities.push(this.players[0]);
        this.entities.push(this.players[1]);

        this.debugList();
    }

    Game.prototype.addEntity = function(entity) {
        this.entities.push(entity);

        var appearance = entity.getComponent('Appearance');
        if (appearance) this.display.add(appearance.mesh);

        var camera = entity.getComponent('Camera');
        if (camera) this.display.add(camera.camera);
    };

    Game.prototype.removeEntity = function(entity) {
        var index = this.entities.indexOf(entity);
        if (index != -1) {
            this.entities.splice(index);

            var appearance = entity.getComponent('Appearance');
            if (appearance) this.display.remove(appearance.mesh);

            var camera = entity.getComponent('Camera');
            if (camera) this.display.remove(camera.camera);
        }
    };

    Game.prototype.debugList = function() {
        var html = '<ul>';
        this.entities.forEach(function(entity, i) {
            if (entity.tag === 'Resource' || entity.tag === null || entity.tag === 'Camera') return;
            html += '<li><a class="entity-details" href="#" data-id="' + i + '">' + entity.tag + '</a></li>';
        });
        html += '</ul>';

        document.getElementById('debug').innerHTML = html;

        var centerOnEntity = function(e) {
            var id = e.target.dataset.id;
            var entity = this.entities[id];
            this.camera.getComponent('Camera').follow(entity);
        }.bind(this);
        var links = document.querySelectorAll('.entity-details');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', centerOnEntity);
        }
    };

    Game.prototype.fixedUpdate = function(dt) {
        var i = this.entities.length;
        var entity;
        while (i) {
            i--;
            entity = this.entities[i];
            entity.fixedUpdate(dt);
        }
    };

    Game.prototype.update = function(dt, elapsed) {
        var i = this.entities.length;
        while (i) {
            i--;
            this.entities[i].update(dt, elapsed);
        }
        InputManager.update();
    };

    Game.prototype.run = function() {
        this.playing = true;

        var t0 = performance.now() - 16;
        var game = this;
        var logicRate = 200; // 5fps
        var lastLogicTick;

        InputManager.observe(document.body);
        this.entities.forEach(function(entity) {
            entity.broadcast('Start', game);
        });

        var render = function(t) {
            try {
                var dt = t - t0;
                var elapsed = (t - lastLogicTick) / logicRate;
                t0 = t;

                if (game.playing) requestAnimationFrame(render);
                game.update(dt, elapsed);
                game.display.render();
            } catch(e) {
                game.stop();
                throw e;
            }
        };
        render(performance.now());

        var logic = function() {
            var dt;
            lastLogicTick = performance.now();
            dt = lastLogicTick - t0;
            if (game.playing) setTimeout(logic, logicRate);
            game.fixedUpdate(dt);
        };
        logic();
    };

    Game.prototype.stop = function() {
        InputManager.detach();
        this.playing = false;
    };

    return Game;
});