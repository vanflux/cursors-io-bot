module.exports = (client) => {
    return (data, dataView, curPos) => {
        client.cursorId = dataView.getUint32(1, true);
        return curPos;
    };
};