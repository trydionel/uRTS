define(function(require) {

    var EventBus = require('core/eventBus');
    var $ = require('jquery');

    function CommandInterpreter() {
        this.bindConsole();
        this.debug();
    }

    CommandInterpreter.prototype.bindConsole = function() {
        $('body').on('submit', '#console', function(event) {
            event.preventDefault();

            var form = $(event.currentTarget);
            var message = form.find('input:text').val();
            form[0].reset();

            this.handleMessage(message);
        }.bind(this));
    };

    CommandInterpreter.prototype.handleMessage = function(message) {
        var parts = message.split(' ');
        var channel = parts[0];
        var args = parts.splice(1, parts.length);

        console.log("Command:", channel, args);
        EventBus.publish(channel, args);
    };

    CommandInterpreter.prototype.debug = function() {
        EventBus.subscribe('', function(event, channel) {
            console.debug('Event Posted:', channel.namespace, event);
        });
    };

    return CommandInterpreter;
});