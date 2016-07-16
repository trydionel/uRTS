define(function(require) {

    var Mustache = require('mustache');
    var details = document.getElementById('details');
    var defaultTemplate = "{{ tag }}";
    var EventBus = require('core/eventBus');

    function Selectable() {

    }

    Selectable.prototype.select = function() {
        EventBus.trigger('SelectEntity', this.entity);

        var template = this.entity.details || defaultTemplate;
        var data = this.entity;
        this.entity.player.selected = this.entity;
        details.innerText = Mustache.render(template, data);
    };

    return Selectable;
});