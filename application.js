require.config({
    paths: {
        'underscore': 'lib/underscore',
        'machina': 'lib/machina',
        'text': 'lib/text',
        'json': 'lib/json',
        'EasyStar': 'lib/easystar-0.1.0.min',
        'SimplexNoise': 'lib/perlin-noise-simplex',
        'THREE': 'lib/three.max',
        'Stats': 'lib/stats.min',
        'async': 'lib/async',
        'mediator': 'lib/mediator'
    }
});

require(['core/game', 'scenes/battle'], function(Game, BattleScene) {
    var game = window.game = new Game();
    game.scene = new BattleScene(game);
    game.load();

    document.getElementById('start').addEventListener('click', function() {
        game.run();
    });

    document.getElementById('stop').addEventListener('click', function() {
        game.stop();
    });
});