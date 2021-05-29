const newSceneHandler = require('./packetHandlers/newSceneHandler');
const cursorPosHandler = require('./packetHandlers/cursorPosHandler');
const updateHandler = require('./packetHandlers/updateHandler');
const joinHandler = require('./packetHandlers/joinHandler');

module.exports = function getHandler(client) {
    let joinPacketHandler = joinHandler(client);
    let updatePacketHandler = updateHandler(client);
    let newScenePacketHandler = newSceneHandler(client);
    let cursorPosPacketHandler = cursorPosHandler(client);

    return function packetHandler(message) {
        if (!client.connected) return;
        if (client.disconnecting) return;

        let { data } = message;
        var dataView = new DataView(data);
        let curPos = 0;

        let firstData = dataView.getUint8(0);
        switch (firstData) {
            case 0:
                curPos = joinPacketHandler(data, dataView, curPos);
                break;
            case 1:
                curPos = updatePacketHandler(data, dataView, curPos);
                break;
            case 4:
                curPos = newScenePacketHandler(data, dataView, curPos);
                break;
            case 5:
                curPos = cursorPosPacketHandler(data, dataView, curPos);
                break;
        }
    };
};