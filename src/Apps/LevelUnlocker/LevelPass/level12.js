const utils = require('../../../utils');
let isUnlocked = true;

module.exports = {
    isUnlocked() {
        return isUnlocked;
    },
    async unlock(bots) {
        if (bots.length < 6) throw new Error('This level needs 6 bots to unlock');

        let bot1 = bots.shift();
        let bot2 = bots.shift();
        let bot3 = bots.shift();
        let bot4 = bots.shift();
        let bot5 = bots.shift();
        let bot6 = bots.shift();


        let [ hbtn1, hbtn2 ] = await bot1.search('hoverBtn');
        let [ btn1, btn2, btn3, btn4 ] = await bot1.search('clickBtn');
        
        await bot1.navigateTo(Math.round(hbtn1.x + hbtn1.width / 2) - 10, Math.round(hbtn1.y + hbtn1.height / 2));
        await bot2.navigateTo(Math.round(hbtn2.x + hbtn2.width / 2) + 10, Math.round(hbtn2.y + hbtn2.height / 2));

        await bot3.navigateTo(btn1);
        await bot4.navigateTo(btn2);
        await bot5.navigateTo(btn3);
        await bot6.navigateTo(btn4);

        setInterval(async () => {
            await bot3.click();
            await bot4.click();
            await bot5.click();
            await bot6.click();
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