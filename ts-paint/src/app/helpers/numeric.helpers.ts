import { isDefined } from './typescript.helpers';

/** An undefined or null bound means "no limit". 0 is a regular bound. */
export function validateMinMax(value: number, minValue: number, maxValue: number): boolean {
  if (isDefined(minValue) && !isNaN(value) && minValue > value) {
    return false;
  }
  if (isDefined(maxValue) && !isNaN(value) && maxValue < value) {
    return false;
  }
  return true;
}
