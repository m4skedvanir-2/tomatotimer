function calcTime(totalMin) {
    //pomodoro: 25 min work, 5 min break
    const focusMin = Math.round(totalMin * (5 / 6));
    const breakMin = totalMin - focusMin;
    return { focusMin, breakMin };
}

module.exports = { calcTime };