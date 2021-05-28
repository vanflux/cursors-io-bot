module.exports = (client) => {
    return (data, dataView, curPos) => {
        // Set initial cursor position
        let x = dataView.getUint16(1, true);
        let y = dataView.getUint16(3, true);
        client.setInitialCursor(x, y);

        // Parse current level number
        if (dataView.byteLength > 9) {
            client.levelLoadCount = Math.max(client.levelLoadCount, dataView.getUint32(5, true));
        } else if (dataView.byteLength > 7) {
            client.levelLoadCount = Math.max(client.levelLoadCount, dataView.getUint16(5, true));
        }
        return curPos;
    };
};