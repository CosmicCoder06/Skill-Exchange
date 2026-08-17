function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function fillDailySeries(rows, days = 7, now = new Date()) {
  const totals = new Map(rows.map((row) => [row._id, row.total]));
  const series = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - offset);
    const key = formatDateKey(date);
    series.push({ date: key, total: totals.get(key) || 0 });
  }

  return series;
}

module.exports = { escapeRegex, fillDailySeries, formatDateKey };

