const Bot = require('../../Bot/bot');
const Trigger = require('../../trigger');
const agentManager = require('../../agentManager');
const utils = require('../../utils');

const brandWidth = 55;
const brandHeight = 17;
const brandX = 63;
const brandY = 162;

module.exports = async function run() {
    try {
        console.log('Run vanflux app');

        let runClicksBots = false; // Needs proxy, configure your agentManager
        let clicks = 0;
        
        let agent1 = agentManager.nextAgent(); // Proxy
        if (agent1 == null) {
            console.log('Configure your agent manager with your proxies');
        }

        let bot1 = new Bot({ drawingsEnabled: false, delay: 50, agent: null, reconnectTries: -1 });      // Non proxy bot
        
        let trigger = new Trigger(brandX, brandY, brandWidth, brandHeight);
        bot1.on('click', obj => trigger.check(obj.x, obj.y, obj));
        trigger.on('triggered', (x, y, { cursor }) => {
            clicks++;
        });
        setTimeout(maintainBrand(bot1), 0 * 1000);
        bot1.on('connected', () => console.log('Bot1 connected'));
        bot1.on('disconnected', () => console.log('Bot1 disconnected'));
        bot1.on('ready', () => console.log('Bot1 ready'));
        await bot1.connect();


        let bot2 = new Bot({ drawingsEnabled: false, delay: 50, agent: null, reconnectTries: -1 });     // Non proxy bot
        setTimeout(maintainBrand(bot2), 3 * 1000);
        bot2.on('connected', () => console.log('Bot2 connected'));
        bot2.on('disconnected', () => console.log('Bot2 disconnected'));
        bot2.on('ready', () => console.log('Bot2 ready'));
        await bot2.connect();

        if (runClicksBots) {
            // My proxies are terrible, this is the reason for DELAY = 80

            let bot3 = new Bot({ drawingsEnabled: false, delay: 80, agent: agent1, reconnectTries: -1 });   // Proxied bot
            setTimeout(maintainClicks(bot3), 0 * 1000);
            bot3.on('connected', () => console.log('Bot3 connected'));
            bot3.on('disconnected', () => console.log('Bot3 disconnected'));
            bot3.on('welcome level load', () => console.log('Bot3 welcome level load'))
            bot3.on('level load', () => console.log('Bot3 level load'))
            bot3.on('ready', () => console.log('Bot3 ready'));
            await bot3.connect();

            let bot4 = new Bot({ drawingsEnabled: false, delay: 80, agent: agent1, reconnectTries: -1 });   // Proxied bot
            setTimeout(maintainClicksCount(bot4), 0 * 1000);
            bot4.on('connected', () => console.log('Bot4 connected'));
            bot4.on('disconnected', () => console.log('Bot4 disconnected'));
            bot4.on('welcome level load', () => console.log('Bot4 welcome level load'))
            bot4.on('level load', () => console.log('Bot4 level load'))
            bot4.on('ready', () => console.log('Bot4 ready'));
            await bot4.connect();
        }

        function maintainClicks(bot) {
            return async () => {
                let x = brandX - 35;
                let y = brandY + brandHeight + 2;
                await bot.navigateTo(x, y);
                await utils.sleep(1000);
                while(true) {
                    await bot.navigateTo(x, y);
                    await utils.sleep(100);
                    while(bot.isReady()) {
                        await bot.goTo(x, y);
                        await bot.drawText('Clicks:', 1, 1);
                        await utils.sleep(100);
                    }
                    await utils.sleep(1000);
                }
            };
        }
        
        function maintainClicksCount(bot) {
            return async () => {
                let x = brandX - 7;
                let y = brandY + brandHeight + 2;
                while(true) {
                    await bot.navigateTo(x, y);
                    await utils.sleep(100);
                    while(bot.isReady()) {
                        await bot.goTo(x, y);
                        await bot.drawText(clicks + '', 1, 1);
                        await utils.sleep(100);
                    }
                    await utils.sleep(1000);
                }
            };
        }

        function maintainBrand(bot) {
            return async () => {
                while(true) {
                    await bot.navigateTo(brandX, brandY);
                    while(bot.isReady()) {
                        await bot.goTo(brandX, brandY);
                        await bot.drawRect(brandWidth, brandHeight);
                        await bot.goTo(brandX+7, brandY+2);
                        await bot.drawText('VANFLUX', 2, 3);
                        await bot.goTo(brandX+3, brandY+12);
                        await bot.drawText('bot on github', 1, 1);
                        await utils.sleep(100);
                    }
                    await utils.sleep(1000);
                }
            };
        }
    } catch (exc) {
        console.error(exc);
    }
};