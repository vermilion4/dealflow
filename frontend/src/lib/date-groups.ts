/**
 * Groups items by calendar date (e.g., "March 16, 2026").
 * Items are assumed to already be sorted by date descending.
 */
export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string,
): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = []

  for (const item of items) {
    const date = new Date(getDate(item))
    const label = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.items.push(item)
    } else {
      groups.push({ label, items: [item] })
    }
  }

  return groups
}
