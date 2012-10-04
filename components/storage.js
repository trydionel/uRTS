define(function() {
    function Storage(capacity, initial) {
        this.capacity = capacity;
        this.quantity = initial;
    }

    Storage.prototype.isFull = function() {
        return this.quantity >= this.capacity;
    };

    Storage.prototype.isEmpty = function() {
        return this.quantity <= 0;
    };

    Storage.prototype.deposit = function(other) {
        var destination = other.getComponent('Storage');
        if (!destination) throw "Attempting to deposit into entity without storage component";

        if (this.isEmpty()) {
            this.entity.broadcast('Empty');
        } else {
            this.quantity -= 1;
            destination.quantity += 1;
        }
    };

    Storage.prototype.consume = function(other) {
        var source = other.getComponent('Storage');
        if (!source) throw "Attempting to consume from entity without storage component";

        if (this.isFull()) {
            this.entity.broadcast('Full');
        } else if (source.isEmpty()) {
            this.entity.broadcast('ResourceExhausted', source.entity);
        } else {
            source.deposit(this.entity);
        }
    };

    return Storage;
});