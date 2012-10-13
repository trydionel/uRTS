require.config({
    paths: {
        'underscore': 'lib/underscore',
        'machina': 'lib/machina',
        'text': 'lib/text',
        'json': 'lib/json',
        'EasyStar': 'lib/easystar-0.1.0.min',
        'SimplexNoise': 'lib/perlin-noise-simplex'
    }
});

require(['core/game'], function(Game) {
    var game = new Game();
    game.run();

    document.getElementById('start').addEventListener('click', function() {
        game.run();
    });

    document.getElementById('stop').addEventListener('click', function() {
        game.stop();
    });

    document.getElementById('reroll').addEventListener('click', function() {
       game.stop();
       game = new Game();
       game.run();
    });
});