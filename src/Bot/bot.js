const Client = require('../Client/client');
const pathfinder = require('./pathfinder');
const { EventEmitter } = require('events');

module.exports = class Bot extends EventEmitter {
    constructor(opts) {
        super();
        this.client = new Client(opts);

        this.lastClickTime = 0;
    }

    async setup() {
        await this.client.setup();

        this.client.on('connected', () => this.emit('connected'));
        this.client.on('disconnected', () => this.emit('disconnected'));
        this.client.on('scene load', async () => {
            if (this.client.levelLoadCount == 1) {
                let goodObj = this.client.sceneObjs.find(x => x.type == 2 && x.isBad == false);
                this.client.moveCursor(goodObj.x, goodObj.y);
                this.emit('initial level load');
            } else {
                this.emit('level load');
            }
        });
    }

    async connect() {
        await this.client.connect();
    }

    async search(type) {
        switch (type) {
            case 'text': return this.client.sceneObjs.filter(x => x.type == 0);
            case 'wall': return this.client.sceneObjs.filter(x => x.type == 1);
            case 'green': return this.client.sceneObjs.filter(x => x.type == 2 && x.isBad == false);
            case 'red': return this.client.sceneObjs.filter(x => x.type == 2 && x.isBad == true);
            case 'hoverBtn': return this.client.sceneObjs.filter(x => x.type == 3);
            case 'clickBtn': return this.client.sceneObjs.filter(x => x.type == 4);
            default: throw new Error('Invalid query');
        }
    }

    async goTo(x, y, drawing) {
        await this.client.moveCursor(x, y, drawing);
    }

    async navigateTo(x, y) {
        let width = this.client.getMapWidth();
        let collisionMap = this.client.getCollisionMap();
        
        let curX = this.client.getCursorX();
        let curY = this.client.getCursorY();
        
        let pathfind = pathfinder(collisionMap, width)
            .to(x, y)
            .from(curX, curY);
        
        if (pathfind == null) return false;
        
        let pos;
        while((pos = pathfind.next()) != null && (curX != x || curY != y)) {
            await this.client.moveCursor(pos.x, pos.y, false);
            curX = this.client.getCursorX();
            curY = this.client.getCursorY();
        }
        return curX == x && curY == y;
    }

    async click() {
        await this.client.click();
    }

    getLevelLoadCount() {
        return this.client.levelLoadCount;
    }

    getX() {
        return this.client.getCursorX();
    }
    
    getY() {
        return this.client.getCursorY();
    }
}