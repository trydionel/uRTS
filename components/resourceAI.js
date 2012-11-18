define(function() {
    function ResourceAI() {
    }

    ResourceAI.prototype.fixedUpdate = function(dt) {
        var storage = this.entity.getComponent('Storage');

        // Slowly regrow resources
        if (Math.random() > 0.99) {
            storage.quantity += 0.2 * storage.capacity;
            storage.quantity = Math.min(storage.capacity, storage.quantity);
        }
    };

    return ResourceAI;
});