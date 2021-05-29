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

        let bot1 = new Bot({ drawingsEnabled: true, delay: 50, agent: null });      // Non proxy bot
        await bot1.connect();
        let trigger = new Trigger(brandX, brandY, brandWidth, brandHeight);
        bot1.on('click', obj => trigger.check(obj.x, obj.y, obj));
        trigger.on('triggered', (x, y, { cursor }) => {
            clicks++;
        });
        setTimeout(maintainBrand(bot1), 0 * 1000);


        let bot2 = new Bot({ drawingsEnabled: false, delay: 50, agent: null });     // Non proxy bot
        await bot2.connect();
        setTimeout(maintainBrand(bot2), 3 * 1000);

        if (runClicksBots) {
            // My proxies are terrible, this is the reason for DELAY = 80

            let bot3 = new Bot({ drawingsEnabled: false, delay: 80, agent: agent1 });   // Proxied bot
            await bot3.connect();
            setTimeout(maintainClicks(bot3), 0 * 1000);

            let bot4 = new Bot({ drawingsEnabled: false, delay: 80, agent: agent1 });   // Proxied bot
            await bot4.connect();
            setTimeout(maintainClicksCount(bot4), 0 * 1000);
        }

        function maintainClicks(bot) {
            return async () => {
                let x = brandX - 35;
                let y = brandY + brandHeight + 2;
                await bot.navigateTo(x, y);
                while(true) {
                    await bot.goTo(x, y);
                    await bot.drawText('Clicks:', 1, 1);
                }
            };
        }
        
        function maintainClicksCount(bot) {
            return async () => {
                let x = brandX - 7;
                let y = brandY + brandHeight + 2;
                await bot.navigateTo(x, y);
                while(true) {
                    await bot.goTo(x, y);
                    await bot.drawText(clicks + '', 1, 1);
                }
            };
        }

        function maintainBrand(bot) {
            return async () => {
                await bot.navigateTo(brandX, brandY);
                while(true) {
                    await bot.goTo(brandX, brandY);
                    await bot.drawRect(brandWidth, brandHeight);
                    await bot.goTo(brandX+7, brandY+2);
                    await bot.drawText('VANFLUX', 2, 3);
                    await bot.goTo(brandX+3, brandY+12);
                    await bot.drawText('bot on github', 1, 1);
                }
            };
        }
    } catch (exc) {
        console.error(exc);
    }
};