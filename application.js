/*global webkitRequestAnimationFrame: true, SimplexNoise: true, EasyStar: true */
var renderToCanvas = function(width, height, renderFunction) {
    var buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    renderFunction(buffer.getContext('2d'));
    return buffer;
};

var Brownian = (function() {
    function Brownian(width, height, octaves, frequency) {
        this.width = width;
        this.height = height;
        this.octaves = octaves;
        this.frequency = frequency || 1;
        this.lacunarity = 1.92;
        this.gain = 0.5;

        this.simplex = new SimplexNoise();
    }

    Brownian.prototype.toArray = function() {
        var row;
        this.data = [];

        for (var y = 0; y < this.height; y++) {
            row = [];
            for (var x = 0; x < this.width; x++) {
                row.push(this.noise(x, y));
            }
            this.data.push(row);
        }

        return this.data;
    };

    Brownian.prototype.noise = function(x, y) {
        var sum = 0,
            freq = 1.0,
            amp = 1.0,
            n;

        for (var i = 0; i < this.octaves; i++) {
              n = this.simplex.noise(x * freq, y * freq);
              sum += n*amp;
              freq *= this.lacunarity;
              amp *= this.gain;
        }

        return sum;
    };

    return Brownian;
})();

var kNearestNeighborAverage = function(data, width, height, k) {
    var out, n, values, sum;

    out = [];
    k = k || 2;
    sum = function(a, b) { return a + b; };

    for (var y = 0; y < height; y++) out.push([]);

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            values = [];

            for (var dy = -k; dy <= k; dy++) {
                for (var dx = -k; dx <= k; dx++) {
                    if ((x + dx >= 0) && (x + dx < width) && (y + dy >= 0) && (y + dy < height)) {
                        n = data[y + dy][x + dx];
                        values.push(n);
                    }
                }
            }

            out[y][x] = values.reduce(sum, 0) / values.length;
        }
    }

    return out;
};

var quantize = function(data, steps) {
    for (var y = 0; y < data.length; y++) {
        for (var x = 0; x < data[y].length; x++) {
            data[y][x] = Math.round(data[y][x] * steps);
        }
    }

    return data;
};

var uRTS = {};
uRTS.Game = (function() {
    function Game(options) {
        this.playing = true;
        this.field = new uRTS.Field(100);
        this.players = [
            new uRTS.Player('blue', this.field, { human: true }),
            new uRTS.Player('red', this.field)
        ];
        this.canvas = document.getElementById('game');
        this.context = this.canvas.getContext('2d');

        this.entities = [this.field, this.players[1], this.players[0]];
    }

    Game.prototype.update = function(dt) {
        this.entities.forEach(function(entity) {
            entity.update(dt);
        });
    };

    Game.prototype.render = function(context) {
        this.entities.forEach(function(entity) {
            entity.render(context);
        });
    };

    Game.prototype.run = function() {
        this.playing = true;

        var t0 = +new Date() - 16;
        var game = this;
        var render = function() {
            if (game.playing) webkitRequestAnimationFrame(render);
            game.render(game.context);
        };
        render();

        var logic = function() {
            var dt = +new Date() - t0;
            game.update(dt);
            if (game.playing) setTimeout(logic, 200); // 5fps
        };
        logic();
    };

    Game.prototype.stop = function() {
        this.playing = false;
    };

    return Game;
})();

uRTS.FogOfWar = (function() {
    var FOG_MASK = 1;

    function FogOfWar(size) {
        this.size = size;

        var row, fog = [];
        for (var j = 0; j < this.size; j++) {
            row = [];
            for (var i = 0; i < this.size; i++) {
                row.push(FOG_MASK);
            }
            fog.push(row);
        }
        this.fog = fog;
    }

    FogOfWar.prototype.presentAt = function(x, y) {
        return this.fog[y][x] === FOG_MASK;
    };

    FogOfWar.prototype.reveal = function(x, y, radius) {
        var tx, ty, current, updated, changed;
        radius = radius || 1;

        for (var dy = -radius; dy <= radius; dy++) {
            for (var dx = -radius; dx <= radius; dx++) {
                if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                    tx = x + dx;
                    ty = y + dy;
                    if (tx >= 0 && tx < this.size && ty >= 0 && ty < this.size) {
                        current = this.fog[ty][tx];
                        updated = current & ~FOG_MASK;
                        changed |= (current !== updated);

                        this.fog[ty][tx] = updated;
                    }
                }
            }
        }

        if (changed) this._cached = null;
    };

    FogOfWar.prototype.render = function(context) {
        this._cached = this._cached || renderToCanvas(context.canvas.width, context.canvas.height, function(buffer) {
            var size = buffer.canvas.width / this.size;
            buffer.fillStyle = 'darkgray';

            for (var y = 0; y < this.size; y++) {
                for (var x = 0; x < this.size; x++) {
                    if (this.presentAt(x, y)) {
                        buffer.fillRect(size * x, size * y, size, size);
                    }
                }
            }
        }.bind(this));

        context.drawImage(this._cached, 0, 0);
    };

    return FogOfWar;
})();

