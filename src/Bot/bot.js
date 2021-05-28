const Client = require('../Client/client');
const pathfinder = require('./pathfinder');
const letters = require('./letters');
const { EventEmitter } = require('events');
const utils = require('../utils');

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

    async drawChar(char, size=1) {
        let initialX = this.client.getCursorX();
        let initialY = this.client.getCursorY();
        let curX = this.client.getCursorX();
        let curY = this.client.getCursorY();

        if (!letters[char.toUpperCase()]) throw new Error('This char doesnt exist');
        let { paths, width, height } = letters[char.toUpperCase()];

        for (let path of paths) {
            if (path.length == 0) break;
            let firstPos = path[0];
            curX = this.client.getCursorX();
            curY = this.client.getCursorY();
            if (this.client.lastCursorMoveTime > 50 || firstPos.x != 0 || firstPos.y != 0) {
                this.client.moveCursor(initialX+firstPos.x*size, initialY+firstPos.y*size, false);
                await utils.sleep(50);
            }
            for (let i = 0; i < path.length; i++) {
                let pos = path[i];
                curX = this.client.getCursorX();
                curY = this.client.getCursorY();
                if (initialX+pos.x != curX || initialY+pos.y != curY) {
                    this.client.moveCursor(initialX+pos.x*size, initialY+pos.y*size, true);
                    await utils.sleep(50);
                }
            }
        }

        return { width, height };
    }

    async drawText(text, size=2, spacing=3) {
        let initialX = this.client.getCursorX();
        let initialY = this.client.getCursorY();
        let curX = this.client.getCursorX();
        let curY = this.client.getCursorY();

        for (let char of text) {
            let { width } = await this.drawChar(char, size);
            curX += width + spacing;
            this.client.moveCursor(curX, curY, false);
            await utils.sleep(50);
        }
        let totalWidth = curX-initialX;
        let totalHeight = curX-initialY;
        return { width: totalWidth, height: totalHeight };
    }

    async drawRect(width, height) {
        let curX = this.client.getCursorX();
        let curY = this.client.getCursorY();

        if (this.client.lastCursorMoveTime > 50) {
            this.client.moveCursor(curX, curY, false);
            await utils.sleep(50);
        }
        this.client.moveCursor(curX+width, curY, true);
        await utils.sleep(50);
        this.client.moveCursor(curX+width, curY+height, true);
        await utils.sleep(50);
        this.client.moveCursor(curX, curY+height, true);
        await utils.sleep(50);
        this.client.moveCursor(curX, curY, true);
        await utils.sleep(50);
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