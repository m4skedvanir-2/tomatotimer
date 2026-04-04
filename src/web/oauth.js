const { WebClient } = require('@slack/web-api');
require('dotenv').config();
const path = require('path');
const pool = require('../db');

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

function setupOAuthRoutes(expressApp) {
    // Add to Slack　ボタンの遷移先
    expressApp.get('/slack/install', (req, res) => {
        const url = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=commands,users.profile:write&redirect_uri=${REDIRECT_URI}`;
        res.redirect(url);
    });

    // OAuthのコールバックURL
    expressApp.get('/slack/callback', async (req, res) => {
        const { code } = req.query;
        try {
            const client = new WebClient();
            console.log('Received OAuth code:', code);
            console.log('CLIENT_ID:', SLACK_CLIENT_ID);
            console.log('CLIENT_SECRET:', SLACK_CLIENT_SECRET ? '存在する' : 'undefined');
            const result = await client.oauth.v2.access({
                client_id: SLACK_CLIENT_ID,
                client_secret: SLACK_CLIENT_SECRET,
                code: code,
                redirect_uri: REDIRECT_URI,
            });
            // DBにトークン保存
            await pool.query(
                `INSERT INTO workspaces (team_id, bot_token)
                 VALUES ($1, $2)
                 ON CONFLICT (team_id) DO UPDATE SET bot_token = $2`,
                [result.team.id, result.bot_token]
            );
            console.log('OAuth result:', JSON.stringify(result, null, 2));
            if (result.authed_user?.access_token) {
                await pool.query(
                    `INSERT INTO users (team_id, user_id, user_token)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (team_id, user_id) DO UPDATE SET user_token = $3`,
                    [result.team.id, result.authed_user.id, result.authed_user.access_token]
                );
            }

            console.log('OAuth Success:', result.team.name);
            res.sendFile(path.join(__dirname, '../../public/success.html'));
        } catch (error) {
            console.error('OAuth Error:', error);
            res.status(500).send('OAuth認証に失敗しました。もう一度試してください。');
        }
    });
}

module.exports = { setupOAuthRoutes };