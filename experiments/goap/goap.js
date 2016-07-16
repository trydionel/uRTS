require.config({
    baseUrl: '../..',
    paths: {
        'underscore': 'lib/underscore',
        'machina': 'lib/machina',
        'text': 'lib/text',
        'json': 'lib/json',
        'EasyStar': 'lib/easystar-0.1.0.min',
        'SimplexNoise': 'lib/perlin-noise-simplex',
        'THREE': 'lib/three.max',
        'Stats': 'lib/stats.min',
        'jquery': 'lib/jquery',
        'mediator': 'lib/mediator',
        'mustache': 'lib/mustache',
        'async': 'lib/async'
    }
});

require(['core/game', 'experiments/goap/scene'], function(Game, GOAPScene) {
    var game = window.game = new Game();
    game.scene = new GOAPScene(game);
    game.load();

    document.getElementById('start').addEventListener('click', function() {
        game.run();
    });

    document.getElementById('stop').addEventListener('click', function() {
        game.stop();
    });
});