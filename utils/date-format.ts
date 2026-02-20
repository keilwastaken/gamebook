const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

export function formatShortDate(timestamp: number): string {
  return shortDateFormatter.format(new Date(timestamp));
}
