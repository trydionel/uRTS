require.config({
    paths: {
        'underscore': 'lib/underscore',
        'machina': 'lib/machina',
        'text': 'lib/text',
        'json': 'lib/json',
        'EasyStar': 'lib/easystar-0.1.0.min',
        'SimplexNoise': 'lib/perlin-noise-simplex',
        'THREE': 'lib/three.min',
        'THREE-Shaders': 'lib/THREE-Shaders',
        'THREE-Postprocessing': 'lib/THREE-Postprocessing'
    },
    shim: {
        'THREE-Shaders': ['THREE'],
        'THREE-Postprocessing': ['THREE']
    }
});

require(['core/game'], function(Game) {
    var game = window.game = new Game();
    game.run();

    document.getElementById('start').addEventListener('click', function() {
        game.run();
    });

    document.getElementById('stop').addEventListener('click', function() {
        game.stop();
    });

    document.getElementById('reroll').addEventListener('click', function() {
       game.stop();
       game = window.game = new Game();
       game.run();
    });
});