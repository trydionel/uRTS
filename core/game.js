define(function(require) {
    require('util/math');

    var requestAnimationFrame = require('lib/requestAnimationFrame');
    var InputManager = require('core/inputManager');
    var Display = require('core/display');
    var GUI = require('core/gui');
    var Factory = require('core/factory');
    var CommandInterpreter = require('core/commandInterpreter');
    var async = require('lib/async');
    var EventBus = require('core/eventBus');
    var $ = require('jquery');

    function Game(options) {
        this.playing = true;
        this.loaded = false;

        this.width = 800;
        this.height = 600;

        this.systems = {
            input: InputManager,
            scene: this.scene,
            gui: new GUI(),
            display: new Display(this.width, this.height),
            command: new CommandInterpreter(),
            bus: EventBus
        };

        EventBus.immediateMode = true;
        EventBus.subscribe('toggleMenu', this.toggleMenu.bind(this));
    }

    Game.prototype.load = function() {
        var game = this;
        var instrument = function(label, fn) {
            return function(next) {
                console.time(label);
                fn(next);
                console.timeEnd(label);
            };
        };
        async.series([
            instrument("Preloading factory resources", function(next) {
                Factory.storage = game.scene;
                Factory.preloadResources(next);
            }),
            instrument("Initializing rendering manager", function(next) {
                game.systems.display.initialize(next);
            }),
            instrument("Initializing input", function(next) {
                InputManager.width = game.width;
                InputManager.height = game.height;
                InputManager.observe(document.body);
                next();
            }),
            instrument("Loading scene", function(next) {
                game.systems.scene = game.scene;
                game.scene.onLoad(function(scene) {
                    game.systems.gui.player = game.players[0];
                });
                game.scene.onLoad(next);
                game.scene.load();
            })
        ], function() {
            console.log("Loaded!");
            game.loaded = true;
            EventBus.immediateMode = false;
            game.run();
        });
    };

    Game.prototype.debugList = function() {
        var html = '<ul>';
        this.scene.entities.forEach(function(entity, i) {
            if (entity.tag === 'Resource' || entity.tag === null || entity.tag === 'Camera') return;
            html += '<li><a class="entity-details" href="#" data-id="' + i + '">' + entity.tag + '</a></li>';
        });
        html += '</ul>';

        document.getElementById('debug').innerHTML += html;

        var camera = this.scene.entities.filter(function(e) { return e.tag === 'Camera'; })[0];
        var centerOnEntity = function(e) {
            var id = e.target.dataset.id;
            var entity = this.scene.entities[id];
            camera.getComponent('Camera').follow(entity);
        }.bind(this);
        var links = document.querySelectorAll('.entity-details');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', centerOnEntity);
        }
    };

    Game.prototype.toggleMenu = function() {
        this._menuShown = !this._menuShown;
        $('#menu').toggle(this._menuShown);
    };

    Game.prototype.fixedUpdate = function(dt) {
        for (var system in this.systems) {
            var _ref = this.systems[system]; if (_ref && _ref.fixedUpdate) _ref.fixedUpdate(dt);
        }
        InputManager.lateUpdate(); // FIXME: When does this need to run...?
    };

    Game.prototype.update = function(dt, elapsed) {
        this.execute('update', dt, elapsed);
    };

    var slice = Array.prototype.slice;
    Game.prototype.execute = function(method) {
       var args = slice.call(arguments, 1);
       for (var name in this.systems) {
           var system = this.systems[name];
           if (system[method]) {
               system[method].apply(system, args);
           }
       }
    };

    var now;
    if (window.performance && window.performance.now) {
        now = window.performance.now.bind(window.performance);
    } else {
        now = Date.now.bind(Date);
    }

    Game.prototype.run = function() {
        this.playing = true;

        var t0 = now() - 16;
        var game = this;

        this.debugList();
        this.scene.entities.forEach(function(entity) {
            entity.broadcast('Start', game);
        });

        var accumulator = 0;
        var logicRate = 200; // 5fps
        var maxAccumulator = 1000; // a full second
        var runloop = function(t) {
            if (game.playing) requestAnimationFrame(runloop);

            var dt = t - t0;
            accumulator += dt;

            var elapsed = Math.clamp(accumulator / logicRate, 0, 1);
            game.update(dt, elapsed);

            if (accumulator > maxAccumulator) {
                accumulator = maxAccumulator;
            }

            while (accumulator > logicRate) {
                game.fixedUpdate(logicRate);
                accumulator -= logicRate;
            }

            t0 = t;
        };
        runloop(now());
    };

    Game.prototype.stop = function() {
        this.playing = false;
    };

    return Game;
});