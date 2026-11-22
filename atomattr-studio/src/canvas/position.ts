export function isFreeformPosition(position?: string | null): boolean {
  return position === 'absolute' || position === 'fixed';
}
