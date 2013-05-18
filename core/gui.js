define(function(require) {

    var $ = require('jquery');
    var Mustache = require('mustache');

    var buildTemplate = "<ul>{{#available}}<li>{{name}}</li>{{/available}}</ul>";

    function GUI(options) {
        options = options || {};
        this.player = options.player;

        this.build(options.context || "#gui");
    }

    GUI.prototype.build = function(context) {
        this.ore = $('#ore');
        this.units = $('#units');
        this.space = $('#space');
        this.build = $('#build');
    };

    GUI.prototype.update = function() {
        var base = this.player.base;
        var storage = base.getComponent('Storage');
        var ore = storage.quantity;
        this.ore.text(ore);

        var units = this.player.entities.length;
        this.units.text(units);

        var space = 10;
        this.space.text(space);

        var selected = this.player.selected;
        if (selected) {
            var building = selected.getComponent('Building');
            if (building) {
                this.build.html(Mustache.render(buildTemplate, building));
            }
        }
    };

    return GUI;
});