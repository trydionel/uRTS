/*global webkitRequestAnimationFrame: true, SimplexNoise: true, EasyStar: true */
var renderToCanvas = function(width, height, renderFunction) {
    var buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    renderFunction(buffer.getContext('2d'));
    return buffer;
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
        
        var game = this;
        var render = function(dt) {
            if (game.playing) webkitRequestAnimationFrame(render);
            game.render(game.context);
        };
        render();
        
        var logic = function(dt) {
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
        var tx, ty;
        radius = radius || 1;
        
        for (var dy = -radius; dy <= radius; dy++) {
            for (var dx = -radius; dx <= radius; dx++) {
                if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                    tx = x + dx;
                    ty = y + dy;
                    if (tx >= 0 && tx < this.size && ty >= 0 && ty < this.size) {
                        this.fog[ty][tx] &= ~FOG_MASK;
                    }
                }
            }
        }
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
        this.base = new uRTS.Base(this, this.field);
        this.entities.push(this.base);

        // Create opening in fog-of-war around the base
        this.clearFog(this.base.x, this.base.y, 6);
    };

    Player.prototype.initializeWorkers = function(n) {
        var worker;        
        for (var i = 0; i < n; i++) {
            worker = new uRTS.Worker(this, this.field);
            this.entities.push(worker);
        }        
    };
    
    Player.prototype.initializeWarriors = function(n) {
        var warrior;        
        for (var i = 0; i < n; i++) {
            warrior = new uRTS.Warrior(this, this.field);
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
        var terrain = [];
        var simplex = new SimplexNoise();
        var n;
        
        // Init empty terrain
        for (var _i = 0; _i < this.size; _i++) terrain.push([]);
        
        // Lay noise into terrain. Double-scale noise for a more
        // tangible look-n-feel.
        for (var i = 0; i < this.size / 2.0; i++) {
            for (var j = 0; j < this.size / 2.0; j++) {
                n = Math.round(simplex.noise(i, j) + 1);
                terrain[2 * i][2 * j] = n;
                terrain[2 * i + 1][2 * j] = n;
                terrain[2 * i][2 * j + 1] = n;
                terrain[2 * i + 1][2 * j + 1] = n;
            }
        }
        
        this.terrain = terrain;
    };
    
    Field.prototype.initializePath = function() {
        this.path = new EasyStar.js([1], this.onPathComplete.bind(this));
        this.path.setGrid(this.terrain);
    };
    
    Field.prototype.initializeResources = function(n) {
        var resource;
        
        // Keep an index of resources for faster lookups
        this.resources = [];
        for (var i = 0; i < n; i++) {
            resource = new uRTS.Resource(this);
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
                    lum = 10 + (1 + height) / 8.0 * 100;
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
            return resource.isAvailable(player) &&
                !player.underFog(resource.x, resource.y);
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
            console.log(e);
            return null;
        }
    };

    return Field;
})();

uRTS.Base = (function() {
    function Base(player, field) {
        this.player = player;
        this.field = field;
        this.x = Math.floor(Math.random() * field.size);
        this.y = Math.floor(Math.random() * field.size);
        this.quantity = 0;
    }
    
    Base.prototype.update = function(dt) {};
    
    Base.prototype.render = function(context) {
        var size = context.canvas.width / this.field.size;
        context.fillStyle = this.player.color;
        context.fillRect(size * (this.x - 1), size * (this.y - 1), 3 * size, 3 * size);
    };
    
    return Base;
})();

