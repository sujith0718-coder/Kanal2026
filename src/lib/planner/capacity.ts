import { AvailabilityWindow, UserProfile } from '@/types';
import { getDay } from 'date-fns';

/**
 * Calculates total available minutes for a given date based on user availability windows & daily limits
 */
export function getDailyAvailableMinutes(
  date: Date,
  availabilityWindows: AvailabilityWindow[],
  userProfile?: UserProfile
): number {
  const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday...
  
  const dayWindows = availabilityWindows.filter((w) => w.dayOfWeek === dayOfWeek);
  const totalWindowMinutes = dayWindows.reduce((sum, w) => sum + w.durationMinutes, 0);

  const dailyCap = userProfile?.dailyCapacityMinutes || 240; // Default 4 hours

  // Total capacity cannot exceed user's explicit daily capacity limit or window duration
  if (availabilityWindows.length > 0) {
    return totalWindowMinutes > 0 ? Math.min(dailyCap, totalWindowMinutes) : 0;
  }
  return dailyCap;
}

/**
 * Summarizes available study capacity over a multi-day window
 */
export function calculateTotalCapacityForDays(
  dates: Date[],
  availabilityWindows: AvailabilityWindow[],
  userProfile?: UserProfile
): number {
  return dates.reduce(
    (total, date) => total + getDailyAvailableMinutes(date, availabilityWindows, userProfile),
    0
  );
}
