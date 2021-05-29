const utils = require('../../../utils');
let isUnlocked = false;

module.exports = {
    isUnlocked() {
        return isUnlocked;
    },
    async unlock(bots) {
        if (bots.length < 1) throw new Error('This level needs 1 bot to unlock');

        let bot1 = bots.shift();
        let [ btn ] = await bot1.search('hoverBtn');
        await bot1.navigateTo(btn);
        isUnlocked = true;
    },
    async pass(bot) {
        if (!isUnlocked) throw new Error('This level isnt unlocked');
        let [ green ] = await bot.search('green');
        bot.navigateTo(green);
        await bot.waitLevelLoad();
    },
}