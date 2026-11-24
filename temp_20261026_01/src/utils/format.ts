import dayjs from 'dayjs';

export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/** 时钟：18:32 */
export const formatClock = (time: string): string => dayjs(time).format('HH:mm');

/** 日期时间：10-26 18:32 */
export const formatDateTime = (time: string): string => dayjs(time).format('MM-DD HH:mm');

/** 日期键：2026-10-26 */
export const dayKey = (time: string): string => dayjs(time).format('YYYY-MM-DD');

/** 今天 / 昨天 / 前天 / 10月24日 */
export const dayLabel = (time: string): string => {
  const target = dayjs(time).startOf('day');
  const today = dayjs().startOf('day');
  const diff = today.diff(target, 'day');
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff === 2) return '前天';
  return target.format('M月D日');
};

/** 刚刚 / 18分钟前 / 3小时前 / 昨天 / 2天前 */
export const relativeText = (time: string): string => {
  const target = dayjs(time);
  const minutes = dayjs().diff(target, 'minute');
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = dayjs().diff(target, 'hour');
  if (hours < 24) return `${hours}小时前`;
  const days = dayjs().diff(target, 'day');
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return target.format('M月D日');
};

export const isToday = (time: string): boolean => dayKey(time) === dayjs().format('YYYY-MM-DD');

/** 今天 08:12 / 昨天 21:40 */
export const formatSyncTime = (time: string): string => {
  if (!time) return '尚未同步';
  return `${dayLabel(time)} ${formatClock(time)}`;
};
