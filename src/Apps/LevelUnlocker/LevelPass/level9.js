const utils = require('../../../utils');
let isUnlocked = true;

module.exports = {
    isUnlocked() {
        return isUnlocked;
    },
    async unlock(bots) {
        if (bots.length < 2) throw new Error('This level needs 2 bot to unlock');

        let bot1 = bots.shift();
        let bot2 = bots.shift();


        let [ btn ] = await bot1.search('hoverBtn');
        
        await bot1.navigateTo(btn);
        await bot2.navigateTo(btn);

        isUnlocked = true;
    },
    async pass(bot) {
        if (!isUnlocked) throw new Error('This level isnt unlocked');
        let [ green ] = await bot.search('green');
        bot.navigateTo(green);
        await bot.waitLevelLoad();
    },
}