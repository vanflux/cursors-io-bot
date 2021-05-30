const Client = require('./Client/client');
const pathfinder = require('./pathfinder');
const letters = require('./letters');
const { EventEmitter } = require('events');
const utils = require('../utils');

module.exports = class Bot extends EventEmitter {
    constructor(opts) {
        super();

        let { delay, autoReconnect, reconnectTries } = Object.assign({
            delay: 50,
            autoReconnect: true,
            reconnectTries: 5,
        }, opts);

        this.delay = delay;
        this.autoReconnect = autoReconnect;
        this.reconnectTries = reconnectTries;

        this.client = new Client(opts);
        this.lastClickTime = 0;
        this.connected = false;
        this.connecting = false;
        this.disconnecting = false;
    }

    async connect() {
        if (this.connected) throw new Error('Already connected');
        if (this.connecting) throw new Error('Already connecting...');
        this.connecting = true;
        this.ready = false;
        
        return new Promise(async (resolve, reject) => {
            let onConnectedHandler = async () => {
                this.emit('connected');
                this.connected = true;
                this.connecting = false;
                this.ready = false;
            };
            
            let onDisconnectedHandler = async () => {
                this.connected = false;
                this.connecting = false;
                this.ready = false;
                unregisterEvents();
                this.emit('disconnected');

                if (this.autoReconnect && this.reconnectTries-- > 0) {
                    await conn();
                } else {
                    failed();
                }
            };

            let onErrorHandler = async (err) => {
                this.connected = false;
                this.connecting = false;
                this.ready = false;
                unregisterEvents();
                
                if (this.autoReconnect && this.reconnectTries-- > 0) {
                    await conn();
                } else {
                    failed(err);
                }
            };
            
            let onSceneLoadHandler = async () => {
                if (this.getLevel() == 0) {
                    // Skip Welcome Scene / Level
                    let [ green ] = this.search('green');
                    await this.navigateTo(green);
                    this.emit('welcome level load');
                } else if (this.getLevel() == 1) {
                    this.ready = true;
                    this.emit('ready');
                    this.emit('level load');
                    success();
                } else {
                    this.emit('level load');
                }
            };

            let onClickHandler = async (pointerClick) => {
                this.emit('click', pointerClick);
            };

            let onCursorPos = async (x, y) => {
                this.emit('cursor pos', x, y);
            };

            let registerEvents = () => {
                this.client.once('connected', onConnectedHandler);
                this.client.once('disconnected', onDisconnectedHandler);
                this.client.on('error', onErrorHandler);
                this.client.on('scene load', onSceneLoadHandler);
                this.client.on('click', onClickHandler);
                this.client.on('cursor pos', onCursorPos);
            };           

            let unregisterEvents = () => {
                this.client.off('connected', onConnectedHandler);
                this.client.off('disconnected', onDisconnectedHandler);
                this.client.off('error', onErrorHandler);
                this.client.off('scene load', onSceneLoadHandler);
                this.client.off('click', onClickHandler);
                this.client.off('cursor pos', onCursorPos);
            };

            let success = () => {
                resolve();
            };
            
            let failed = (err) => {
                reject(err);
            };
            
            let conn = async () => {
                this.connecting = true;
                try {
                    registerEvents();
                    await this.client.connect();
                } catch (exc) {
                    onErrorHandler(exc);
                }
            }

            await conn();
        });
    }

    async disconnect() {
        if (!this.connected) throw new Error('Already disconnected');
        if (this.disconnecting) throw new Error('Already disconnecting');
        this.disconnecting = true;
        this.ready = false;
        while (this.connecting) await utils.sleep(100);
        
        return new Promise(async (resolve, reject) => {            
            let onDisconnectedHandler = async () => {
                this.connected = false;
                this.connecting = false;
                this.disconnecting = false;
                this.emit('disconnected');
                cleanup();
                success();
            };

            let onErrorHandler = async (err) => {
                this.connected = false;
                this.connecting = false;
                this.disconnecting = false;
                cleanup();
                failed(err);
            };

            let cleanup = () => {
                this.client.off('disconnected', onDisconnectedHandler);
                this.client.off('error', onErrorHandler);
            };

            let success = () => {
                resolve();
            };
            
            let failed = (err) => {
                reject(err);
            };
            
            this.client.once('disconnected', onDisconnectedHandler);
            this.client.once('error', onErrorHandler);

            await this.client.disconnect();
        });
    }

    async navigateTo(...args) {
        if (args.length == 2) {
            return this.navigateToCoord(...args);
        } else if (args.length == 1) {
            return this.navigateToObject(...args);
        }
    }

    async navigateToObject(obj) {
        return await this.navigateToCoord(Math.round(obj.x + obj.width / 2), Math.round(obj.y + obj.height / 2));
    }

    async navigateToCoord(x, y) {
        if (x < 0 || y < 0 || x >= this.getMapWidth() || y >= this.getMapHeight()) return false;

        let level = this.getLevel();
        
        while(true) {
            let width = this.getMapWidth();
            let collisionMap = this.client.getCollisionMap();

            if (collisionMap != null) {
                try {
                    if (collisionMap[x + y * width] > 0) return false;
                    
                    let pathfindToXY = pathfinder(collisionMap, width).to(x, y);
                    let pathfind = pathfindToXY.from(this.getX(), this.getY());

                    if (pathfind == null) throw new Error('No path found from ' + this.getX() + ', ' + this.getY() + ' to ' + x + ', ' + y);
                    let pos = pathfind.next();

                    while(true) {
                        let navStartTime = Date.now();
                        while(pos != null && (this.getX() != x || this.getY() != y)) {
                            if (level != this.getLevel()) return true;
                            if (navStartTime <= this.getLastAutorizativeSetCursorPosTime()) break;

                            await this.goTo(pos.x, pos.y, false);

                            pathfind = pathfindToXY.from(this.getX(), this.getY());
                            pos = pathfind.next();
                        }
                        if (await this.tryWaitAutoritativeSetCursorPos(1000)) {
                            await utils.sleep(100);
                        } else {
                            break;
                        }
                    };

                    let reached = this.getX() == x && this.getY() == y;
                    if (reached) {
                        return true;
                    }
                } catch (exc) {
                    // Navigation error
                    // console.error('Nav error', exc);
                }
            }

            await utils.sleep(1000);
        }
    }

    async waitReady(timeout=10000) {
        if (this.ready) return;
        return new Promise((resolve, reject) => {
            let tid = setTimeout(() => {
                this.off('ready', handler);
                reject(new Error('Timeout'));
            }, timeout);

            let handler = (...args) => {
                clearTimeout(tid);
                resolve(...args);
            };

            this.once('ready', handler);
        });
    }

    async waitLevelLoad(timeout=60000) {
        return new Promise((resolve, reject) => {
            let tid = setTimeout(() => {
                this.off('level load', handler);
                reject(new Error('Timeout'));
            }, timeout);

            let handler = (...args) => {
                clearTimeout(tid);
                resolve(...args);
            };

            this.once('level load', handler);
        });
    }

    async waitAutoritativeSetCursorPos(timeout=1000) {
        return new Promise((resolve, reject) => {
            let tid = setTimeout(() => {
                this.off('cursor pos', handler);
                reject(new Error('Timeout'));
            }, timeout);

            let handler = (...args) => {
                clearTimeout(tid);
                resolve(...args);
            };

            this.once('cursor pos', handler);
        });
    }

    async tryWaitAutoritativeSetCursorPos(timeout=1000) {
        try {
            return await this.waitAutoritativeSetCursorPos(timeout);
        } catch (exc) {
            return null;
        }
    }

    async drawChar(char, size=1) {
        let initialX = this.getX();
        let initialY = this.getY();
        let curX = this.getX();
        let curY = this.getY();

        if (!letters[char.toUpperCase()]) throw new Error('This char doesnt exist');
        let { paths, width, height } = letters[char.toUpperCase()];

        for (let path of paths) {
            if (path.length == 0) break;
            let firstPos = path[0];
            curX = this.getX();
            curY = this.getY();
            if (this.client.lastCursorMoveTime >= this.delay || firstPos.x != 0 || firstPos.y != 0) {
                this.goTo(initialX+firstPos.x*size, initialY+firstPos.y*size, false);
                await utils.sleep(this.delay);
            }
            for (let i = 0; i < path.length; i++) {
                let pos = path[i];
                curX = this.getX();
                curY = this.getY();
                if (initialX+pos.x != curX || initialY+pos.y != curY) {
                    this.goTo(initialX+pos.x*size, initialY+pos.y*size, true);
                    await utils.sleep(this.delay);
                }
            }
        }

        return { width, height };
    }

    async drawText(text, size=2, spacing=3) {
        let initialX = this.getX();
        let initialY = this.getY();
        let curX = this.getX();
        let curY = this.getY();

        for (let char of text) {
            let { width } = await this.drawChar(char, size);
            curX += width + spacing;
            await this.goTo(curX, curY, false);
            await utils.sleep(this.delay);
        }
        let totalWidth = curX-initialX;
        let totalHeight = curX-initialY;
        return { width: totalWidth, height: totalHeight };
    }

    async drawRect(width, height) {
        let curX = this.getX();
        let curY = this.getY();

        if (this.client.lastCursorMoveTime > this.delay) {
            this.goTo(curX, curY, false);
            await utils.sleep(this.delay);
        }
        this.goTo(curX+width, curY, true);
        await utils.sleep(this.delay);
        this.goTo(curX+width, curY+height, true);
        await utils.sleep(this.delay);
        this.goTo(curX, curY+height, true);
        await utils.sleep(this.delay);
        this.goTo(curX, curY, true);
        await utils.sleep(this.delay);
    }

    getDrawingsOn(x, y, width, height) {
        return this.getDrawings().filter(drawing =>
            drawing.x1 >= x && drawing.x2 < x + width && drawing.y1 >= y && drawing.y2 < y + height
        );
    }

    isReady() {
        return this.ready;
    }

    // Wrap basic functions of client

    getLastAutorizativeSetCursorPosTime() {
        return this.client.lastAutorizativeSetCursorPosTime;
    }

    getCursorById(id) {
        return this.client.getCursorById(id);
    }

    search(type) {
        return this.client.searchSceneObjects(type);
    }

    getLevel() {
        return this.client.getLevel();
    }

    getId() {
        return this.client.getCursorId();
    }

    getX() {
        return this.client.getCursorX();
    }
    
    getY() {
        return this.client.getCursorY();
    }

    getMapWidth() {
        return this.client.getMapWidth();
    }
    
    getMapHeight() {
        return this.client.getMapHeight();
    }

    getDrawings() {
        return this.client.drawings;
    }

    async goTo(x, y, drawing) {
        await this.client.moveCursor(x, y, drawing);
    }

    async click() {
        await this.client.click();
    }
}