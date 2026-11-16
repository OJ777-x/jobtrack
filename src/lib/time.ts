// Small time helpers kept outside any component body — React's purity lint
// rule flags Date.now()/new Date() calls made directly inside a component.
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysFromNowKey(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function isOlderThanDays(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() > days * 24 * 60 * 60 * 1000;
}
