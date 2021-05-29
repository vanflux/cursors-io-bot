const { EventEmitter } = require('events');

module.exports = class Trigger extends EventEmitter {
    constructor(x, y, width, height) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    setX(x) {
        this.x = x;
    }

    setY(y) {
        this.y = y;
    }

    check(x, y, obj={}) {
        if (x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height) {
            this.emit('triggered', x, y, obj);
        }
    }
};