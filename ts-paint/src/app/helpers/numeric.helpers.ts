export function validateMinMax(value: number, minValue: number, maxValue: number): boolean {
  if (minValue && !isNaN(value) && minValue > value) {
    return false;
  }
  if (maxValue && !isNaN(value) && maxValue < value) {
    return false;
  }
  return true;
}
