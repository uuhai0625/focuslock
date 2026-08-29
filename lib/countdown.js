const flCountdown = (() => {
  function format(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const parts = h > 0 ? [h, m, s] : [m, s];
    return parts.map((v) => String(v).padStart(2, '0')).join(':');
  }

  return { format };
})();
