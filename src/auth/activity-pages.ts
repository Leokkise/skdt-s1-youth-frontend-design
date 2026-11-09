export function activityPages(current: number, count: number): (number | 'gap')[] {
  if (count <= 4) return Array.from({ length: count }, (_, index) => index);
  if (current >= count - 3) return [0, 'gap', count - 3, count - 2, count - 1];
  const start = Math.max(0, current - 1);
  return [start, start + 1, start + 2, 'gap', count - 1];
}
