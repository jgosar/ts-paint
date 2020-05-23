import { isDefined } from './typescript.helpers';

export function replaceStringBetweenIndexes(
  currentValue: string,
  startIndex: number,
  endIndex: number,
  valueToInsert: string
) {
  if (!isDefined(currentValue) || currentValue === '') {
    return valueToInsert;
  }

  if (!isDefined(startIndex) || startIndex < 0) {
    startIndex = 0;
  }
  if (!isDefined(endIndex) || endIndex > currentValue.length) {
    endIndex = currentValue.length;
  }

  if (startIndex > currentValue.length || endIndex < 0 || startIndex > endIndex) {
    return currentValue;
  }

  const stringBeginning: string = currentValue.substring(0, startIndex);
  const stringEnd: string = currentValue.substring(endIndex, currentValue.length);

  return stringBeginning + valueToInsert + stringEnd;
}
