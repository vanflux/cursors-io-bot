const request = require('request');
const WebSocket = require('ws');

module.exports = class ServerFinder {
    constructor(opts) {
        opts = Object.assign({ version: null }, opts);

        this.baseUrl = 'https://api.n.m28.io';
        this.isSecure = true;
        this.version = opts.version;
        this.requester = request.defaults(opts);
    }

    async findServers(endpoint) {
        return new Promise((resolve, reject) => {
            try {
                this.requester({
                    method: 'get',
                    url: this.baseUrl + '/endpoint/' + endpoint + '/findEach' + (this.version ? ('?version=' + this.version) : ''),
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

    async findRegionPreference(targetRegions, opts) {
        opts = Object.assign({ points: 10, timeout: this.isSecure ? 7000 : 5000 }, opts);
        let { points: targetPoints, timeout } = opts;

        let servers = await this.findServers('latency');
        let points = {};
        let sockets = [];

        let bestServer = await Promise.race(
            Object.entries(servers)
            .map(([region, server]) => new Promise((resolve, reject) => {
                try {
                    if (!targetRegions.includes(region)) return;
                    setTimeout(resolve, timeout);

                    let server = servers[region];
                    let host = this.isSecure ? (server.id + '.s.m28n.net') : (server.ipv4 || ('[' + server.ipv6 + ']'));
                    let protocol = this.isSecure ? 'wss://' : 'ws://';
                    let socket = new WebSocket(protocol + host);

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

    async findServerPreference(endpoint, opts) {
        let servers = await this.findServers(endpoint, opts);

        if (!servers) throw new Error("Invalid response");
        var avRegions = [];
        for (var region in servers) avRegions.push(region);
        if (avRegions.length == 0) throw new Error("Couldn't find any servers in any region");
        if (avRegions.length == 1) {
            for (var region in servers) {
                return [ servers[region] ];
            }
        }
        
        let prefRegions = await this.findRegionPreference(avRegions, opts);
        var serverList = prefRegions.map(region => servers[region]);
        return serverList;
    }

    async findServerById(id) {
        if (typeof id != "string") throw new Error("Id must be a string");
        if (!/^[0-9a-zA-Z]+$/.test(id)) throw new Error("Invalid server Id");

        return new Promise(async (resolve, reject) => {
            try {
                this.requester({
                    method: 'get',
                    url: this.baseUrl + '/server/' + id,
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
}