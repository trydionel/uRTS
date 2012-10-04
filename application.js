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