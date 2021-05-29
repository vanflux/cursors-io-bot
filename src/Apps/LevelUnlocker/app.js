const Bot = require('../../Bot/bot');
const utils = require('../../utils');
const levels = require('./LevelPass/levels');
const agentManager = require('../../agentManager');

module.exports = async function run() {
    // You can find thousands of bugs... Im still working on it, but if you can help, feel free 
    console.log('Run level unlocker app');

    const botCount = 32; // Oh yeah, you WILL need 15 proxies...
    // In the end, you will have 4 bots. You can optimize this

    console.log('Creating bot pool');
    let botPool = await Promise.all(
        new Array(botCount)
        .fill()
        .map(x => new Promise(async(resolve, reject) => {
            let success = false;
            let bot;
            while(!success) {
                let agent = agentManager.nextAgent();
                bot = new Bot({ delay: 80, agent });
                try {
                    await bot.connect();
                    success = true;
                } catch (exc) {
                    console.log('Bot connect error', exc.message);
                }
            }
            resolve(bot);
        }))
    );
    console.log('Bot pool created');

    let start = Date.now();
    try {
        let remainingBots = botPool.slice(0);
        for (let i = 0; i < levels.length; i++) {
            console.log('Unlocking ', i+1);
            await levels[i].unlock(remainingBots);
            console.log('Passing ', i+1);
            await Promise.all(remainingBots
                .map(bot =>
                    new Promise(async (resolve, reject) => {
                        try {
                            await levels[i].pass(bot);
                            resolve();
                        } catch (exc) {
                            reject(exc);
                        }
                    })
                )
            );
        }
        let end = Date.now();
        console.log((end-start), 'ms');
        console.log('End, remaining bots =', remainingBots.length);

        for (let bot of remainingBots) {
            setTimeout(maintainFinalText(bot));
            await utils.sleep(5000);
        }

        function maintainFinalText(bot) {
            return async () => {
                let x = 138;
                await bot.navigateTo(x, 5);
                while(true) {
                    await bot.goTo(x, 5);
                    await bot.drawText('Vanflux has been ', 1, 1);
                    await bot.goTo(x+5, 10);
                    await bot.drawText('unlocking levels', 1, 1);
                    await bot.goTo(x+10, 15);
                    await bot.drawText('around here', 1, 1);
                }
            };
        }

        await utils.sleep(120 * 1000); // Wait to minutes to end the app

    } catch (exc) {
        console.error('Error on level unlock main loop', exc);
    }

    console.log('Disconnecting bot pool');
    await Promise.all(
        botPool
        .map(bot => new Promise(async(resolve, reject) => {
            try {
                await bot.disconnect();
                resolve();
            } catch (exc) {
                reject(exc);
            }
        }))
    );
    console.log('Bot pool disconnected');
}