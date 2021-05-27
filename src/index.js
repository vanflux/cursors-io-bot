const WebSocket = require('ws');
const Bot = require('./bot');

async function main() {
    let bot = new Bot();
    await bot.setup();
    await bot.connect();

    let aux = false;
    bot.on('scene load', () => {
        if (aux) {
            bot.moveCursor(bot.cursorX + 50, bot.cursorY, true);
            bot.click();
            return;
        }
        aux = true;

        let goodObj = bot.sceneObjs.find(x => x.type == 2 && x.isBad == false);

        bot.moveCursor(goodObj.x, goodObj.y);
    });
}

main();