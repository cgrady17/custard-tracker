import { toZonedTime } from 'date-fns-tz';

export const getMilwaukeeDate = () => {
  const now = new Date();
  return toZonedTime(now, 'America/Chicago');
};
