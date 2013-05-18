define(function(require) {

    function GUI() {}

    GUI.prototype.onStart = function() {
        var container = document.getElementById('gui');

        this.quantity = document.createElement('div');
        this.quantity.id = 'quantity';
        container.appendChild(this.quantity);
    };

    GUI.prototype.onGUI = function() {
        var base = this.entity.player.base;
        var storage = base.getComponent('Storage');
        var quantity = storage.quantity;

        this.quantity.innerText = quantity;
    };

    return GUI;
});