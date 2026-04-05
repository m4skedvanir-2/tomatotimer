function calcTime(totalMin) {
    //pomodoro: 25 min work, 5 min break
    const focusMin = Math.round(totalMin * (5 / 6));
    const breakMin = totalMin - focusMin;
    return { focusMin, breakMin };
}

// 起動中のsetTimeoutを管理
const activeTimers = new Map();

function scheduleTimer({ timerId, startedAt, focusMin, breakMin, onFocusEnd, onBreakEnd }) {
    const now = Date.now();
    const start = new Date(startedAt).getTime();
    const focusEnd = start + focusMin * 60 * 1000;
    const breakEnd = focusEnd + breakMin * 60 * 1000;

    const focusRemaining = focusEnd - now;
    const breakRemaining = breakEnd - now;

    const timers = {};

    if (focusRemaining > 0) {
        // フォーカスタイマーがまだ残っている場合は、フォーカスタイマーをセットし、終了後にブレイクタイマーをセットする
        timers.focus = setTimeout(async () => {
            await onFocusEnd();
            if (breakRemaining > 0) {
                timers.break = setTimeout(async () => {
                    await onBreakEnd();
                    activeTimers.delete(timerId);
                }, breakEnd - Date.now());
            }
        }, focusRemaining);
    } else if (breakRemaining > 0) {
        // フォーカスタイマーは終了しているが、ブレイクタイマーがまだ残っている場合は、ブレイクタイマーをセットする
        timers.break = setTimeout(async () => {
            await onBreakEnd();
            activeTimers.delete(timerId);
        }, breakRemaining);
    } else {
        // すでに両方とも終了している場合は即座に両方のコールバックを呼び出す
        onFocusEnd();
        onBreakEnd();
    }
    activeTimers.set(timerId, timers);
}

function cancelTimer(timerId) {
    const timers = activeTimers.get(timerId);
    if (timers) {
        if (timers.focus) clearTimeout(timers.focus);
        if (timers.break) clearTimeout(timers.break);
        activeTimers.delete(timerId);
    }
}

module.exports = { calcTime, scheduleTimer, cancelTimer };