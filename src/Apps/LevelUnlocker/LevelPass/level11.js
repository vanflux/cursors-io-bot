const utils = require('../../../utils');
let isUnlocked = true;

module.exports = {
    isUnlocked() {
        return isUnlocked;
    },
    async unlock(bots) {
        if (bots.length < 5) throw new Error('This level needs 5 bots to unlock');

        let bot1 = bots.shift();
        let bot2 = bots.shift();
        let bot3 = bots.shift();
        let bot4 = bots.shift();
        let bot5 = bots.shift();


        let [ btn1, btn2, btn3, btn4, btn5 ] = await bot1.search('clickBtn');

        await bot3.navigateTo(btn3);
        
        setInterval(async () => {
            await bot3.click();
        }, 100);

        await bot1.navigateTo(btn1);
        await bot2.navigateTo(btn2);
        await bot4.navigateTo(btn4);
        await bot5.navigateTo(btn5);

        setInterval(async () => {
            await bot1.click();
            await bot2.click();
            await bot4.click();
            await bot5.click();
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