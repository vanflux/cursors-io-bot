const Bot = require('./Bot/bot');
const utils = require('./utils');

async function main() {
    let bot = new Bot();
    await bot.setup();
    await bot.connect();

    bot.on('level load', async () => {
        if (bot.getLevelLoadCount() != 2) return;

        let [hb] = await bot.search('hoverBtn');
        await bot.navigateTo(hb.x, hb.y);

        let bot2 = new Bot();
        await bot2.setup();
        await bot2.connect();
        
        bot2.on('level load', async () => {
            switch (bot2.getLevelLoadCount()) {
                case 2: {
                    let [ge] = await bot2.search('green');
                    await bot2.navigateTo(ge.x, ge.y);
                    break;
                }
                case 3: {
                    let curX = bot2.getX();
                    let curY = bot2.getY();

                    let i = 0;
                    while(true) {
                        await bot2.goTo(curX + 20 * Math.cos(i), curY + 20 * Math.sin(i), true);
                        i += 0.2;
                        await bot2.click();
                        await utils.sleep(100);
                    }
                }
            }
        });
    });
}

main();