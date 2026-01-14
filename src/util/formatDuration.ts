/**
 * Format duration in milliseconds to a human-readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string (e.g., "522ms", "1s 244ms", "2d 3h 4m 5s 123ms")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;

  if (seconds < 60) {
    return milliseconds > 0 ? `${seconds}s ${milliseconds}ms` : `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    const parts = [`${minutes}m`];
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
    if (milliseconds > 0) parts.push(`${milliseconds}ms`);
    return parts.join(' ');
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    const parts = [`${hours}h`];
    if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
    if (milliseconds > 0) parts.push(`${milliseconds}ms`);
    return parts.join(' ');
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  const parts = [`${days}d`];
  if (remainingHours > 0) parts.push(`${remainingHours}h`);
  if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
  if (milliseconds > 0) parts.push(`${milliseconds}ms`);

  return parts.join(' ');
}
