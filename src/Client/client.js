const WebSocket = require('ws');
const { EventEmitter } = require('events');
const serverFinderBuilder = require('./serverFinder');
const packetHandler = require('./messageHandler/handler');

module.exports = class Client extends EventEmitter {
    constructor(opts) {
        super();
        opts = Object.assign({}, opts);
        this.server = opts.server;
        this.serverFinder = serverFinderBuilder(opts);
        this.collisionMap = null;
        this.tooFull = false;
        this.cursorId = -1;
        this.areaCursorCount = 0;
        this.levelLoadCount = 0;
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursors = {};
        this.playersCount = 0;
        this.drawings = [];
        this.lastDrawCX = 0;
        this.lastDrawCY = 0;
        this.K = [];
    }

    async setup() {
        if (this.server == null) {
            let servers = await this.serverFinder.findServerPreference('cursors');
            this.server = servers[0];
        }
    }

    async connect() {
        let host = this.server.ipv4 || ('[' + this.server.ipv6 + ']');
        let port = 2828;

        this.socket = new WebSocket('ws://' + host + ':' + port);
        this.socket.binaryType = 'arraybuffer';
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = packetHandler(this);
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onerror = this.onError.bind(this);
    }

    resetScene() {
        this.collisionMap = new Uint8Array(12E4);
        this.sceneObjs = []; // Scene objects array
        this.pointerClicks = [];
        this.L = [];
    }

    async onOpen() {
        this.resetScene();
        this.emit('connected');
    }

    async moveCursor(x, y, drawing=false) {
        let buffer = new ArrayBuffer(9);
        let dataView = new DataView(buffer);
        dataView.setUint8(0, 3);
        dataView.setUint16(1, drawing ? this.cursorX : x, true);
        dataView.setUint16(3, drawing ? this.cursorY : y, true);
        dataView.setUint16(5, x, true);
        dataView.setUint16(7, y, true);
        await this.socket.send(buffer);
        this.cursorX = x;
        this.cursorY = y;
    }

    click() {
        let buffer = new ArrayBuffer(9);
        let dataView = new DataView(buffer);
        dataView.setUint8(0, 2);
        dataView.setUint16(1, this.cursorX, true);
        dataView.setUint16(3, this.cursorY, true);
        dataView.setUint32(5, this.levelLoadCount, true);
        this.socket.send(buffer);
    }
    
    setInitialCursor(x, y) {
        this.initialCursorX = x;
        this.initialCursorY = y;
        this.cursorX = this.p = x;
        this.cursorY = this.s = y;
    }

    getCursorX() {
        return this.cursorX;
    }
    
    getCursorY() {
        return this.cursorY;
    }

    getCollisionMap() {
        return this.collisionMap;
    }

    getMapWidth() {
        return 400;
    }
    
    getMapHeight() {
        return 300;
    }
    
    async onClose(obj) {
        this.resetScene();
        this.emit('disconnected');
        console.log('Socket closed:', obj.reason);
    }
    
    async onError(err) {
        console.log('Socket error', err);
    }
};