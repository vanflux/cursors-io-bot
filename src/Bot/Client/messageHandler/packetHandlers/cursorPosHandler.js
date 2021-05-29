module.exports = (client) => {
    return (data, dataView, curPos) => {
        // Set initial cursor position
        let x = dataView.getUint16(1, true);
        let y = dataView.getUint16(3, true);
        client.cursorX = x;
        client.cursorY = y;
        client.lastAutorizativeSetCursorPosTime = Date.now();
        client.emit('cursor pos', x, y);

        // Parse cursor server move count
        if (dataView.byteLength > 9) {
            client.cursorServerMoveCount = Math.max(client.cursorServerMoveCount, dataView.getUint32(5, true));
        } else if (dataView.byteLength > 7) {
            client.cursorServerMoveCount = Math.max(client.cursorServerMoveCount, dataView.getUint16(5, true));
        }
        return curPos;
    };
};