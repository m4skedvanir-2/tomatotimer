const { App, ExpressReceiver } = require('@slack/bolt');
const { ppCommand } = require('./commands/pp');
const { setupInstallRoutes } = require('./web/install');
const { setupOAuthRoutes } = require('./web/oauth');
require('dotenv').config();

const receiver = new ExpressReceiver({
    signingSecret: process.env.SIGNING_SECRET,
});

setupOAuthRoutes(receiver.router);

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver: receiver,
});

setupInstallRoutes(receiver.router);

app.command('/pp', ppCommand);

(async () => {
    await app.start(process.env.PORT || 3000);
    console.log('p10er awaken!!!');
})();

