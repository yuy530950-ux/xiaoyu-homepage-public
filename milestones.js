(() => {
  'use strict';
  const DAY = 86400000;
  const ZONE_OFFSET = 8 * 3600000;
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
  });

  function dayNumber(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) throw new Error('Invalid milestone date');
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new Error('Invalid milestone date');
    }
    return date.getTime() / DAY;
  }

  function snapshot(config, now = new Date()) {
    const parts = Object.fromEntries(formatter.formatToParts(now).map(p => [p.type, p.value]));
    const year = Number(parts.year);
    const todayISO = `${parts.year}-${parts.month}-${parts.day}`;
    const today = dayNumber(todayISO);
    const suffix = `${String(config.birthdayMonth).padStart(2, '0')}-${String(config.birthdayDay).padStart(2, '0')}`;
    let nextBirthday = dayNumber(`${year}-${suffix}`);
    if (nextBirthday < today) nextBirthday = dayNumber(`${year + 1}-${suffix}`);
    return {
      todayISO,
      birthdayDays: nextBirthday - today,
      changeDays: Math.max(0, today - dayNumber(config.changeStart)),
      aiDays: Math.max(0, today - dayNumber(config.aiStart)),
      nextUpdate: (today + 1) * DAY - ZONE_OFFSET + 100
    };
  }

  // The same calculation is checked with Node; browsers keep it private to this widget.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { snapshot };
    return;
  }
  const root = document.querySelector('[data-milestones]');
  if (!root) return;
  const config = {
    birthdayMonth: Number(root.dataset.birthdayMonth),
    birthdayDay: Number(root.dataset.birthdayDay),
    changeStart: root.dataset.changeStart,
    aiStart: root.dataset.aiStart
  };
  const numbers = new Intl.NumberFormat('zh-CN');
  let timer;
  function refresh() {
    clearTimeout(timer);
    const now = new Date();
    try {
      const value = snapshot(config, now);
      const birthday = root.querySelector('[data-milestone="birthday"]');
      birthday.textContent = value.birthdayDays === 0 ? '生日快乐' : numbers.format(value.birthdayDays);
      birthday.classList.toggle('birthday-today', value.birthdayDays === 0);
      root.querySelector('[data-birthday-unit]').textContent = value.birthdayDays === 0 ? '' : '天后';
      root.querySelector('[data-milestone="change"]').textContent = numbers.format(value.changeDays);
      root.querySelector('[data-milestone="ai"]').textContent = numbers.format(value.aiDays);
      root.dataset.updatedDate = value.todayISO;
      timer = setTimeout(refresh, Math.max(1000, value.nextUpdate - now.getTime()));
    } catch (error) {
      root.querySelectorAll('[data-milestone]').forEach(e => { e.textContent = '—'; });
    }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('pageshow', refresh);
  refresh();
})();
