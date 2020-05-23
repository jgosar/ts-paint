// @ts-ignore
export function assertUnreachable(x: never) {}

export function isDefined(object: any) {
  return object !== null && object !== undefined;
}

export function isEmpty(array: any[]) {
  return !isDefined(array) || array.length === 0;
}

export function lastElement<T>(array: T[]): T | undefined {
  if (!isEmpty(array)) {
    return array[array.length - 1];
  }
}

export function min(numbers: number[]): number {
  let minNumber: number = numbers[0];
  numbers.forEach((num) => {
    if (num < minNumber) {
      minNumber = num;
    }
  });

  return minNumber;
}

export function max(numbers: number[]): number {
  let maxNumber: number = numbers[0];
  numbers.forEach((num) => {
    if (num > maxNumber) {
      maxNumber = num;
    }
  });

  return maxNumber;
}