uRTS.Player = (function() {
    function Player(color, field, options) {
        options = options || {};

        this.color = color;
        this.field = field;
        this.human = options.human;
        this.entities = [];
        this.fog = new uRTS.FogOfWar(this.field.size);

        this.initializeBase();
        this.initializeWorkers(3);
        this.initializeWarriors(1);
    }

    Player.prototype.initializeBase = function() {
        var x = Math.floor(Math.random() * (this.field.size - 4)) + 2;
        var y = Math.floor(Math.random() * (this.field.size - 4)) + 2;
        this.base = createBase(this.field, this, x, y);
        this.entities.push(this.base);

        // Create opening in fog-of-war around the base
        this.clearFog(x, y, 6);
    };

    Player.prototype.initializeWorkers = function(n) {
        var worker, x, y, position = this.base.getComponent('Transform');
        for (var i = 0; i < n; i++) {
            x = position.x + Math.floor(Math.random() * 4 - 2);
            y = position.y + Math.floor(Math.random() * 4 - 2);
            worker = createWorker(this.field, this, x, y);
            this.entities.push(worker);
        }
    };

    Player.prototype.initializeWarriors = function(n) {
        var warrior, x, y, position = this.base.getComponent('Transform');
        for (var i = 0; i < n; i++) {
            x = position.x + Math.floor(Math.random() * 4 - 2);
            y = position.y + Math.floor(Math.random() * 4 - 2);
            warrior = createWarrior(this.field, this, x, y);
            this.entities.push(warrior);
        }
    };

    Player.prototype.update = function(dt) {
        this.entities.forEach(function(entity) {
            entity.update(dt);
        });
    };

    Player.prototype.render = function(context) {
        this.entities.forEach(function(entity) {
            entity.render(context);
        });
        if (this.human) this.fog.render(context);
    };


    Player.prototype.underFog = function(x, y) {
        return this.fog.presentAt(x, y);
    };

    Player.prototype.clearFog = function(x, y, radius) {
        this.fog.reveal(x, y, radius);
    };

    return Player;
})();

