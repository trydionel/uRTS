define(function(require) {

    var Mustache = require('mustache');
    var details = document.getElementById('details');
    var defaultTemplate = "{{ tag }}";

    function Selectable() {

    }

    Selectable.prototype.onClick = function() {
        this.select();
    };

    Selectable.prototype.select = function() {
        var template = this.entity.details || defaultTemplate;
        var data = this.entity;
        this.entity.player.selected = this.entity;
        details.innerText = Mustache.render(template, data);
    };

    return Selectable;
});