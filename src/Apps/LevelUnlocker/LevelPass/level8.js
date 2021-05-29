const utils = require('../../../utils');

module.exports = {
    isUnlocked() {
        return true;
    },
    async unlock(bots) {
        // This level doesnt need bots
    },
    async pass(bot) {
        let greens = await bot.search('green');
        let green = greens.find(x => x.x == 100 && x.y == 0);
        bot.navigateTo(green);
        await bot.waitLevelLoad();
    },
}