uRTS.Field = (function() {
    function Field(size) {
        this.size = size;
        this.entities = [];
        this.terrain = [];

        this.initializeTerrain();
        this.initializePath();
        this.initializeResources(Math.sqrt(2 * this.size));
    }

    Field.prototype.initializeTerrain = function() {
        var brownian = new Brownian(this.size, this.size, 6);
        this.terrain = quantize(kNearestNeighborAverage(brownian.toArray(), this.size, this.size, 2), 5);
    };

    Field.prototype.initializePath = function() {
        this.path = new EasyStar.js([0], this.onPathComplete.bind(this));
        this.path.setGrid(this.terrain);
    };

    Field.prototype.initializeResources = function(n) {
        var resource, x, y;

        // Keep an index of resources for faster lookups
        this.resources = [];
        for (var i = 0; i < n; i++) {
            x = Math.floor(Math.random() * this.size);
            y = Math.floor(Math.random() * this.size);
            resource = createResource(this, x, y); //new uRTS.Resource(this);
            this.resources.push(resource);
            this.entities.push(resource);
        }
    };

    Field.prototype.update = function(dt) {
        this.entities.forEach(function(entity) {
            entity.update(dt);
        });
    };

    Field.prototype.render = function(context) {
        this.renderSelf(context);
        this.entities.forEach(function(entity) {
            entity.render(context);
        });
    };

    Field.prototype.renderSelf = function(context) {
        this._cachedImage = this._cachedImage || renderToCanvas(context.canvas.width, context.canvas.height, function(buffer) {
            var size = context.canvas.width / this.size;
            var color, lum;
            this.terrain.forEach(function(row, y) {
                row.forEach(function(height, x) {
                    lum = 20 + (1 + height) / 8.0 * 100;
                    color = 'hsl(90, 60%, ' + lum + '%)';

                    buffer.fillStyle = color;
                    buffer.fillRect(size * x, size * y, size, size);
                });
            });
        }.bind(this));
        context.drawImage(this._cachedImage, 0, 0);
    };

    Field.prototype.availableResources = function(player) {
        return this.resources.filter(function(resource) {
            var storage  = resource.getComponent('Storage');
            var position = resource.getComponent('Transform');
            return !storage.isEmpty() && !player.underFog(position.x, position.y);
        });
    };

    Field.prototype.nearbyResource = function(player, x, y) {
        var available = this.availableResources(player);
        var manhattan = function(x1, y1, x2, y2) {
            return Math.abs(x2 - x1) + Math.abs(y2 - y1);
        };
        available.sort(function(a, b) {
            return manhattan(a.x, a.y, x, y) - manhattan(b.x, b.y, x, y);
        });
        return available[0];
    };

    Field.prototype.onPathComplete = function(path) {
        this._lastPath = path;
    };

    Field.prototype.search = function(sx, sy, fx, fy, callback) {
        try {
            this.path.setPath(sx, sy, fx, fy);
            this.path.calculate();
            return this._lastPath;
        } catch(e) {
            return null;
        }
    };

    return Field;
})();

uRTS.Entity = (function() {
    function Entity() {
        this.components = [];
        this.view = null;
        this.tag = null;
    }

    Entity.prototype.addComponent = function(component) {
        component.entity = this;
        this.components.push(component);
    };

    Entity.prototype.getComponent = function(name) {
        var found = this.components.filter(function(component) {
            return component.constructor.name == name;
        });
        return found[0];
    };

    Entity.prototype.removeComponent = function(component) {
        if (component.entity === this) {
            component.entity = null;
            this.components.splice(this.components.indexOf(component));
        }
    };

    Entity.prototype.broadcast = function(message, data) {
        console.log(this, message, data);
        var method = "on" + message;
        this.components.forEach(function(component) {
            if (component[method]) {
                component[method](data);
            }
        });
    };

    Entity.prototype.setTag = function(tag) {
        this.tag = tag;
    };

    Entity.prototype.setView = function(view) {
        this.view = view;
    };

    Entity.prototype.update = function(dt) {
        this.components.forEach(function(component) {
            if (component.update) {
                component.update(this, dt);
            }
        }.bind(this));
    };

    Entity.prototype.render = function(context) {
        this.view.render(this, context);
    };

    return Entity;
})();


var Transform = (function() {
    function Transform(x, y) {
        this.x = x;
        this.y = y;
    }

    return Transform;
})();

var MovementSystem = (function() {
    var EPSILON = 0.01;

    function MovementSystem(speed) {
        this.speed = 1; //speed;
        this.direction = { x: 0, y: 0 };
        this.target = null;
    }

    MovementSystem.prototype.isMoving = function() {
        return this.direction.x !== 0 && this.direction.y !== 0;
    };

    MovementSystem.prototype.move = function(direction) {
        this.direction = direction;
    };

    MovementSystem.prototype.moveTo = function(target) {
        var position = this.entity.getComponent('Transform');

        this.target = target;
        this.move({
            x: target.x - position.x,
            y: target.y - position.y
        });
    };

    MovementSystem.prototype.atTarget = function() {
        var position = this.entity.getComponent('Transform');
        //var distance = Math.sqrt(Math.pow(position.x - this.target.x, 2) + Math.pow(position.y - this.target.y, 2));
        return this.target &&
            Math.abs(this.target.x - position.x) <= 1 &&
            Math.abs(this.target.y - position.y) <= 1;
    };

    MovementSystem.prototype.update = function(entity, dt) {
        var position = this.entity.getComponent('Transform');

        position.x += this.direction.x;
        position.y += this.direction.y;

        if (this.atTarget()) {
            this.target = null;
            this.move({ x: 0, y: 0 });
            this.entity.broadcast('TargetReached');
        }
    };

    return MovementSystem;
})();

