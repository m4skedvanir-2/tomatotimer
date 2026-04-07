const { calcTime, scheduleTimer, cancelTimer } = require('../utils/timer');
const { setFocusStatus, restoreStatus, sendMessage, getStatus } = require('../utils/slack');
const pool = require('../db');

async function ppCommand({ command, ack, respond }) {
  await ack();
  const args = command.text.trim();

  // /pp stop
  if (args === 'stop') {
    const { rows } = await pool.query(
      `SELECT * FROM timers WHERE team_id=$1 AND user_id=$2 AND status IN ('focus','break')`,
      [command.team_id, command.user_id]
    );
    if (rows.length === 0) {
      await respond('タイマーは動いていません🍅');
      return;
    }
    cancelTimer(rows[0].id);
    await pool.query(
      `UPDATE timers SET status='stopped' WHERE id=$1`,
      [rows[0].id]
    );
    await respond('タイマーを停止しました🍅');
    return;
  }

  // /pp status
  if (args === 'status') {
    const { rows } = await pool.query(
      `SELECT * FROM timers WHERE team_id=$1 AND user_id=$2 AND status IN ('focus','break')`,
      [command.team_id, command.user_id]
    );
    if (rows.length === 0) {
      await respond('タイマーは動いていません🍅');
      return;
    }
    const timer = rows[0];
    const now = Date.now();
    const start = new Date(timer.started_at).getTime();
    const focusEnd = start + timer.focus_min * 60 * 1000;
    const breakEnd = focusEnd + timer.break_min * 60 * 1000;
    const remaining = timer.status === 'focus'
        ? Math.max(0, Math.ceil((focusEnd - now) / 1000 / 60))
        : Math.max(0, Math.ceil((breakEnd - now) / 1000 / 60));
    await respond(`現在${timer.status === 'focus' ? '集中中' : '休憩中'}です。残り約${remaining}分🍅`);
    return;
  }

  // /pp set ○○
  if (args.startsWith('set ')) {
    const customText = args.slice(4).trim();
    if (!customText) {
      await respond('文言を入力してください（例：/pp set 作業中）');
      return;
    }
    await pool.query(
      `INSERT INTO user_settings (team_id, user_id, custom_status_text)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id, user_id) DO UPDATE SET custom_status_text=$3`,
      [command.team_id, command.user_id, customText]
    );
    await respond(`ステータス文言を「${customText}」に設定しました🍅`);
    return;
  }

  // /pp または /pp 60
  // コマンド以外の入力が正しいかここで確認
  if (args !== '' && !/^\d+$/.test(args)) {
    await respond('使い方：/pp, /pp 60, /pp stop, /pp status, /pp set ○○');
    return;
  }

  const totalMin = args === '' ? 30 : parseInt(args, 10);
  if (totalMin < 6 || totalMin > 480) {
    await respond('時間は6〜480分で指定してください🍅');
    return;
  }

  // すでに動いてるタイマーがあれば拒否
  const { rows: running } = await pool.query(
    `SELECT id FROM timers WHERE team_id=$1 AND user_id=$2 AND status IN ('focus','break')`,
    [command.team_id, command.user_id]
  );
  if (running.length > 0) {
    await respond('すでにタイマーが動いています。/pp stop で停止してください🍅');
    return;
  }

  const { focusMin, breakMin } = calcTime(totalMin);
  // ユーザー設定取得
  const { rows: settings } = await pool.query(
    `SELECT user_token, custom_status_text FROM user_settings WHERE team_id=$1 AND user_id=$2`,
    [command.team_id, command.user_id]
  );
  const userToken = settings[0]?.user_token;
  const customStatusText = settings[0]?.custom_status_text || 'tomato time';

  // 元のステータス保持
  let prevStatusText = '';
  let prevStatusEmoji = '';
  if (userToken) {
    const prev = await getStatus(userToken);
    prevStatusText = prev.statusText;
    prevStatusEmoji = prev.statusEmoji;
  }

  const { rows } = await pool.query(
    `INSERT INTO timers (team_id, user_id, channel_id, focus_min, break_min, status, prev_status_text, prev_status_emoji)
     VALUES ($1, $2, $3, $4, $5, 'focus', $6, $7) RETURNING *`,
    [command.team_id, command.user_id, command.channel_id, focusMin, breakMin, prevStatusText, prevStatusEmoji]
  );
  const timer = rows[0];
  
  // ステータスを🍅に変更
  if (userToken) {
    await setFocusStatus(userToken, customStatusText);
  }

  // ワークスペースのbotトークン取得
  const { rows: ws } = await pool.query(
    `SELECT bot_token FROM workspaces WHERE team_id=$1`,
    [command.team_id]
  );
  const botToken = ws[0]?.bot_token;

  scheduleTimer({
    timerId: timer.id,
    startedAt: timer.started_at,
    focusMin,
    breakMin,
    onFocusEnd: async () => {
        console.log('フォーカスタイマー終了:botToken:', botToken ? '存在する' : 'undefined');
      await pool.query(`UPDATE timers SET status='break' WHERE id=$1`, [timer.id]);
      // Slack通知・ステータス変更
      console.log('フォーカス終了処理開始');
      if (botToken) {
        await sendMessage(botToken, timer.channel_id, `<@${command.user_id}> さん🍅料理をどうぞ！休憩${breakMin}分`);
        }
        // TODO: トマト料理をランダムに変える処理の追加
    },
    onBreakEnd: async () => {
        console.log('ブレイク終了処理開始');
      await pool.query(`UPDATE timers SET status='done' WHERE id=$1`, [timer.id]);
      if (userToken) {
        await restoreStatus(userToken, prevStatusText, prevStatusEmoji);
      }
      if (botToken) {
        await sendMessage(botToken, timer.channel_id, `<@${command.user_id}> さん🍅Time終了です！`);
      }
    },
  });

  await respond({
    response_type: 'in_channel',
    text: `<@${command.user_id}> は🍅料理を開始します！\n集中${focusMin}分・休憩${breakMin}分`,
  });
}

module.exports = { ppCommand };