define(function(require) {

    var Scene = require('core/scene');
    var Factory = require('core/factory');
    var Player = require('core/player');

    var Deposit = require('experiments/goap/actions/deposit');
    var Harvest = require('experiments/goap/actions/harvest');
    var Seek = require('experiments/goap/actions/seek');
    var ChooseTarget = require('experiments/goap/actions/chooseTarget');

    var CollectResources = require('experiments/goap/goals/collectResources');

    var Selector = require('experiments/goap/selector');
    var Planner = require('experiments/goap/planner');

    var Agent = require('experiments/goap/components/agent');

    function GOAPScene() {
        Scene.apply(this, arguments);
    }

    GOAPScene.prototype = Object.create(Scene.prototype);

    GOAPScene.prototype.load = function() {
        var field = Factory.create('field');
        var player = new Player(this.game, 'blue', field, { human: true, workers: 0, warriors: 0 });
        player.clearFog(0, 0, 1000);

        var selector = new Selector();
        selector.addGoal(new CollectResources());

        var planner = new Planner();
        planner.addAction(new Deposit());
        planner.addAction(new Harvest());
        planner.addAction(new Seek());
        planner.addAction(new ChooseTarget());

        var worker = Factory.create('worker', { field: field, player: player });
        worker.removeComponent('WorkerAI');
        worker.addComponent(new Agent({
            selector: selector,
            planner: planner
        }));

        this.loaded();
    };

    return GOAPScene;
});