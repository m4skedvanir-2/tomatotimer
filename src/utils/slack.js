const { WebClient } = require('@slack/web-api');

// タイマー中のステータス変更
async function setFocusStatus(userToken, statusText, statusEmoji = ':tomato:') {
    const client = new WebClient(userToken);
    await client.users.profile.set({
        profile: {
            status_text: statusText,
            status_emoji: statusEmoji,
            status_expiration: 0,
        },
    });
}

// タイマー終了後のステータス解除
async function restoreStatus(userToken, statusText,statusEmoji) {
    const client = new WebClient(userToken);
    await client.users.profile.set({
        profile: {
            status_text: statusText || '',
            status_emoji: statusEmoji || '',
            status_expiration: 0,
        },
    });
}

// チャンネルにメッセージを送信
async function sendMessage(botToken, channelId, text) {
    const client = new WebClient(botToken);
    if (channelId.startsWith('D')) {
        // DMの場合はユーザーIDを取得してから送信
        const result = await client.conversations.open({ channel: channelId });
        await client.chat.postMessage({
            channel: result.channel.id,
            text: text,
        });
        
    } else {
        await client.chat.postMessage({
            channel: channelId,
            text: text,
        });
    }
}

// 現在のステータスを取得
async function getStatus(userToken) {
    const client = new WebClient(userToken);
    const result = await client.users.profile.get({});
    return {
        statusText: result.profile.status_text || '',
        statusEmoji: result.profile.status_emoji || '',
    };
}

module.exports = { setFocusStatus, restoreStatus, sendMessage, getStatus };