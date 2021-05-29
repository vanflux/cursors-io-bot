const utils = require('../../../utils');
let isUnlocked = true;

module.exports = {
    isUnlocked() {
        return isUnlocked;
    },
    async unlock(bots) {
        if (bots.length < 3) throw new Error('This level needs 3 bots to unlock');

        let bot1 = bots.shift();
        let bot2 = bots.shift();
        let bot3 = bots.shift();

        let [ btn1, btn2 ] = await bot1.search('hoverBtn');
        await bot1.navigateTo(btn1);
        await bot2.navigateTo(btn2);
        await bot3.navigateTo(btn2);
        isUnlocked = true;
    },
    async pass(bot) {
        if (!isUnlocked) throw new Error('This level isnt unlocked');
        let [ green ] = await bot.search('green');
        bot.navigateTo(green);
        await bot.waitLevelLoad();
    },
}