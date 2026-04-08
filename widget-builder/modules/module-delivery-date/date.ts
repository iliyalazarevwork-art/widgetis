export function computeDeliveryDate(offsetDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date;
}

export type DateLabels = {
  tomorrow: string;
  dayAfterTomorrow: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
};

const DAY_KEYS: readonly (keyof DateLabels)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function formatDate(date: Date, offsetDays: number, labels: DateLabels): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const dateStr = `${day}.${month}.${year}`;

  if (offsetDays === 1) return labels.tomorrow;
  if (offsetDays === 2) return labels.dayAfterTomorrow;
  if (offsetDays <= 7) return `${labels[DAY_KEYS[date.getDay()]!]}, ${dateStr}`;
  return dateStr;
}
