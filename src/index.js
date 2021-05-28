const Bot = require('./Bot/bot');
const utils = require('./utils');

async function main() {
    let bot = new Bot();
    await bot.setup();
    await bot.connect();
    let bot2 = new Bot();
    await bot2.setup();
    await bot2.connect();

    let x = 200;
    let y = 182;

    bot.on('level load', async () => {
        if (bot.getLevelLoadCount() != 2) return;

        await bot.navigateTo(x, y);
        while(true) {
            await bot.goTo(x+8, y+2);
            await bot.drawText('vanflux');
            await bot.goTo(x, y);
            await bot.drawRect(58, 17);
        }
    });
    bot2.on('level load', async () => {
        if (bot2.getLevelLoadCount() != 2) return;

        await bot2.navigateTo(x, y);
        while(true) {
            await bot2.goTo(x+3, y+12);
            await bot2.drawText('bot on github', 1, 1);
            await bot2.goTo(x, y);
            await bot2.drawRect(58, 17);
        }
    });
}

main();