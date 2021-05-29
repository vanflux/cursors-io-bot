const WebSocket = require('ws');
const { EventEmitter } = require('events');
const serverManager = require('./serverManager');
const packetHandler = require('./messageHandler/handler');

module.exports = class Client extends EventEmitter {
    constructor(opts) {
        super();
        opts = Object.assign({
            drawingsEnabled: false,
        }, opts);
        this.opts = opts;

        this.server = opts.server;
        
        this.connected = false;
        this.connecting = false;
        this.disconnecting = false;

        this.resetInGameVariables();
    }

    resetInGameVariables() {
        this.tooFull = false;

        this.level = 0;

        this.cursorId = null;
        this.cursorX = 0;
        this.cursorY = 0;
        this.lastCursorMoveTime = 0;
        this.cursorServerMoveCount = 0;

        this.cursors = {};
        this.playersCount = 0;
        this.areaCursorCount = 0;
        this.collisionMap = null;

        this.drawingsEnabled = this.opts.drawingsEnabled;
        this.drawings = [];

        this.sceneObjs = [];
        this.pointerClicks = [];
    }

    async pickServerIfHasnt() {
        if (this.server == null) {
            this.server = await serverManager.findCursorServer();
        }
    }

    async connect() {
        if (this.connected) throw new Error('Already connected');
        if (this.connecting) throw new Error('Already connecting...');

        this.connecting = true;
        this.resetInGameVariables();

        await this.pickServerIfHasnt();
        
        let host = this.server.ipv4 || ('[' + this.server.ipv6 + ']');
        let port = 2828;

        this.socket = new WebSocket('ws://' + host + ':' + port, this.opts);
        this.socket.binaryType = 'arraybuffer';
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = packetHandler(this);
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onerror = this.onError.bind(this);
    }

    async disconnect() {
        if (!this.connected) throw new Error('Already disconnected');
        if (this.disconnecting) throw new Error('Already disconnecting');
        this.disconnecting = true;
        try {
            while (this.connecting) await utils.sleep(100);
            this.socket.close();
            this.resetInGameVariables();
        } catch (exc) {
            console.error('Error on disconnecting', exc);
        }
        this.disconnecting = false;
    }

    cleanupSocketEvents() {
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onclose = null;
        this.socket.onerror = null;
    }

    resetScene() {
        this.collisionMap = new Uint8Array(400 * 300);
        this.sceneObjs = []; // Scene objects array
        this.pointerClicks = [];
    }

    onOpen() {
        this.connected = true;
        this.connecting = false;
        this.resetScene();
        this.emit('connected');
    }
    
    onClose(obj) {
        this.resetScene();
        this.connected = false;
        this.connecting = false;
        this.cleanupSocketEvents();
        this.emit('disconnected');
    }
    
    onError(err) {
        this.connected = false;
        this.connecting = false;
        this.cleanupSocketEvents();
        this.emit('error', err);
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
        this.lastCursorMoveTime = Date.now();
        this.cursorX = x;
        this.cursorY = y;
    }

    click() {
        let buffer = new ArrayBuffer(9);
        let dataView = new DataView(buffer);
        dataView.setUint8(0, 2);
        dataView.setUint16(1, this.cursorX, true);
        dataView.setUint16(3, this.cursorY, true);
        dataView.setUint32(5, this.cursorServerMoveCount, true);
        this.socket.send(buffer);
    }

    getPlayersCount() {
        return this.playersCount;
    }

    getCursorId() {
        return this.cursorId;
    }

    getLevel() {
        return this.level;
    }

    getCursorServerMoveCount() {
        return this.cursorServerMoveCount;
    }

    getCursorById(id) {
        return this.cursors[id];
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

    getDrawings() {
        return this.drawings;
    }

    getPointerClicks() {
        return this.pointerClicks;
    }

    getSceneObjects() {
        return this.sceneObjs;
    }

    searchSceneObjects(type) {
        switch (type) {
            case 'text': return this.sceneObjs.filter(x => x.type == 0);
            case 'wall': return this.sceneObjs.filter(x => x.type == 1);
            case 'green': return this.sceneObjs.filter(x => x.type == 2 && x.isBad == false);
            case 'red': return this.sceneObjs.filter(x => x.type == 2 && x.isBad == true);
            case 'hoverBtn': return this.sceneObjs.filter(x => x.type == 3);
            case 'clickBtn': return this.sceneObjs.filter(x => x.type == 4);
            default: throw new Error('Invalid query');
        }
    }

    getMapWidth() {
        return 400;
    }
    
    getMapHeight() {
        return 300;
    }
};