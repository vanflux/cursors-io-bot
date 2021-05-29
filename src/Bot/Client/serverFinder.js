const request = require('request');
const WebSocket = require('ws');

module.exports = (opts) => {
    opts = Object.assign({
        baseUrl: 'https://api.n.m28.io',
        isSecure: true,
        version: null,
    }, opts);

    let baseUrl = opts.baseUrl;
    let isSecure = opts.isSecure;
    let version = opts.version;
    let requester = request.defaults(opts);

    async function findServers(endpoint) {
        return new Promise((resolve, reject) => {
            try {
                requester({
                    method: 'get',
                    url: '/endpoint/' + endpoint + '/findEach' + (version ? ('?version=' + version) : ''),
                    json: true,
                }, (error, response, body) => {
                    if (error) return reject(error);
                    let { servers } = body;
                    resolve(servers);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async function findRegionPreference(targetRegions, opts) {
        opts = Object.assign({ points: 10, timeout: isSecure ? 7000 : 5000 }, opts);
        let { points: targetPoints, timeout } = opts;

        let servers = await findServers('latency');
        let points = {};
        let sockets = [];

        let bestServer = await Promise.race(
            Object.entries(servers)
            .map(([region, server]) => new Promise((resolve, reject) => {
                try {
                    if (!targetRegions.includes(region)) return;
                    setTimeout(resolve, timeout);

                    let server = servers[region];
                    let host = isSecure ? (server.id + '.s.m28n.net') : (server.ipv4 || ('[' + server.ipv6 + ']'));
                    let protocol = isSecure ? 'wss://' : 'ws://';
                    let socket = new WebSocket(protocol + host, opts);

                    sockets.push(socket);

                    socket.binaryType = 'arraybuffer';
                    socket.onopen = () => {
                        let bd = new Uint8Array(1);
                        bd[0] = 0;
                        socket.send(bd);
                    };
                    socket.onmessage = (message) => {
                        let bd = new Uint8Array(message.data);
                        if (bd[0] == 0) {
                            if (!points[region]) points[region] = 0;
                            points[region]++;
                            if (points[region] >= targetPoints) {
                                return resolve(server);
                            } else {
                                socket.send(message.data);
                            }
                        }
                    };
                    socket.onerror = console.error;
                    socket.onclose = () => {
                        sockets = sockets.filter(x => x != socket);
                    }
                } catch (error) {
                    console.error(error);
                }
            }))
        );
        if (bestServer == null) throw new Error('Latency testing failed, no servers replied to probes in time');

        sockets.forEach(socket => {
            try {
                socket.onopen = null;
                socket.onmessage = null;
                socket.onerror = null;
                socket.onclose = null;
                socket.close();
            } catch (e) {}
        });

        let aux = [];
        for (let region in points) {
            aux.push({
                region: region,
                points: points[region]
            });
        }
        aux.sort((a, b) => b.points - a.points);
        let regions = aux.map(x => x.region);
        return regions;
    }

    async function findServerPreference(endpoint, opts) {
        let servers = await findServers(endpoint, opts);

        if (!servers) throw new Error("Invalid response");
        var avRegions = [];
        for (var region in servers) avRegions.push(region);
        if (avRegions.length == 0) throw new Error("Couldn't find any servers in any region");
        if (avRegions.length == 1) {
            for (var region in servers) {
                return [ servers[region] ];
            }
        }
        
        let prefRegions = await findRegionPreference(avRegions, opts);
        var serverList = prefRegions.map(region => servers[region]);
        return serverList;
    }

    async function findServerById(id) {
        if (typeof id != "string") throw new Error("Id must be a string");
        if (!/^[0-9a-zA-Z]+$/.test(id)) throw new Error("Invalid server Id");

        return new Promise(async (resolve, reject) => {
            try {
                requester({
                    method: 'get',
                    url: '/server/' + id,
                    json: true,
                }, (error, response, body) => {
                    if (error) return reject(error);
                    resolve(body);
                });
            } catch (error) {
                reject(error);
            }
        })
    }

    return {
        findServers,
        findRegionPreference,
        findServerPreference,
        findServerById,
    };
}