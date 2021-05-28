const mapObjectParser = require('../mapObjectParser');

module.exports = (client) => {
    let parseMapObject = mapObjectParser(client);

    return (data, dataView, curPos) => {
        // Reset scene
        client.resetScene();

        // Set initial cursor position
        let x = dataView.getUint16(1, true);
        let y = dataView.getUint16(3, true);
        client.setInitialCursor(x, y);

        // Parse scene objects
        let objCount = dataView.getUint16(5, true);
        curPos = 7;
        for (let i = 0; i < objCount; i++) {
            let objId = dataView.getUint32(curPos, true);
            let obj = { id: objId };

            curPos += 4;
            curPos = parseMapObject(dataView, curPos, obj);
            client.sceneObjs.push(obj);
        }

        // Parse current level load count number
        if (data.byteLength >= curPos + 4) {
            client.levelLoadCount = Math.max(client.levelLoadCount, dataView.getUint32(curPos, true));
        } else if (data.byteLength >= curPos + 2) {
            client.levelLoadCount = Math.max(client.levelLoadCount, dataView.getUint16(curPos, true));
        }

        client.emit('scene load');
        return curPos;
    };
};