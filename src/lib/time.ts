import { DateTime } from 'luxon';

export function tz() {
  const zone = process.env.APP_TIMEZONE || 'Asia/Kolkata';
  return { zone };
}

export function yesterdayRange() {
  const { zone } = tz();
  const now = DateTime.now().setZone(zone);
  const y = now.minus({ days: 1 }).startOf('day');
  const start = y;
  const end = y.endOf('day');
  return { start, end };
}

export function toYYYYMMDD(dt: DateTime) {
  return dt.toFormat('yyyy-LL-dd');
}
