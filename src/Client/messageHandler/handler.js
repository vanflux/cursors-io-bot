const newSceneHandler = require('./packetHandlers/newSceneHandler');
const resetSceneHandler = require('./packetHandlers/resetSceneHandler');
const updateHandler = require('./packetHandlers/updateHandler');
const joinHandler = require('./packetHandlers/joinHandler');

module.exports = function getHandler(client) {
    let joinPacketHandler = joinHandler(client);
    let updatePacketHandler = updateHandler(client);
    let newScenePacketHandler = newSceneHandler(client);
    let resetScenePacketHandler = resetSceneHandler(client);

    return function packetHandler(message) {
        let { data } = message;
        var dataView = new DataView(data);
        let curPos = 0;

        let firstData = dataView.getUint8(0);
        switch (firstData) {
            case 0:
                curPos = joinHandler(data, dataView, curPos);
                break;
            case 1:
                curPos = updatePacketHandler(data, dataView, curPos);
                break;
            case 4:
                curPos = newScenePacketHandler(data, dataView, curPos);
                break;
            case 5:
                curPos = resetScenePacketHandler(data, dataView, curPos);
                break;
        }
    };
};