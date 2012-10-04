define(function(require) {
    var Entity = require('core/entity');
    
    var Transform = require('components/transform');
    var MovementSystem = require('components/movementSystem');
    var Pathfinding = require('components/pathfinding');
    var Team = require('components/team');
    var Storage = require('components/storage');
    var WorkerAI = require('components/workerAI');
    var WarriorAI = require('components/warriorAI');
    
    var CellView = require('views/cellView');
    
    function createWorker(field, player, x, y) {
        var entity = new Entity();
        entity.field = field; // FIXME
        entity.player = player;
        entity.setTag('Worker');
        entity.addComponent(new Transform(x, y));
        entity.addComponent(new MovementSystem(1));
        entity.addComponent(new Pathfinding());
        entity.addComponent(new Team(player.color));
        entity.addComponent(new Storage(10, 0));
        entity.addComponent(new WorkerAI());
        entity.setView(new CellView('#999'));
        return entity;
    }
    
    function createBase(field, player, x, y) {
        var entity = new Entity();
        entity.field = field; // FIXME
        entity.player = player;
        entity.setTag('Base');
        entity.addComponent(new Transform(x, y));
        entity.addComponent(new Team(player.color));
        entity.addComponent(new Storage(Infinity, 0));
        entity.setView(new CellView('#333', 3));
        return entity;
    }
    
    function createResource(field, x, y) {
        var entity = new Entity();
        entity.field = field; // FIXME
        entity.setTag('Resource');
        entity.addComponent(new Transform(x, y));
        entity.addComponent(new Storage(25, 25));
        entity.setView(new CellView('#fff'));
        return entity;
    }
    
    function createWarrior(field, player, x, y) {
        var entity = new Entity();
        entity.field = field; // FIXME
        entity.player = player;
        entity.setTag('Warrior');
        entity.addComponent(new Transform(x, y));
        entity.addComponent(new MovementSystem(1));
        entity.addComponent(new Pathfinding());
        entity.addComponent(new Team(player.color));
        entity.addComponent(new WarriorAI());
        entity.setView(new CellView('#e88'));
        return entity;
    }
    
    return {
        worker: createWorker,
        warrior: createWarrior,
        base: createBase,
        resource: createResource
    };
});