uRTS.Worker = (function() {
    function Worker(player, field) {
        this.player = player;
        this.field = field;
        this.x = this.player.base.x + Math.floor(Math.random() * 4 - 2);
        this.y = this.player.base.y + Math.floor(Math.random() * 4 - 2);
        this.quantity = 0;
        this.capacity = 10;
        this.path = null;
        this.pathIndex = 0;
        this.target = null;
    }
    
    Worker.prototype.update = function(dt) {
        if (this.atTarget()) {
            this.clearPath();
            
            if (this.target instanceof uRTS.Base) {
                this.deposit(this.target);
            } else if (this.target instanceof uRTS.Resource) {
                if (this.isFull()) {
                    this.search('base');
                } else {
                    this.consume(this.target);
                }
            }
        } else if (this.path) {
            this.move();
        } else {
            this.search('resource');
            
            // Return home if no resources left
            if (!this.target) {
                console.log("No resources found. Returning to base.");
                this.search('base');
            }
        }
    };
    
    Worker.prototype.isFull = function() {
        return this.quantity >= this.capacity;
    };
    
    Worker.prototype.atTarget = function() {
        return this.target &&
            Math.abs(this.target.x - this.x) <= 1 &&
            Math.abs(this.target.y - this.y) <= 1;
    };
    
    Worker.prototype.deposit = function(base) {
        if (this.quantity > 0) {
            this.quantity -= 1;
            base.quantity += 1;
        } else {
            this.setTarget(null);
        }
    };
    
    Worker.prototype.consume = function(resource) {
        var qty = resource.consume();
        if (qty > 0) {
            this.quantity += qty;
        } else {
            this.setTarget(null);
        }
    };
    
    Worker.prototype.move = function() {
        if (!this.path) return;
        
        this.x = this.path[this.pathIndex].x;
        this.y = this.path[this.pathIndex].y;
        this.pathIndex++;
      
        if (this.pathIndex >= this.path.length) {
            this.clearPath();
        }
    };
    
    Worker.prototype.search = function(tag) {
        if (tag === 'resource') {
            this.setTarget(this.field.nearbyResource(this.player, this.x, this.y));
        } else if (tag === 'base') {
            this.setTarget(this.player.base);
        }

        if (this.target) {
            this.path = this.field.search(this.x, this.y, this.target.x, this.target.y);
            this.pathIndex = 0;
        }
    };
    
    Worker.prototype.setTarget = function(target) {
        if (this.target) this.target.occupied = null;
        this.target = target;
        if (this.target) this.target.occupied = this.player;
    };
    
    Worker.prototype.clearPath = function() {
        this.path = null;
        this.pathIndex = 0;
    };
            
    Worker.prototype.render = function(context) {
        var size = context.canvas.width / this.field.size;
        context.fillStyle = 'dark' + this.player.color;
        context.fillRect(size * this.x, size * this.y, size, size);
        
        var capacity = this.quantity / this.capacity;
        context.fillStyle = 'yellow';
        context.fillRect(size * this.x, size * this.y, size * capacity, 2);

    };
    
    return Worker;
})();

uRTS.Resource = (function() {
    function Resource(field) {
        this.field = field;
        this.quantity = 25;
        this.maxQuantity = 25;
        this.x = Math.floor(Math.random() * field.size);
        this.y = Math.floor(Math.random() * field.size);
        this.occupied = false;
    }
    
    Resource.prototype.update = function(dt) {
        // Slowly regrow resources
        if (Math.random() > 0.99) {
            this.quantity += 0.2 * this.maxQuantity;
            this.quantity = Math.min(this.maxQuantity, this.quantity);
        }
    };
        
    Resource.prototype.render = function(context) {
        var size = context.canvas.width / this.field.size;
        context.fillStyle = 'white';
        context.fillRect(size * this.x, size * this.y, size, size);
        
        var remaining = this.quantity / this.maxQuantity;
        context.fillStyle = 'red';
        context.fillRect(size * this.x, size * this.y, size * remaining, 2);
    };
    
    Resource.prototype.isAvailable = function(player) {
        return this.quantity > (0.6 * this.maxQuantity) &&
            this.occupied !== player;
    };
    
    Resource.prototype.consume = function() {
        if (this.quantity > 0) {
            this.quantity -= 1;
            return 1;
        }
        return 0;
    };

    return Resource;
})();

uRTS.Warrior = (function() {
    function Warrior(player, field) {
        this.player = player;
        this.field = field;
        this.x = this.player.base.x + Math.floor(Math.random() * 4 - 2);
        this.y = this.player.base.y + Math.floor(Math.random() * 4 - 2);
        this.path = null;
        this.pathIndex = 0;
    }
    
    Warrior.prototype.update = function(dt) {
        this.player.clearFog(this.x, this.y, 3);
        
        if (this.path) {
            this.move();
        } else {
            this.explore();
        }
    };
    
    Warrior.prototype.move = function() {
        if (!this.path) return;
        
        this.x = this.path[this.pathIndex].x;
        this.y = this.path[this.pathIndex].y;
        this.pathIndex++;
      
        if (this.pathIndex >= this.path.length) {
            this.clearPath();
        }
    };

    Warrior.prototype.clearPath = function() {
        this.path = null;
        this.pathIndex = 0;
    };
    
    Warrior.prototype.explore = function() {
        var destX = this.x + Math.round(Math.random() * 10 - 5);
        var destY = this.y + Math.round(Math.random() * 10 - 5);
        this.path = this.field.search(this.x, this.y, destX, destY);
    };
    
    Warrior.prototype.render = function(context) {
        var size = context.canvas.width / this.field.size;
        context.fillStyle = 'light' + this.player.color;
        context.fillRect(size * this.x, size * this.y, size, size);
    };
    
    return Warrior;
})();

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