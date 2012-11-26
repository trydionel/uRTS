define(function(require) {

    var Scene = require('core/scene');
    var Factory = require('core/factory');
    var Player = require('core/player');

    function BattleScene() {
        Scene.apply(this, arguments);
    }

    BattleScene.prototype = Object.create(Scene.prototype);

    BattleScene.prototype.load = function() {
        var scene = this;
        var game = this.game;

        var field = Factory.create('field');
        game.field = field;

        game.players = [];

        var player1 = new Player(game, 'blue', game.field, { human: true });
        game.players.push(player1);
        game.entities.push(player1);

        var player2 = new Player(game, 'red', game.field);
        game.players.push(player2);
        game.addEntity(player2);

        scene.loaded();
    };

    return BattleScene;
});