var Team = (function() {
    function Team(color) {
        this.color = color;
    }

    return Team;
})();

var CellView = (function() {
    function CellView (color, size) {
        this.color  = color;
        this.size   = size || 1;
        this.offset = Math.floor(this.size / 2.0);
    }

    CellView.prototype.render = function(entity, context) {
        var scale = context.canvas.width / entity.field.size;
        var position = entity.getComponent('Transform');
        var team = entity.getComponent('Team');
        var storage = entity.getComponent('Storage');
        var x, y, w, h, capacity;

        if (!position) throw 'MissingComponent: CellView requires a Position component.';
        x = scale * (position.x - this.offset);
        y = scale * (position.y - this.offset);
        w = scale * this.size;
        h = scale * this.size;

        context.fillStyle = this.color;
        context.fillRect(x, y, w, h);

        if (team) {
            context.fillStyle = team.color;
            context.fillRect(x, y + h - 2, w, 2);
        }

        if (storage) {
            capacity = storage.quantity / storage.capacity;

            context.fillStyle = 'white';
            context.fillRect(x, y, w, 2);

            context.fillStyle = 'red';
            context.fillRect(x, y, capacity * w, 2);
        }
    };

    return CellView;
})();

var Pathfinding = (function() {
    function Pathfinding() {
        this.target = null;
        this.path = null;
        this.pathIndex = 0;
    }

    Pathfinding.prototype.search = function(target) {
        var position = this.entity.getComponent('Transform');

        this.setTarget(target);
        if (this.target) {
            this.path = this.entity.field.search(position.x, position.y, this.target.x, this.target.y);
            this.pathIndex = 0;
        }
    };

    Pathfinding.prototype.move = function() {
        if (!this.path) return;

        var motor = this.entity.getComponent('MovementSystem');
        if (!motor.isMoving()) {
            var x = this.path[this.pathIndex].x;
            var y = this.path[this.pathIndex].y;
            motor.moveTo({ x: x, y: y });
        }
    };

    Pathfinding.prototype.isPathing = function() {
        return !!this.path;
    };

    Pathfinding.prototype.setTarget = function(target) {
        if (this.target) this.target.occupied = null;
        this.target = target;
        if (this.target) this.target.occupied = this.player;
    };

    Pathfinding.prototype.clearPath = function() {
        this.path = null;
        this.pathIndex = 0;
    };

    Pathfinding.prototype.onTargetReached = function() {
        this.pathIndex++;
        if (this.pathIndex >= this.path.length) {
            this.entity.broadcast('PathComplete');
        }
    };

    Pathfinding.prototype.onPathComplete = function() {
        this.clearPath();
    };

    return Pathfinding;
})();

var WorkerAI = (function() {
    function WorkerAI() {
        this.target = null;
    }

    WorkerAI.prototype.onEmpty = function() {
        this.target = null;
    };

    WorkerAI.prototype.onResourceExhausted = function(resource) {
        if (this.target === resource) {
            this.target = null;
        }
    };

    WorkerAI.prototype.search = function(tag) {
        var position = this.entity.getComponent('Transform');
        var path     = this.entity.getComponent('Pathfinding');

        if (tag === 'resource') {
            this.target = this.entity.field.nearbyResource(this.entity.player, position.x, position.y);
        } else if (tag === 'base') {
            this.target = this.entity.player.base;
        }

        if (this.target) {
            path.search(this.target.getComponent('Transform'));
        }
    };

    WorkerAI.prototype.atTarget = function() {
        if (!this.target) return;

        var position = this.entity.getComponent('Transform');
        var destination = this.target.getComponent('Transform');

        return Math.abs(destination.x - position.x) <= 1 &&
            Math.abs(destination.y - position.y) <= 1;
    };


    WorkerAI.prototype.update = function(entity, dt) {
        var path    = this.entity.getComponent('Pathfinding');
        var storage = this.entity.getComponent('Storage');

        if (this.atTarget()) {
            path.clearPath();

            if (this.target.tag === 'Base') {
                storage.deposit(this.target);
            } else if (this.target.tag === 'Resource') {
                if (storage.isFull()) {
                    this.search('base');
                } else {
                    storage.consume(this.target);
                }
            }
        } else if (path.isPathing()) {
            path.move();
        } else {
            this.search('resource');

            // Return home if no resources left
            if (!this.target) {
                this.search('base');
            }
        }
    };

    return WorkerAI;
})();

