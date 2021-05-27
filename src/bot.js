const serverFinder = require('./serverFinder');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

module.exports = class Bot extends EventEmitter {
    constructor(server) {
        super();
        this.server = server;
        
        this.collisionMap = null;
        this.tooFull = false;
        this.cursorId = -1;
        this.areaCursorCount = 0;
        this.curLevel = 0;
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursors = {};
    }

    async setup() {
        if (this.server == null) {
            let servers = await serverFinder.findServerPreference('cursors');
            this.server = servers[0];
        }
    }

    async connect() {
        let host = this.server.ipv4 || ('[' + this.server.ipv6 + ']');
        let port = 2828;

        this.socket = new WebSocket('ws://' + host + ':' + port);
        this.socket.binaryType = 'arraybuffer';
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onerror = this.onError.bind(this);
    }

    resetScene() {
        this.collisionMap = new Uint8Array(12E4);
        this.sceneObjs = []; // Scene objects array
        this.D = [];
        this.L = [];
    }

    async onOpen() {
        this.resetScene();
        console.log('Connected');
    }
    
    async onMessage(message) {
        let { data } = message;
        var dataView = new DataView(data);
        let curPos = 0;

        let firstData = dataView.getUint8(0);
        switch (firstData) {
            case 0: {
                this.cursorId = dataView.getUint32(1, true);
                break;
            }
            case 1: {
                let cursorCount;
                
                this.areaCursorCount = cursorCount = dataView.getUint16(1, true);

                this.tooFull = 100 <= cursorCount;
                let toRemoveIds = [];
                let f;

                for (let id in this.cursors) {
                    if (!this.cursors.hasOwnProperty(id)) continue;
                    toRemoveIds.push(id);
                }

                for (var e = 0; e < cursorCount; e++) {
                    let id = dataView.getUint32(3 + 8 * e, true);
                    let x = dataView.getUint16(7 + 8 * e, true);
                    let y = dataView.getUint16(9 + 8 * e, true);

                    if (id != this.cursorId) {
                        if (this.cursors[id]) {
                            let cursor = this.cursors[id];
                            for (var i = 0; i < toRemoveIds.length; i++) {
                                if (toRemoveIds[i] == id) {
                                    toRemoveIds.splice(i, 1);
                                    break
                                }
                            }
                            cursor.x = x;
                            cursor.y = y;
                        } else {
                            this.cursors[id] = {
                                x,
                                y,
                            };
                        }
                    }
                }
                for (let i = 0; i < toRemoveIds.length; i++) {
                    delete this.cursors[toRemoveIds[i]];
                }

                //console.log(Object.keys(this.cursors).length);

                /*let curPos = cursorCount;
                curPos = Ea(dataView, 3 + 8 * curPos);
                f = dataView.getUint16(curPos, true);
                curPos += 2;
                for (d = 0; d < f; d++) {
                    a: for (h = dataView.getUint32(curPos, true), e = 0; e < m.length; e++)
                        if (m[e].id == h) {
                            var k = m[e];
                            if (1 == k.type)
                                for (var h = k.x | 0, g = k.y | 0, r = k.width | 0, k = k.height | 0, l = g; l < g + k; ++l)
                                    for (var p = h; p < h + r; ++p) --Q[p + 400 * l];
                            m.splice(e, 1);
                            break a
                        } curPos += 4
                }
                f = dataView.getUint16(curPos, true);
                curPos += 2;
                for (d = 0; d < f; d++) {
                    a: {
                        e = dataView.getUint32(curPos, true);
                        for (h = 0; h < m.length; h++)
                            if (m[h].id == e) {
                                e = m[h];
                                break a
                            } e = {
                            id: e
                        };m.push(e)
                    }
                    curPos += 4;
                    curPos = ka(dataView, curPos, e)
                }
                curPos = Fa(dataView, curPos);
                if (data.byteLength < curPos + 4) break;
                $ = dataView.getUint32(curPos, true);*/
                break;
            }
            case 4: {
                // Reset scene
                this.resetScene();

                // Set initial cursor position
                let x = dataView.getUint16(1, true);
                let y = dataView.getUint16(3, true);
                this.setInitialCursor(x, y);

                // Parse scene objects
                let objCount = dataView.getUint16(5, true);
                curPos = 7;
                for (let i = 0; i < objCount; i++) {
                    let objId = dataView.getUint32(curPos, true);
                    let obj = { id: objId };

                    curPos += 4;
                    curPos = this.parseMapObject(dataView, curPos, obj);
                    this.sceneObjs.push(obj);
                }

                // Parse current level number
                if (data.byteLength >= curPos + 4) {
                    this.curLevel = Math.max(this.curLevel, dataView.getUint32(curPos, true));
                } else if (data.byteLength >= curPos + 2) {
                    this.curLevel = Math.max(this.curLevel, dataView.getUint16(curPos, true));
                }

                this.emit('scene load', this.curLevel);
                break;
            }
            case 5: {
                // Set initial cursor position
                let x = dataView.getUint16(1, true);
                let y = dataView.getUint16(3, true);
                this.setInitialCursor(x, y);

                // Parse current level number
                if (dataView.byteLength > 9) {
                    this.curLevel = Math.max(this.curLevel, dataView.getUint32(5, true));
                } else if (dataView.byteLength > 7) {
                    this.curLevel = Math.max(this.curLevel, dataView.getUint16(5, true));
                }
            }
        }
    }

    parseMapObject(dataView, curPos, out) {
        function parseTransforms() {
            out.x = dataView.getUint16(curPos, true); curPos += 2;
            out.y = dataView.getUint16(curPos, true); curPos += 2;
            out.width = dataView.getUint16(curPos, true); curPos += 2;
            out.height = dataView.getUint16(curPos, true); curPos += 2
        }

        function parseColor() {
            let hex;
            for (hex = dataView.getUint32(curPos, true).toString(16); hex.length < 6;) {
                hex = "0" + hex;
            }
            curPos += 4;
            out.color = "#" + hex;
        }

        var type = dataView.getUint8(curPos);
        curPos += 1;
        out.type = type;
        switch (type) {
            case 255:
                break;
            case 0:
                // TEXT OBJECT

                out.x = dataView.getUint16(curPos, true); curPos += 2;      // X coord
                out.y = dataView.getUint16(curPos, true); curPos += 2;      // Y coord
                out.size = dataView.getUint8(curPos); curPos += 1;          // Size
                out.isCentered = !!dataView.getUint8(curPos); curPos += 1;  // Is Centered
                let [ text, newCurPos ] = this.parseText(dataView, curPos); // Text String
                out.text = text;                                            // ...
                curPos = newCurPos;                                         // ...
                break;
            case 1:
                // WALL OBJECT (can be collidable)

                parseTransforms();
                let isCollidable = !out.color;
                parseColor();

                if (isCollidable) {
                    // Iterate on all Xs & Ys of this collidable wall and set collision map
                    
                    let _x = out.x | 0;
                    let _y = out.y | 0;
                    let _w = out.width | 0;
                    let _h = out.height | 0;
                    for (let iy = _y; iy < _y + _h; iy++) {
                        for (let ix = _x; ix < _x + _w; ix++) {
                            this.collisionMap[ix + 400 * iy]++;
                        }
                    }
                }
                break;
            case 2:
                // GREEN/RED OBJECT

                parseTransforms();
                out.isBad = !!dataView.getUint8(curPos); curPos += 1;    // Is Bad ?
                break;
            case 3:
                // INTERACTABLE OBJECT

                parseTransforms();
                out.count = dataView.getUint16(curPos, true); curPos += 2; // Count
                parseColor();
                break;
            case 4:
                // INTERACTABLE TIMER OBJECT

                parseTransforms();
                if (out.count) {
                    if (out.count > dataView.getUint16(curPos, true)) {
                        out.lastClickAt = t; // Last Click
                    }
                } else {
                    out.lastClickAt = 0; // Last Click = 0 (default)
                }
                out.count = dataView.getUint16(curPos, true); curPos += 2; // Count
                parseColor();
                break;
            default:
                throw Error('Unknown object type: ' + type);
        }
        return curPos;
    }

    moveCursor(x, y, drawing=false) {
        let buffer = new ArrayBuffer(9);
        let dataView = new DataView(buffer);
        dataView.setUint8(0, 3);
        dataView.setUint16(1, drawing ? this.cursorX : x, true);
        dataView.setUint16(3, drawing ? this.cursorY : y, true);
        dataView.setUint16(5, x, true);
        dataView.setUint16(7, y, true);
        this.socket.send(buffer);
        this.cursorX = x;
        this.cursorY = y;
    }

    click() {
        let buffer = new ArrayBuffer(9);
        let dataView = new DataView(buffer);
        dataView.setUint8(0, 2);
        dataView.setUint16(1, this.cursorX, true);
        dataView.setUint16(3, this.cursorY, true);
        dataView.setUint32(5, this.curLevel, true);
        this.socket.send(buffer);
    }
    
    parseText(dataView, curPos) {
        let text = '';
        let charCode = 0;
        let byte = 0;
        while ((byte = dataView.getUint8(curPos)) != 0) {
            charCode <<= 8;
            charCode |= byte;
            if ((byte & 128) == 0) {
                text += String.fromCharCode(charCode);
                charCode = 0;
            }
            curPos++;
        }
        if (charCode != 0) {
            text += String.fromCharCode(charCode);
        }
        return [ text, curPos+1 ];
    }
    
    setInitialCursor(x, y) {
        this.initialCursorX = x;
        this.initialCursorY = y;
        this.cursorX = this.p = x;
        this.cursorY = this.s = y;
    }
    
    async onClose(obj) {
        this.resetScene();
        console.log('Socket closed:', obj.reason)
    }
    
    async onError(err) {
        console.log('Socket error', err)
    }
};