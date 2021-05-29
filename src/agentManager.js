const SocksProxyAgent = require('socks-proxy-agent');

// Put your proxies here
let agents = [
    // This configuration will not work for you

    new SocksProxyAgent('socks://127.0.0.1:22000'),
    new SocksProxyAgent('socks://127.0.0.1:22001'),
    new SocksProxyAgent('socks://127.0.0.1:22002'),
    new SocksProxyAgent('socks://127.0.0.1:22003'),
    new SocksProxyAgent('socks://127.0.0.1:22004'),
    new SocksProxyAgent('socks://127.0.0.1:22005'),
    new SocksProxyAgent('socks://127.0.0.1:22006'),
    new SocksProxyAgent('socks://127.0.0.1:22007'),
    new SocksProxyAgent('socks://127.0.0.1:22008'),
    new SocksProxyAgent('socks://127.0.0.1:22009'),
    new SocksProxyAgent('socks://127.0.0.1:22010'),
    new SocksProxyAgent('socks://127.0.0.1:22011'),
    new SocksProxyAgent('socks://127.0.0.1:22012'),
    new SocksProxyAgent('socks://127.0.0.1:22013'),
    new SocksProxyAgent('socks://127.0.0.1:22014'),
];
let agentIndex = 0;

module.exports = {
    nextAgent: () => {
        let agent = agents[agentIndex++];
        if (agentIndex >= agents.length) agentIndex = 0;
        return agent;
    },
}