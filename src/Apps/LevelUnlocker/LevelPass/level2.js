const utils = require('../../../utils');

module.exports = {
    isUnlocked() {
        return true;
    },
    async unlock(bots) {
        // This level doesnt need bots
    },
    async pass(bot) {
        let [ _, green ] = await bot.search('green');
        bot.navigateTo(green);
        await bot.waitLevelLoad();
    },
}