var Storage = (function() {
    function Storage(capacity, initial) {
        this.capacity = capacity;
        this.quantity = initial;
    }

    Storage.prototype.isFull = function() {
        return this.quantity >= this.capacity;
    };

    Storage.prototype.isEmpty = function() {
        return this.quantity <= 0;
    };

    Storage.prototype.deposit = function(other) {
        var destination = other.getComponent('Storage');
        if (!destination) throw "Attempting to deposit into entity without storage component";

        if (this.isEmpty()) {
            this.entity.broadcast('Empty');
        } else {
            this.quantity -= 1;
            destination.quantity += 1;
        }
    };

    Storage.prototype.consume = function(other) {
        var source = other.getComponent('Storage');
        if (!source) throw "Attempting to consume from entity without storage component";

        if (this.isFull()) {
            this.entity.broadcast('Full');
        } else if (source.isEmpty()) {
            this.entity.broadcast('ResourceExhausted', source.entity);
        } else {
            source.deposit(this.entity);
        }
    };

    return Storage;
})();

var WarriorAI = (function() {
    function WarriorAI() {
    }

    WarriorAI.prototype.update = function(entity, dt) {
        var position = this.entity.getComponent('Transform');
        var path     = this.entity.getComponent('Pathfinding');

        this.entity.player.clearFog(position.x, position.y, 3);

        if (path.isPathing()) {
            path.move();
        } else {
            this.explore();
        }
    };

    WarriorAI.prototype.explore = function() {
        var position = this.entity.getComponent('Transform');
        var path     = this.entity.getComponent('Pathfinding');

        var destX = position.x + Math.round(Math.random() * 10 - 5);
        var destY = position.y + Math.round(Math.random() * 10 - 5);
        path.path = this.entity.field.search(position.x, position.y, destX, destY);
    };

    return WarriorAI;
})();

function createWorker(field, player, x, y) {
    var worker = new uRTS.Entity();
    worker.field = field; // FIXME
    worker.player = player;
    worker.setTag('Worker');
    worker.addComponent(new Transform(x, y));
    worker.addComponent(new MovementSystem(1));
    worker.addComponent(new Pathfinding());
    worker.addComponent(new Team(player.color));
    worker.addComponent(new Storage(10, 0));
    worker.addComponent(new WorkerAI());
    worker.setView(new CellView('#999'));
    return worker;
}

function createBase(field, player, x, y) {
    var base = new uRTS.Entity();
    base.field = field; // FIXME
    base.player = player;
    base.setTag('Base');
    base.addComponent(new Transform(x, y));
    base.addComponent(new Team(player.color));
    base.addComponent(new Storage(Infinity, 0));
    base.setView(new CellView('#333', 3));
    return base;
}

function createResource(field, x, y) {
    var base = new uRTS.Entity();
    base.field = field; // FIXME
    base.setTag('Resource');
    base.addComponent(new Transform(x, y));
    base.addComponent(new Storage(25, 25));
    base.setView(new CellView('#fff'));
    return base;
}

function createWarrior(field, player, x, y) {
    var worker = new uRTS.Entity();
    worker.field = field; // FIXME
    worker.player = player;
    worker.setTag('Warrior');
    worker.addComponent(new Transform(x, y));
    worker.addComponent(new MovementSystem(1));
    worker.addComponent(new Pathfinding());
    worker.addComponent(new Team(player.color));
    worker.addComponent(new WarriorAI());
    worker.setView(new CellView('#e88'));
    return worker;
}

var game = new uRTS.Game();
game.run();

document.getElementById('start').addEventListener('click', function() {
    game.run();
});

document.getElementById('stop').addEventListener('click', function() {
    game.stop();
});

document.getElementById('reroll').addEventListener('click', function() {
   game.stop();
   game = new uRTS.Game();
   game.run();
});