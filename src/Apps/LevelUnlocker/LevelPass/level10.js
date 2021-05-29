const utils = require('../../../utils');
let isUnlocked = true;

module.exports = {
    isUnlocked() {
        return isUnlocked;
    },
    async unlock(bots) {
        if (bots.length < 3) throw new Error('This level needs 3 bot to unlock');

        let bot1 = bots.shift();
        let bot2 = bots.shift();
        let bot3 = bots.shift();


        let [ btn1 ] = await bot1.search('hoverBtn');
        let [ btn2, btn3 ] = await bot1.search('clickBtn');

        await bot1.navigateTo(btn1);
        await bot2.navigateTo(btn2);
        await bot3.navigateTo(btn3);

        setInterval(async () => {
            await bot2.click();
            await bot3.click();
        }, 100);

        isUnlocked = true;
    },
    async pass(bot) {
        if (!isUnlocked) throw new Error('This level isnt unlocked');
        let [ green ] = await bot.search('green');
        bot.navigateTo(green);
        await bot.waitLevelLoad();
    },
}