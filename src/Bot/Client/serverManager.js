const serverFinder = require('./serverFinder')();

const serverCacheInterval = 60 * 1000; // 1 minute

let cachedCursorServer = 0;
let lastCursorServerTime = 0;

async function findCursorServer() {
    if (Date.now() - lastCursorServerTime > serverCacheInterval) {
        let servers = await serverFinder.findServerPreference('cursors');
        if (servers.length == 0) return;
        let server = servers[0];
        cachedCursorServer = server;
        lastCursorServerTime = Date.now();
        return cachedCursorServer;
    } else {
        return cachedCursorServer;
    }
}

module.exports = {
    findCursorServer,
};