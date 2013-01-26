define(function(require) {
    require('util/math');

    var requestAnimationFrame = require('lib/requestAnimationFrame');
    var InputManager = require('core/inputManager');
    var Display = require('core/display');
    var Factory = require('core/factory');
    var async = require('lib/async');

    function Game(options) {
        this.playing = true;
        this.loaded = false;

        this.entities = [];
        this.width = 800;
        this.height = 600;
        this.display = new Display(this, this.width, this.height);
    }

    Game.prototype.load = function() {
        var game = this;
        async.series([
            function(next) {
                console.log("Preloading factory resources...");
                console.time('duration');
                Factory.storage = game;
                Factory.preloadResources(next);
                console.timeEnd('duration');
            },
            function(next) {
                console.log("Initializing rendering manager...");
                console.time('duration');
                game.display.initialize(next);
                console.timeEnd('duration');
            },
            function(next) {
                console.log("Loading scene...");
                console.time('duration');
                game.scene.onLoad(next);
                game.scene.load();
                console.timeEnd('duration');
            }
        ], function() {
            console.log("Loaded!");
            game.loaded = true;
            game.run();
        });
    };

    Game.prototype.addEntity = function(entity) {
        this.entities.push(entity);

        // Ensure the 'Start' event is triggered on new entities, even after the
        // initial loading phase has completed.
        if (this.loaded) entity.broadcast('Start');
    };

    Game.prototype.removeEntity = function(entity) {
        var index = this.entities.indexOf(entity);
        if (index != -1) {
            this.entities.splice(index, 1);
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

        var camera = this.entities.filter(function(e) { return e.tag === 'Camera'; })[0];
        var centerOnEntity = function(e) {
            var id = e.target.dataset.id;
            var entity = this.entities[id];
            camera.getComponent('Camera').follow(entity);
        }.bind(this);
        var links = document.querySelectorAll('.entity-details');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', centerOnEntity);
        }
    };

    Game.prototype.fixedUpdate = function(dt) {
        var entity;
        for (var i in this.entities) {
            entity = this.entities[i];

            var appearance = entity.getComponent('Appearance');
            if (appearance && !appearance.displayed) {
                this.display.add(appearance.mesh);
                appearance.displayed = true;
            }

            entity.fixedUpdate(dt);
        }
    };

    Game.prototype.update = function(dt, elapsed) {
        InputManager.update();

        var entity;
        for (var i in this.entities) {
            entity = this.entities[i];
            entity.update(dt, elapsed);
        }
    };

    var now = function() {
        if (window.performance && window.performance.now)
            return window.performance.now();
        else
            return Date.now();
    };

    Game.prototype.run = function() {
        this.playing = true;

        var t0 = now() - 16;
        var game = this;
        var logicRate = 200; // 5fps
        var lastLogicTick;

        InputManager.observe(document.body);
        this.debugList();
        this.entities.forEach(function(entity) {
            entity.broadcast('Start', game);
        });

        var render = function(t) {
            try {
                var dt = t - t0;
                var elapsed = Math.clamp((t - lastLogicTick) / logicRate, 0, 1);
                t0 = t;

                if (game.playing) requestAnimationFrame(render);
                game.update(dt, elapsed);
                game.display.render();
            } catch(e) {
                game.stop();
                throw e;
            }
        };
        render(now());

        var logic = function() {
            try {
                var dt;
                lastLogicTick = now();
                dt = lastLogicTick - t0;
                if (game.playing) setTimeout(logic, logicRate);
                game.fixedUpdate(dt);
            } catch (e) {
                game.stop();
                throw e;
            }
        };
        logic();
    };

    Game.prototype.stop = function() {
        InputManager.detach();
        this.playing = false;
    };

    return Game;
});