export function buildSearchQuery(eventName: string, year: number = new Date().getFullYear()): string {
  return `${eventName} ${year} programme`;
}
