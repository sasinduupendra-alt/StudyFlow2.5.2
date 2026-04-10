/**
 * Parses a time string like "08:00 AM" or "14:30" into total minutes from start of day.
 */
export const parseTimeStr = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  const trimmed = timeStr.trim();
  const parts = trimmed.split(' ');
  const time = parts[0];
  const modifier = parts[1]?.toUpperCase();
  
  let [hours, minutes] = time.split(':').map(Number);
  
  if (isNaN(hours)) hours = 0;
  if (isNaN(minutes)) minutes = 0;

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
};

/**
 * Formats total minutes from start of day into a string like "08:00 AM".
 */
export const formatTimeStr = (totalMinutes: number): string => {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const modifier = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  if (hours === 0) hours = 12;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${modifier}`;
};
