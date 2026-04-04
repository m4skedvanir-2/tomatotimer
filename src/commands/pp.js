const { calcTime } = require('../utils/timer');

async function ppCommand({ command, ack, respond }) {
    await ack();
    
    const args = command.text.trim();

    // /pp stop
    if (args === 'stop') {
        //タイマー停止のロジックをここに実装
        await respond('タイマーを停止しました。🍅');
        return;
    }
    // /pp status
    if (args === 'status') {
        //タイマーの状態を取得して表示するロジックをここに実装
        //まだ未実装
        await respond('現在のタイマーの状態は...🍅');
        return;
    }
    // /pp set ○○
    if (args.startsWith('set ')) {
        //ステータス文言を変更する処理
        const customText = args.slice(4);
        await respond(`ステータスを「${customText}」に設定しました。🍅`);
        return;
    }
    // /pp もしくは /pp ○○
    //引数がない場合は30分、ある場合は引数の分数でタイマーをセットするロジックをここに実装
    const totalMin = args ? parseInt(args) : 30;
    const { focusMin, breakMin } = calcTime(totalMin);
    await respond({
        response_type: 'in_channel',
        text: `<@${command.user_id}> は🍅料理を開始します！\n集中${focusMin}分・休憩${breakMin}分🍅`,
    });
}

module.exports = { ppCommand };