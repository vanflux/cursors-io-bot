const WebSocket = require('ws');
const ServerFinder = require('./serverFinder');

async function main() {
    let svFinder = new ServerFinder();
    let servers = await svFinder.findServerPreference('latency');
    console.log(servers);
}

main();