const mapObjectParser = require('../mapObjectParser');

module.exports = (client) => {
    let parseMapObject = mapObjectParser(client);

    return (data, dataView, curPos) => {
        let cursorCount;
                
        client.areaCursorCount = cursorCount = dataView.getUint16(1, true);

        client.tooFull = 100 <= cursorCount;
        let toRemoveIds = [];
        let f;

        for (let id in client.cursors) {
            if (!client.cursors.hasOwnProperty(id)) continue;
            toRemoveIds.push(id);
        }
        for (var e = 0; e < cursorCount; e++) {
            let id = dataView.getUint32(3 + 8 * e, true);
            let x = dataView.getUint16(7 + 8 * e, true);
            let y = dataView.getUint16(9 + 8 * e, true);

            if (id != client.cursorId) {
                if (client.cursors[id]) {
                    let cursor = client.cursors[id];
                    for (var i = 0; i < toRemoveIds.length; i++) {
                        if (toRemoveIds[i] == id) {
                            toRemoveIds.splice(i, 1);
                            break
                        }
                    }
                    cursor.x = x;
                    cursor.y = y;
                } else {
                    client.cursors[id] = {
                        x,
                        y,
                    };
                }
            }
        }
        for (let i = 0; i < toRemoveIds.length; i++) {
            delete client.cursors[toRemoveIds[i]];
        }

        curPos = cursorCount;

        curPos = processPointerClicks(3 + 8 * curPos);
        removeFinishedPointerClicks();

        let v = dataView.getUint16(curPos, true);
        curPos += 2;
        for (let i = 0; i < v; i++) {
            let id = dataView.getUint32(curPos, true);

            forLoop_updateHandler_removeWallCollision:
            for (let j = 0; j < client.sceneObjs.length; j++) {
                let sceneObj = client.sceneObjs[j];
                if (sceneObj.id == id) {
                    if (sceneObj.type == 1) { // wall
                        let _x = sceneObj.x | 0;
                        let _y = sceneObj.y | 0;
                        let _w = sceneObj.width | 0;
                        let _h = sceneObj.height | 0;
                        for (let y = _y; y < _y + _h; y++) {
                            for (let x = _x; x < _x + _w; x++) {
                                client.collisionMap[x + 400 * y]--;
                            }
                        }
                    }
                    client.sceneObjs.splice(j, 1);
                    break forLoop_updateHandler_removeWallCollision;
                }
            }
            curPos += 4;
        }
        
        //console.log(client.pointerClicks.length); // print current visible pointer clicks count

        let length = dataView.getUint16(curPos, true);
        curPos += 2;
        for (let i = 0; i < length; i++) {
            let sceneObj = null;
            a: {
                let id = dataView.getUint32(curPos, true);
                for (j = 0; j < client.sceneObjs.length; j++) {
                    if (client.sceneObjs[j].id == id) {
                        sceneObj = client.sceneObjs[j];
                        break a;
                    }
                }
                sceneObj = {
                    id,
                };
                client.sceneObjs.push(sceneObj);
            }
            curPos += 4;
            curPos = parseMapObject(dataView, curPos, sceneObj);
        }
        curPos = Fa(dataView, curPos);
        if (data.byteLength < curPos + 4) return;

        client.playersCount = dataView.getUint32(curPos, true);

        function Fa(dataView, curPos) {
            setTimeout(function() {
                for (var c = dataView.getUint16(curPos, true), d = 0; d < c; d++) {
                    let f = dataView.getUint16(curPos + 2 + 8 * d, true);
                    let e = dataView.getUint16(curPos + 4 + 8 * d, true);
                    let h = dataView.getUint16(curPos + 6 + 8 * d, true);
                    let g = dataView.getUint16(curPos + 8 + 8 * d, true);
                    //console.log(f, e, h, g);
                    /*client.drawings.push([
                        f << 1,
                        e << 1,
                        h << 1,
                        g << 1,
                        Date.now(),
                    ]);*/
                }
            }, 50);
            return curPos + 2 + 8 * dataView.getUint16(curPos, true)
        }

        function processPointerClicks(curPos) {
            setTimeout((() => {
                let c = dataView.getUint16(curPos, true);

                forLoop_processPClicks:
                for (let d = 0; d < c; d++) {
                    let x = dataView.getUint16(curPos + 2 + 4 * d, true);
                    let y = dataView.getUint16(curPos + 4 + 4 * d, true);

                    for (let i = 0; i < client.K.length; i++) {
                        var g = client.K[i];
                        if (g[0] == x && g[1] == y) {
                            client.K.splice(i, 1);
                            continue forLoop_processPClicks;
                        }
                    }

                    client.pointerClicks.push({ x, y, time: Date.now() });
                }
            }).bind(client), 100);

            let nextPos = curPos + 2 + 4 * dataView.getUint16(curPos, true);
            return nextPos;
        };

        function removeFinishedPointerClicks() {
            for (let i = 0; i < client.pointerClicks.length; i++) {
                let { time } = client.pointerClicks[i];
                if (Date.now() - time > 500) {
                    client.pointerClicks.splice(i, 1);
                    i--;
                }
            }
        };
        
        return curPos;
    };
};